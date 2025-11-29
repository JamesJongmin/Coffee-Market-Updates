const Anthropic = require("@anthropic-ai/sdk").default;
const fs = require("fs");
const path = require("path");

const client = new Anthropic();

// 날짜 유틸리티
function getToday() {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: String(today.getMonth() + 1).padStart(2, "0"),
    day: String(today.getDate()).padStart(2, "0"),
    dateStr: today.toISOString().split("T")[0],
    koreanDate: `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`,
  };
}

function getLastWeekRange() {
  const today = new Date();
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {
    start: lastWeek.toISOString().split("T")[0],
    end: today.toISOString().split("T")[0],
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

// Claude API로 웹 검색 및 리포트 생성 (agentic loop with web search)
async function generateReport() {
  const date = getToday();
  const weekRange = getLastWeekRange();
  const activeContract = getActiveContractMonth();
  const cssTemplate = loadCssTemplate();

  console.log(`Generating report for ${date.dateStr}...`);
  console.log(`Analysis period: ${weekRange.start} to ${weekRange.end}`);
  console.log(`Active contract: ${activeContract.symbol} (${activeContract.name})`);

  const systemPrompt = `당신은 커피 선물 시장 전문 애널리스트입니다. 
매주 커피 시장 주간 동향 리포트를 작성합니다.

## 중요 원칙

1. **정확한 가격 데이터**: 반드시 웹 검색을 통해 실제 가격 데이터를 확인하세요.
   - 주력 분석 대상: ${activeContract.symbol} (${activeContract.name})
   - 가격 출처: Barchart (https://www.barchart.com/futures/quotes/kc*0/futures-prices)
   - 가격은 센트/파운드 단위로 표시 (예: 381.20센트)
   
2. **가격 전망의 근거**: 가격 전망과 공정가치는 반드시 다음에 기반하여 산출하세요:
   - 수집한 뉴스와 시장 데이터
   - 공급/수요 전망 (Volcafe, StoneX, USDA 등)
   - ICE 재고 수준
   - 기술적 분석 (지지/저항선)
   - 환율 동향 (USD/BRL)

3. **객관성**: 과장된 표현("폭등", "급락")을 피하고 "상승", "하락" 등 중립적 표현을 사용합니다.

4. **출처 명시**: 모든 정보에는 반드시 출처를 명시합니다.`;

  const userPrompt = `오늘 날짜: ${date.koreanDate}
데이터 수집 기간: ${weekRange.start} ~ ${weekRange.end}
주력 계약: ${activeContract.symbol} (${activeContract.name})

## 필수 수행 작업

### 1단계: 가격 데이터 수집 (웹 검색 필수)

다음 검색을 수행하여 **실제 가격 데이터**를 확인하세요:

1. "site:barchart.com coffee futures KC" - Barchart에서 아라비카 선물 가격
2. "ICE arabica coffee ${activeContract.symbol} price" - 주력 계약 가격  
3. "ICE robusta coffee futures price" - 로부스타 가격
4. "USD BRL exchange rate today" - 브라질 환율
5. "ICE certified coffee stocks" - 인증 재고

**중요**: ${activeContract.name} 가격이 300센트 이상인지 확인하세요. 최근 커피 가격은 역사적 고점 수준입니다.

### 2단계: 뉴스 수집 (최근 7일)

다음 키워드로 검색:
- "coffee futures" ${date.year} price
- Brazil coffee weather ${date.year}
- Vietnam coffee production ${date.year}
- Colombia coffee exports
- Volcafe coffee forecast
- StoneX coffee production

### 3단계: 가격 전망 작성

수집한 정보를 바탕으로 다음을 분석하세요:

1. **단기 전망 (1-3개월)**: 지지/저항선, 예상 레인지
2. **공정가치 추정**: 공급 부족/과잉, 재고 수준, 계절적 요인 고려
3. **리스크 요인**: 상방/하방 촉매

전망은 반드시 수집한 데이터를 근거로 작성하세요. 예를 들어:
- "Volcafe가 X만백 공급 부족을 전망하고 있어..."
- "ICE 재고가 Y만백으로 역사적 저점 수준이므로..."
- "브라질 헤알화가 Z.XX로 약세/강세를 보여..."

## 리포트 구조

다음 구조로 HTML 리포트를 생성해주세요:

1. **시장 개요**: 핵심 요약 3-4줄 + 현재 가격 카드
   - ${activeContract.name} 가격 (센트/파운드)
   - 주간 변동률
   - ICE 인증재고
   - USD/BRL 환율

2. **주요 가격 동향**: 계약월별 가격 테이블
   - ${activeContract.name} (주력 계약)
   - 다음 계약월물들
   - 주간/월간/연간 변동률

3. **주간 핵심 뉴스**: 5-7개 뉴스
   - 뉴스별 소제목 + 2-3문장 요약
   - 출처 URL 필수

4. **산지별 동향**: 브라질/베트남/콜롬비아
   - 기상 상황
   - 수확 진행 상황
   - 환율 및 수출 동향

5. **수급 전망**: 주요 기관 전망치 테이블
   - USDA, ICO, StoneX, Volcafe 등

6. **가격 전망 및 공정가치 분석**
   - 단기 (1-3개월): 예상 레인지, 지지/저항선
   - 공정가치: 수집된 데이터 기반 산출 근거
   - 시장 평가: 고평가/저평가/적정 여부

7. **리스크 요인**: 상방 3개, 하방 3개

8. **출처**: 모든 참조 링크

## 출력 형식

완전한 HTML 파일을 생성해주세요. 다음 조건을 충족해야 합니다:

1. 메타데이터 블록 포함:
<!--REPORT_META
{
    "title": "커피 선물 시장 주간 동향 | ${date.koreanDate}",
    "date": "${date.dateStr}",
    "summary": "핵심 요약 1-2문장 (실제 가격 포함)",
    "tags": ["주간동향", "아라비카", "${activeContract.shortName}", "관련태그들"],
    "price_current": "실제가격",
    "price_change": "변동폭 (예: +5.30 (+1.4%))",
    "fair_value": "공정가치 범위 (예: 375-395)",
    "report_type": "weekly",
    "analysis_period": "${weekRange.start} to ${weekRange.end}"
}
REPORT_META-->

2. Google Analytics 포함: G-GX9R36120J

3. 다크 테마 CSS (아래 스타일을 그대로 <style> 태그에 포함):
\`\`\`css
${cssTemplate}
\`\`\`

4. 가격 표시 규칙:
- 아라비카: XXX.XX센트/파운드 또는 XXX.XX¢/lb
- 로부스타: $X,XXX/MT
- 환율: X.XXXX

HTML 코드만 출력하세요. 설명이나 마크다운 코드블록 없이 순수 HTML만 출력합니다.`;

  try {
    // 웹 검색 도구를 사용한 agentic loop
    let messages = [
      {
        role: "user",
        content: userPrompt,
      },
    ];

    let response = await client.messages.create({
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
    });

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

      // 다음 응답 요청
      response = await client.messages.create({
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
      });

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
  let summary = "커피 시장 주간 동향 분석 리포트";
  let tags = ["주간동향", "아라비카", "ICE선물"];
  let priceCurrent = "";
  let priceChange = "";
  let fairValue = "";

  const metaMatch = htmlContent.match(/<!--REPORT_META\s*([\s\S]*?)\s*REPORT_META-->/);
  if (metaMatch) {
    try {
      const metaData = JSON.parse(metaMatch[1]);
      summary = metaData.summary || summary;
      tags = metaData.tags || tags;
      priceCurrent = metaData.price_current || "";
      priceChange = metaData.price_change || "";
      fairValue = metaData.fair_value || "";
    } catch (e) {
      console.log("Could not parse report metadata");
    }
  }

  const newReport = {
    title: `커피 선물 시장 주간 동향 | ${date.koreanDate}`,
    date: date.dateStr,
    link: `Reports/${date.year}/${date.month}/${fileName}`,
    summary: summary,
    tags: tags,
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
