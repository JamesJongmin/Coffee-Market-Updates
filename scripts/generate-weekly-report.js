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

// Claude API로 웹 검색 및 리포트 생성 (agentic loop with web search)
async function generateReport() {
  const date = getToday();
  const weekRange = getLastWeekRange();
  const activeContract = getActiveContractMonth();
  const cssTemplate = loadCssTemplate();

  console.log(`Generating report for ${date.dateStr}...`);
  console.log(`Analysis period: ${weekRange.start} to ${weekRange.end}`);
  console.log(`Active contract: ${activeContract.symbol} (${activeContract.name})`);

  const systemPrompt = `당신은 커피 선물 시장 전문 애널리스트이자 Coffee Market Info의 시니어 리서치 담당입니다.
매주 기관 투자자 및 업계 전문가를 위한 프리미엄 커피 시장 주간 동향 리포트를 작성합니다.

## 핵심 원칙

### 1. 정확한 데이터 수집 (필수)
- 주력 분석 대상: ${activeContract.symbol} (${activeContract.name})
- 가격 출처: Barchart, ICE, Investing.com
- 가격 단위: 아라비카 센트/파운드, 로부스타 USD/톤
- 모든 수치는 웹 검색으로 확인된 실제 데이터만 사용

### 2. 체계적 분석 프레임워크
- **매크로 환경**: 글로벌 경제, 달러 강세/약세, 원자재 전반, 금리 정책
- **펀더멘털**: 수급 균형, 재고, 산지별 작황, 수출입 동향, 생산량 전망
- **테크니컬**: 주요 지지/저항선, 이동평균, 거래량, 차트 패턴
- **센티먼트**: COT 포지션, 투기자 동향, 시장 심리, 옵션 시장 분석
- **종합 분석**: 모든 요인을 통합한 다면적 시장 진단

### 3. 균형 잡힌 시각
- 강세/약세 요인을 균형 있게 분석
- 과장된 표현 지양: "폭등/폭락" 대신 "강세/약세", "상승/하락" 사용
- 불확실성 인정: "~할 것으로 예상됨", "~가능성" 등 적절한 표현 사용

### 4. 전문성과 신뢰성
- 모든 정보에 출처 명시
- 주요 기관 전망 인용 (USDA, ICO, Volcafe, StoneX, Rabobank)
- 산지 현지 정보 반영 (Cepea, Cecafé, ICO 보고서)
- 다양한 시나리오 분석 및 확률 기반 전망 제시`;

  const userPrompt = `오늘 날짜: ${date.koreanDate}
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
오래된 뉴스(1주일 이상 지난 기사)는 제외하세요.

다음 키워드로 검색 (날짜 범위 포함):
- "coffee market news ${weekRange.end}" - 최신 커피 시장 뉴스
- "coffee price ${date.year} ${date.month}" - 이번 달 커피 가격 뉴스
- "Brazil coffee ${weekRange.end}" - 브라질 최신 뉴스
- "Vietnam robusta coffee ${date.year}" - 베트남 로부스타 뉴스
- "Colombia coffee exports"
- "Volcafe coffee"
- "StoneX coffee"
- "EUDR coffee regulation ${date.year}"
- "coffee tariff ${date.year}"

**검색 결과 필터링**: 
- 각 뉴스 항목의 날짜를 확인하고, ${weekRange.start} 이전의 기사는 제외
- 리포트에 포함하는 뉴스는 반드시 해당 주간(${weekRange.start} ~ ${weekRange.end}) 내 발행된 것만 선택

### 3단계: 종합 분석 및 전망 작성

수집한 정보를 바탕으로 다음을 체계적으로 분석하세요:

1. **시장 구조 분석**
   - 주력 계약과 차월물 스프레드 (백워데이션/콘탱고)
   - 거래량 및 미결제약정 변화
   - COT 포지션 (상업적/비상업적 참여자)

2. **수급 밸런스**
   - 글로벌 수급 전망 (USDA, ICO, Volcafe, StoneX)
   - ICE 인증재고 추이
   - 산지별 작황 및 수출 동향

3. **가격 전망**
   - 단기 (1-3개월): 지지/저항선, 예상 레인지
   - 시나리오별 가격 전망 (낙관/기본/비관)
   - 리스크 요인 (상방/하방)

4. **투자 시사점**
   - 로스터/트레이더 헤지 전략
   - 포지션 권고

## 리포트 구조

다음 구조로 **체계적이고 종합적인** HTML 리포트를 생성하세요:

### 1. 히어로 섹션 (Hero)
- 리포트 라벨: "WEEKLY MARKET UPDATE"
- 메인 타이틀: "커피 선물 시장 주간 동향"
- 서브타이틀: "Coffee Futures Market Weekly Update"
- 날짜, 분석 기간

### 2. 핵심 지표 카드 (Key Stats)
4개 카드로 구성:
- ${activeContract.name} 가격 (센트/파운드) + 주간변동률
- ICE 인증재고 (만 백) + 변동
- USD/BRL 환율 + 변동
- 로부스타 가격 (USD/톤) + 변동

### 3. 시장 개요 (Market Overview)
- 3-4문장의 핵심 요약
- 주요 가격 동인 설명
- 이번 주 핵심 이슈 (highlight-box 사용)

### 4. 가격 동향 (Price Action)
- 계약월별 가격 테이블 (${activeContract.name} 포함 3-4개 계약월)
- 주간/월간/연간 변동률
- 기술적 분석: 지지/저항선, 이동평균

### 5. 주간 핵심 뉴스 (Weekly News)
- 5-7개 뉴스 (news-item 클래스 사용)
- 각 뉴스: 날짜, 제목, 2-3문장 요약, 출처 링크

### 6. 산지별 동향 (Origin Updates)
각 산지별 상세 분석:
- **브라질**: 기상, 작황, 수확 진행률, 환율, 수출
- **베트남**: 로부스타 수확, 가격 동향, 수출
- **콜롬비아**: 아라비카 생산, FNC 보고, 수출

### 7. 수급 분석 (Supply & Demand)
- 주요 기관 전망치 비교 테이블 (USDA, ICO, StoneX, Volcafe)
- 재고 동향 분석
- 글로벌 수출입 동향

### 7.5. 종합 분석 (Comprehensive Analysis)
이 섹션은 리포트의 핵심으로, 모든 분석을 통합하여 시장의 전체 그림을 제시합니다:
- **시장 구조 진단**: 현재 시장이 강세/약세/중립 국면인지 구조적 평가
- **핵심 동인 순위**: 가격에 영향을 미치는 요인들의 상대적 중요도 (1위~5위)
- **상관관계 분석**: USD/BRL, 달러지수, 재고 수준과 가격의 상관관계
- **시장 컨센서스 vs 독자 견해**: 시장의 일반적 전망과 분석가의 차별화된 시각
- **핵심 변수 모니터링**: 향후 1-2주 주목해야 할 데이터/이벤트
- analysis-grid 또는 comprehensive-box 클래스 사용

### 8. 가격 전망 (Price Outlook)
- **시나리오 그리드** (scenario-grid 사용):
  - 낙관 시나리오: 확률, 예상 가격, 조건
  - 기본 시나리오: 확률, 예상 가격, 조건
  - 비관 시나리오: 확률, 예상 가격, 조건
- 1개월/3개월 예상 레인지
- 공정가치 추정 근거

### 9. 리스크 요인 (Risk Factors)
- **상방 리스크** (3개): opportunity-section 사용
- **하방 리스크** (3개): risk-section 사용

### 10. 투자 전략 (Trading Strategy)
- strategy-grid 사용
- **로스터 전략**: 헤지 타이밍, 커버 권고
- **트레이더 전략**: 포지션, 진입/청산 레벨

### 11. 출처 (References)
- 모든 참조 URL 목록

### 12. 푸터 (Footer)
- Coffee Market Info 브랜드 (by Align Commodities)
- 문의: james.baek@aligncommodities.com
- 웹사이트: https://www.coffeemarket.info
- 면책조항: "본 리포트는 정보 제공 목적으로 작성되었으며, 투자 권유가 아닙니다. 투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다."

## 출력 형식

완전한 HTML 파일을 생성해주세요. 다음 조건을 충족해야 합니다:

### HTML 헤더 필수 요소:
\`\`\`html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>커피 시장 주간 동향 | ${date.koreanDate}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Pretendard:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-GX9R36120J"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-GX9R36120J');
    </script>
</head>
\`\`\`

### 네비게이션 바:
\`\`\`html
<nav class="top-nav">
    <a href="https://www.coffeemarket.info" class="nav-brand">☕ Coffee Market Info</a>
    <a href="https://www.coffeemarket.info" class="home-btn">← 홈으로</a>
</nav>
\`\`\`

### 메타데이터 블록 (HTML 최상단에 포함):
\`\`\`html
<!--REPORT_META
{
    "title": "커피 선물 시장 주간 동향",
    "subtitle": "Coffee Futures Market Weekly Update",
    "date": "${date.dateStr}",
    "displayDate": "${date.koreanDate}",
    "summary": "실제 수집한 데이터 기반 핵심 요약 2-3문장",
    "tags": ["주간동향", "${activeContract.shortName}", "아라비카", "관련키워드들"],
    "type": "weekly",
    "price_current": "XXX.XX",
    "price_change": "+X.XX (+X.X%)",
    "fair_value": "XXX-XXX",
    "analysis_period": "${weekRange.start} ~ ${weekRange.end}"
}
REPORT_META-->
\`\`\`

### 엘레강스 라이트 테마 CSS (아래 스타일을 그대로 <style> 태그에 포함):
\`\`\`css
${cssTemplate}
\`\`\`

### 가격 표시 규칙:
- 아라비카: XXX.XX센트/파운드 또는 XXX.XX¢/lb
- 로부스타: $X,XXX/MT
- 환율: X.XXXX

**HTML 코드만 출력하세요. 설명이나 마크다운 코드블록 없이 순수 HTML만 출력합니다. 반드시 <!DOCTYPE html>로 시작해야 합니다.**`;

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
