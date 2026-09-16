const Anthropic = require("@anthropic-ai/sdk").default;
const fs = require("fs");
const path = require("path");

const client = new Anthropic();

// 재시도 설정
const RETRY_CONFIG = {
  maxRetries: 5,
  initialDelayMs: 5000, // 5초
  maxDelayMs: 60000, // 최대 60초
  backoffMultiplier: 2,
  retryableErrors: ["overloaded_error", "rate_limit_error", "api_error"],
};

// 지수 백오프를 사용한 재시도 함수
async function withRetry(fn, operationName = "API call") {
  let lastError;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // 재시도 가능한 오류인지 확인
      const errorType = error?.error?.type || error?.type || "";
      const isRetryable = RETRY_CONFIG.retryableErrors.some(
        (type) => errorType.includes(type) || error.message?.includes(type)
      );
      
      // 상태 코드로도 확인 (529 = overloaded, 529 = rate limit)
      const statusCode = error?.status || error?.statusCode;
      const isRetryableStatus = [429, 529, 500, 502, 503].includes(statusCode);
      
      if (!isRetryable && !isRetryableStatus) {
        console.error(`❌ Non-retryable error in ${operationName}:`, error.message || error);
        throw error;
      }
      
      if (attempt === RETRY_CONFIG.maxRetries) {
        console.error(`❌ Max retries (${RETRY_CONFIG.maxRetries}) exceeded for ${operationName}`);
        throw error;
      }
      
      // 지수 백오프 계산
      const delay = Math.min(
        RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1),
        RETRY_CONFIG.maxDelayMs
      );
      
      console.log(`⚠️ ${operationName} failed (attempt ${attempt}/${RETRY_CONFIG.maxRetries})`);
      console.log(`   Error: ${errorType || error.message || "Unknown error"}`);
      console.log(`   Retrying in ${delay / 1000} seconds...`);
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}

// sleep 함수
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 날짜 유틸리티
function getToday(overrideDate = null) {
  // 명령줄 인자로 날짜 지정 가능: node script.js 2025-11-28
  const dateArg = overrideDate || process.argv[2];
  let today;
  
  if (dateArg && /^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
    // 지정된 날짜 사용
    const [year, month, day] = dateArg.split('-').map(Number);
    today = new Date(year, month - 1, day);
    console.log(`📅 지정된 날짜로 리포트 생성: ${dateArg}`);
  } else {
    today = new Date();
  }
  
  return {
    year: today.getFullYear(),
    month: String(today.getMonth() + 1).padStart(2, "0"),
    day: String(today.getDate()).padStart(2, "0"),
    dateStr: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
    koreanDate: `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`,
  };
}

function getLastWeekRange(baseDate = null) {
  const dateArg = baseDate || process.argv[2];
  let today;
  
  if (dateArg && /^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
    const [year, month, day] = dateArg.split('-').map(Number);
    today = new Date(year, month - 1, day);
  } else {
    today = new Date();
  }
  
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  
  return {
    start: formatDate(lastWeek),
    end: formatDate(today),
  };
}

// 현재 주력 계약월 계산 (3월물/5월물/7월물/9월물/12월물 중 가장 가까운 것)
function getActiveContractMonth() {
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentYear = today.getFullYear();
  
  // ICE 커피 선물 계약월: 3월(H), 5월(K), 7월(N), 9월(U), 12월(Z)
  const contractMonths = [
    { month: 3, code: 'H', name: '3월' },
    { month: 5, code: 'K', name: '5월' },
    { month: 7, code: 'N', name: '7월' },
    { month: 9, code: 'U', name: '9월' },
    { month: 12, code: 'Z', name: '12월' }
  ];
  
  // 현재 달 기준으로 가장 가까운 주력 계약 찾기 (최소 1개월 앞)
  let activeContract = null;
  let contractYear = currentYear;
  
  for (const contract of contractMonths) {
    if (contract.month > currentMonth + 1) {
      activeContract = contract;
      break;
    }
  }
  
  // 현재 연도에 없으면 다음 해의 첫 계약
  if (!activeContract) {
    activeContract = contractMonths[0]; // 3월물
    contractYear = currentYear + 1;
  }
  
  const yearCode = String(contractYear).slice(-2);
  return {
    symbol: `KC${activeContract.code}${yearCode}`,
    name: `${contractYear}년 ${activeContract.name}물`,
    shortName: `${yearCode}년 ${activeContract.name}물`,
    year: contractYear,
    monthCode: activeContract.code,
    monthName: activeContract.name
  };
}

// CSS 템플릿 로드
function loadCssTemplate() {
  const cssPath = path.join(__dirname, "report-template.css");
  if (fs.existsSync(cssPath)) {
    return fs.readFileSync(cssPath, "utf8");
  }
  // 기본 CSS (템플릿 파일이 없는 경우)
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Pretendard', sans-serif; background: #0a0a0a; color: #e0e0e0; line-height: 1.8; }
    .container { max-width: 800px; margin: 0 auto; padding: 60px 40px; }
  `;
}

// 프롬프트 템플릿 로드 함수
function loadPromptTemplate(filename) {
  const promptPath = path.join(__dirname, "prompts", filename);
  if (fs.existsSync(promptPath)) {
    return fs.readFileSync(promptPath, "utf8");
  }
  console.warn(`⚠️ Prompt file not found: ${filename}`);
  return null;
}

// 템플릿 변수 치환 함수
function replaceTemplateVariables(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

// 시스템 프롬프트 로드
function loadSystemPrompt(activeContract) {
  const template = loadPromptTemplate("system-prompt.md");
  
  if (template) {
    return replaceTemplateVariables(template, {
      CONTRACT_SYMBOL: activeContract.symbol,
      CONTRACT_NAME: activeContract.name,
    });
  }
  
  // 폴백: 기본 시스템 프롬프트
  return `당신은 커피 선물 시장 전문 애널리스트이자 Coffee Market Info의 시니어 리서치 담당입니다.
매주 기관 투자자 및 업계 전문가를 위한 프리미엄 커피 시장 주간 동향 리포트를 작성합니다.
주력 분석 대상: ${activeContract.symbol} (${activeContract.name})`;
}

// 사용자 프롬프트 로드
function loadUserPrompt(date, weekRange, activeContract, cssTemplate) {
  const variables = {
    KOREAN_DATE: date.koreanDate,
    DATE_STR: date.dateStr,
    YEAR: date.year.toString(),
    MONTH: date.month,
    WEEK_START: weekRange.start,
    WEEK_END: weekRange.end,
    CONTRACT_SYMBOL: activeContract.symbol,
    CONTRACT_NAME: activeContract.name,
    CONTRACT_SHORT_NAME: activeContract.shortName,
    CSS_TEMPLATE: cssTemplate,
  };
  
  // 각 프롬프트 파일 로드
  const userPromptTemplate = loadPromptTemplate("user-prompt-template.md");
  const reportStructure = loadPromptTemplate("report-structure.md");
  const htmlOutputFormat = loadPromptTemplate("html-output-format.md");
  
  // 모든 파일이 존재하면 결합
  if (userPromptTemplate && reportStructure && htmlOutputFormat) {
    const combinedPrompt = `${userPromptTemplate}\n\n---\n\n# 리포트 구조\n\n${reportStructure}\n\n---\n\n# 출력 형식\n\n${htmlOutputFormat}`;
    return replaceTemplateVariables(combinedPrompt, variables);
  }
  
  // 폴백: 파일이 없으면 null 반환 (기존 인라인 프롬프트 사용)
  console.log("📝 Using inline prompts (prompt files not found)");
  return null;
}

// 인라인 사용자 프롬프트 빌드 (폴백용)
function buildInlineUserPrompt(date, weekRange, activeContract, cssTemplate) {
  return `오늘 날짜: ${date.koreanDate}
데이터 수집 기간: ${weekRange.start} ~ ${weekRange.end}
주력 계약: ${activeContract.symbol} (${activeContract.name})

## 필수 수행 작업

### 1단계: 가격 데이터 수집 (웹 검색 필수)
다음 검색을 수행하여 **실제 가격 데이터**를 확인하세요:
1. "site:barchart.com coffee futures KC" - Barchart에서 아라비카 선물 가격
2. "ICE arabica coffee ${activeContract.symbol} price" - 주력 계약 가격  
3. "ICE robusta coffee futures price RC" - 로부스타 가격
4. "USD BRL exchange rate" - 브라질 환율
5. "ICE certified coffee stocks inventory" - 인증 재고
6. "coffee COT report CFTC" - 선물 포지션 데이터

**중요**: ${activeContract.name} 가격이 300센트 이상인지 확인하세요. 최근 커피 가격은 역사적 고점 수준입니다.

### 2단계: 뉴스 및 펀더멘털 수집 (발행일 기준 최근 1주일만)
**중요**: 반드시 ${weekRange.start} ~ ${weekRange.end} 기간 내 뉴스만 검색하고 분석하세요.
발행일(${date.dateStr}) 기준으로 최근 7일 이내의 기사만 포함해야 합니다.

다음 키워드로 검색:
- "coffee market news ${weekRange.end}" - 최신 커피 시장 뉴스
- "coffee price ${date.year} ${date.month}" - 이번 달 커피 가격 뉴스
- "Brazil coffee ${weekRange.end}" - 브라질 최신 뉴스
- "Vietnam robusta coffee ${date.year}" - 베트남 로부스타 뉴스
- "Colombia coffee exports"
- "Volcafe coffee"
- "StoneX coffee"
- "EUDR coffee regulation ${date.year}"
- "coffee tariff ${date.year}"

### 3단계: 종합 분석 및 전망 작성
수집한 정보를 바탕으로 시장 구조, 수급 밸런스, 가격 전망, 투자 시사점을 분석하세요.

## 리포트 구조
체계적이고 종합적인 HTML 리포트를 생성하세요:
1. 히어로 섹션, 2. 핵심 지표 카드 (4개), 3. 시장 개요, 4. 가격 동향, 
5. 주간 핵심 뉴스, 6. 산지별 동향, 7. 수급 분석, 7.5. 종합 분석,
8. 가격 전망 (시나리오 그리드), 9. 리스크 요인, 10. 투자 전략, 
10.5. 한국 로스터리 전략 가이드, 11. 출처, 12. 푸터

## 출력 형식
완전한 HTML 파일을 생성해주세요.

### HTML 헤더:
<!DOCTYPE html>로 시작, Google Analytics (G-GX9R36120J) 포함, Pretendard 폰트 로드

### 메타데이터 블록:
<!--REPORT_META { ... } REPORT_META--> 형식으로 date, title, summary, tags, price_current, price_change 등 포함

### CSS:
\`\`\`css
${cssTemplate}
\`\`\`

### 가격 표시:
- 아라비카: XXX.XX센트/파운드
- 로부스타: $X,XXX/MT
- 환율: X.XXXX

**HTML 코드만 출력하세요. 반드시 <!DOCTYPE html>로 시작해야 합니다.**`;
}

// Claude API로 웹 검색 및 리포트 생성 (agentic loop with web search)
async function generateReport() {
  const date = getToday();
  const weekRange = getLastWeekRange();
  const activeContract = getActiveContractMonth();
  const cssTemplate = loadCssTemplate();

  console.log(`Generating report for ${date.dateStr}...`);
  console.log(`Analysis period: ${weekRange.start} to ${weekRange.end}`);
  console.log(`Active contract: ${activeContract.symbol} (${activeContract.name})`);

  // 외부 파일에서 시스템 프롬프트 로드
  const systemPrompt = loadSystemPrompt(activeContract);
  console.log("📄 System prompt loaded from external file");

  // 외부 파일에서 사용자 프롬프트 로드 시도
  let userPrompt = loadUserPrompt(date, weekRange, activeContract, cssTemplate);
  
  // 외부 파일이 없으면 기본 인라인 프롬프트 사용
  if (!userPrompt) {
    userPrompt = buildInlineUserPrompt(date, weekRange, activeContract, cssTemplate);
  } else {
    console.log("📄 User prompt loaded from external files");
  }

  try {
    // 웹 검색 도구를 사용한 agentic loop
    let messages = [
      {
        role: "user",
        content: userPrompt,
      },
    ];

    let response = await withRetry(
      () =>
        client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 16000,
          system: systemPrompt,
          tools: [
            {
              type: "web_search_20250305",
              name: "web_search",
              max_uses: 15,
            },
          ],
          messages: messages,
        }),
      "Initial API call"
    );

    console.log(`Initial response - Stop reason: ${response.stop_reason}`);

    // Agentic loop: 도구 사용이 완료될 때까지 반복
    while (response.stop_reason === "tool_use") {
      const assistantMessage = { role: "assistant", content: response.content };
      messages.push(assistantMessage);

      // 도구 결과 처리
      const toolResults = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          console.log(`Tool called: ${block.name}`);
          if (block.input && block.input.query) {
            console.log(`  Query: ${block.input.query}`);
          }
          // 웹 검색은 서버 측에서 자동으로 처리됨
          // 결과는 다음 응답에 포함됨
        }
      }

      // 다음 응답 요청 (재시도 로직 포함)
      response = await withRetry(
        () =>
          client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 16000,
            system: systemPrompt,
            tools: [
              {
                type: "web_search_20250305",
                name: "web_search",
                max_uses: 15,
              },
            ],
            messages: messages,
          }),
        "Agentic loop API call"
      );

      console.log(`Loop response - Stop reason: ${response.stop_reason}`);
    }

    // 최종 텍스트 추출
    let htmlContent = "";
    for (const block of response.content) {
      if (block.type === "text") {
        htmlContent += block.text;
      }
    }

    // HTML이 코드 블록으로 감싸져 있는 경우 처리
    htmlContent = htmlContent.trim();
    if (htmlContent.startsWith("```html")) {
      htmlContent = htmlContent.slice(7);
    } else if (htmlContent.startsWith("```")) {
      htmlContent = htmlContent.slice(3);
    }
    if (htmlContent.endsWith("```")) {
      htmlContent = htmlContent.slice(0, -3);
    }
    htmlContent = htmlContent.trim();

    // 가격 유효성 검증
    const priceValidation = validatePrices(htmlContent, activeContract);
    if (!priceValidation.valid) {
      console.warn("⚠️ Price validation warning:", priceValidation.message);
    }

    // 파일 저장
    const dirPath = path.join("Reports", date.year.toString(), date.month);
    const fileName = `coffee-market-update-${date.dateStr}.html`;
    const filePath = path.join(dirPath, fileName);

    // 디렉토리 생성
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // HTML 파일 저장
    fs.writeFileSync(filePath, htmlContent, "utf8");
    console.log(`Report saved: ${filePath}`);

    // reports.json 업데이트
    updateReportsJson(date, fileName, htmlContent);

    return filePath;
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
}

// 가격 유효성 검증
function validatePrices(htmlContent, activeContract) {
  // 아라비카 가격이 합리적인 범위 내인지 확인 (2024-2025년 기준 200-450센트)
  const pricePattern = /(\d{2,3}\.?\d{0,2})\s*(센트|¢|cents)/gi;
  const matches = htmlContent.match(pricePattern);
  
  if (!matches) {
    return { valid: false, message: "가격 데이터를 찾을 수 없습니다." };
  }

  // 현재 시장 상황: 아라비카는 300센트 이상의 고가 (2025년 11월 기준)
  const minExpectedPrice = 300;
  const maxExpectedPrice = 450;
  
  let foundReasonablePrice = false;
  for (const match of matches) {
    const price = parseFloat(match.replace(/[^0-9.]/g, ""));
    if (price >= minExpectedPrice && price <= maxExpectedPrice) {
      foundReasonablePrice = true;
      break;
    }
  }

  if (!foundReasonablePrice) {
    return { 
      valid: false, 
      message: `${activeContract.name} 가격이 예상 범위(${minExpectedPrice}-${maxExpectedPrice}센트) 밖입니다. Barchart에서 확인하세요.` 
    };
  }

  return { valid: true, message: "가격 검증 통과" };
}

// reports.json 업데이트
function updateReportsJson(date, fileName, htmlContent) {
  const reportsJsonPath = "reports.json";

  let reportsData = { reports: [] };

  if (fs.existsSync(reportsJsonPath)) {
    try {
      reportsData = JSON.parse(fs.readFileSync(reportsJsonPath, "utf8"));
    } catch (e) {
      console.log("Creating new reports.json");
    }
  }

  // HTML에서 메타데이터 추출
  let title = "커피 선물 시장 주간 동향";
  let subtitle = "Coffee Futures Market Weekly Update";
  let summary = "커피 시장 주간 동향 분석 리포트";
  let tags = ["주간동향", "아라비카", "ICE선물"];
  let reportType = "weekly";
  let priceCurrent = "";
  let priceChange = "";
  let fairValue = "";

  const metaMatch = htmlContent.match(/<!--REPORT_META\s*([\s\S]*?)\s*REPORT_META-->/);
  if (metaMatch) {
    try {
      const metaData = JSON.parse(metaMatch[1]);
      title = metaData.title || title;
      subtitle = metaData.subtitle || subtitle;
      summary = metaData.summary || summary;
      tags = metaData.tags || tags;
      reportType = metaData.type || reportType;
      priceCurrent = metaData.price_current || "";
      priceChange = metaData.price_change || "";
      fairValue = metaData.fair_value || "";
    } catch (e) {
      console.log("Could not parse report metadata");
    }
  }

  const newReport = {
    date: date.dateStr,
    displayDate: date.koreanDate,
    title: title,
    subtitle: subtitle,
    summary: summary,
    tags: tags,
    type: reportType,
    link: `Reports/${date.year}/${date.month}/${fileName}`,
    year: date.year.toString(),
    month: date.month,
    price_current: priceCurrent,
    price_change: priceChange,
    fair_value: fairValue,
  };

  // 중복 체크 후 업데이트 또는 추가
  const existingIndex = reportsData.reports.findIndex((r) => r.date === date.dateStr);
  if (existingIndex >= 0) {
    reportsData.reports[existingIndex] = newReport;
    console.log("reports.json updated (replaced existing)");
  } else {
    reportsData.reports.unshift(newReport);
    console.log("reports.json updated (added new)");
  }
  
  fs.writeFileSync(reportsJsonPath, JSON.stringify(reportsData, null, 2), "utf8");
}

// 실행
generateReport()
  .then((filePath) => {
    console.log(`✅ Weekly report generated successfully: ${filePath}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed to generate report:", error);
    process.exit(1);
  });
