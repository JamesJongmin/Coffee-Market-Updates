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

// Claude API로 웹 검색 및 리포트 생성
async function generateReport() {
  const date = getToday();
  const weekRange = getLastWeekRange();

  console.log(`Generating report for ${date.dateStr}...`);
  console.log(`Fetching news from ${weekRange.start} to ${weekRange.end}`);

  const systemPrompt = `당신은 커피 선물 시장 전문 애널리스트입니다. 
매주 커피 시장 주간 동향 리포트를 작성합니다.
객관적이고 전문적인 톤을 유지하며, 구체적인 수치를 포함합니다.
과장된 표현("폭등", "급락")을 피하고 "상승", "하락" 등 중립적 표현을 사용합니다.
모든 정보에는 반드시 출처를 명시합니다.

중요한 작성 원칙:
1. 단순 뉴스 나열이 아닌, 시장 영향과 인사이트를 제공합니다
2. 주요 이슈에 대해 "심층 분석" 섹션을 포함합니다
3. 시장의 핵심 질문에 대한 시나리오 분석을 제공합니다
4. 각 뉴스 항목에 날짜를 명시하고 출처 링크를 제공합니다
5. 공정 가치 분석과 투자 시사점을 포함합니다`;

  const userPrompt = `오늘 날짜: ${date.koreanDate}
데이터 수집 기간: ${weekRange.start} ~ ${weekRange.end}

다음 정보를 웹에서 검색하여 커피 선물 시장 주간 동향 리포트를 작성해주세요.

## 수집해야 할 데이터

### 1. 가격 데이터
- ICE Arabica Futures (KC) 근월물/차근월물 가격, 변동률
- ICE Robusta Futures 가격
- USD/BRL 환율
- ICE Certified Stocks (인증 재고)

검색 쿼리 예시:
- "ICE coffee futures price"
- "arabica coffee price today"
- "USD BRL exchange rate"
- "ICE certified coffee stocks"

### 2. 뉴스 (최근 7일 이내만)
다음 키워드로 검색:
- "coffee futures" price ${date.year}
- Brazil coffee harvest
- Vietnam coffee production  
- Colombia coffee exports
- coffee market news

우선순위 소스: Reuters, Bloomberg, Perfect Daily Grind, USDA, StoneX, Volcafe

### 3. 포지션 데이터
- CFTC 머니매니저 순매수 포지션 (있는 경우)

## 리포트 구조

다음 구조로 풍부하고 상세한 HTML 리포트를 생성해주세요:

### 1. 시장 개요
- 핵심 요약 3-4줄
- 이번 주 가장 중요한 이벤트를 highlight-box로 강조
- 주력 계약월물(현재 3월물 KCH26) 중심 분석

### 2. 주요 가격 동향
- price-card 형식으로 4개 핵심 지표 표시
- 아라비카 근월물/차근월물 가격표(테이블)
- 각 계약월물별 종가, 변동률, 거래량, 미결제약정 포함

### 3. 주요 뉴스 분석 (5-8개 항목)
- 각 뉴스에 날짜(YYYY.MM.DD 형식) 명시
- 뉴스 제목 + 상세 분석 (2-4문단)
- 실제 출처 URL 링크 포함
- 시장에 미치는 영향 분석

### 4. 심층 분석 섹션 (중요!)
- 이번 주 가장 중요한 시장 이슈에 대한 깊이 있는 분석
- 예: 백워데이션 구조, 관세 영향, 기상 리스크 등
- 왜 이런 일이 벌어지는지 배경 설명
- 향후 전개 시나리오

### 5. 핵심 질문 & 시나리오 분석
- 시장의 핵심 질문 제시 (예: "3월물은 400센트로 재상승할 것인가?")
- 시나리오 A/B/C 제시 (각각 확률과 전제조건)
- 공정 가치(fair value) 분석
- 투자/헤지 전략적 시사점 (로스터, 트레이더, 생산자별)

### 6. 산지별 동향
- 브라질/베트남/콜롬비아 각각 상세 분석
- 날씨, 환율, 수출 현황 포함

### 7. 시장 전망
- 단기(1-3개월) / 중장기(6-12개월) 전망
- grid 레이아웃으로 시각적 구분
- 리스크 매트릭스 테이블 (상승/하락 촉매 비교)

### 8. 출처
- 모든 참조 링크 목록
- footer에 연락처 정보 포함

## 출력 형식

완전한 HTML 파일을 생성해주세요. 다음 조건을 충족해야 합니다:

1. 메타데이터 블록 포함 (상세하게):
<!--REPORT_META
{
    "title": "커피 선물 시장 주간 동향",
    "subtitle": "Coffee Futures Market Weekly Update",
    "date": "${date.dateStr}",
    "summary": "핵심 요약 2-3문장 (주요 가격 변동, 핵심 이슈 포함)",
    "tags": ["3월물가격", "관련이슈태그들", "ICE재고", "브라질", "베트남"],
    "author": "Align Commodities",
    "contact": "james.baek@aligncommodities.com",
    "sources": ["Bloomberg", "Reuters", "Comunicaffe", "Perfect Daily Grind", "기타출처들"],
    "price_current": "현재 3월물 가격",
    "price_change": "주간 변동",
    "fair_value": "공정가치 범위",
    "report_type": "weekly",
    "analysis_period": "${weekRange.start} to ${weekRange.end}"
}
REPORT_META-->

2. Google Analytics 포함: G-GX9R36120J

3. 디자인 시스템 (다크 테마):
- 폰트: Pretendard (본문), 필요시 sans-serif fallback
- 컬러 스킴:
  * 배경: #0a0a0a (body), #1a1a1a ~ #2d2d2d (cards)
  * 텍스트: #e0e0e0 (본문), #ffffff (헤드라인), #cccccc (서브텍스트)
  * 액센트: #8B4513 (border), #D2691E (chocolate/copper), rgba(139, 69, 19, 0.x) (투명도)
  * 상승: #2ecc71, 하락: #e74c3c
- body::before에 radial-gradient로 은은한 배경 효과
- header에 gradient 배경과 장식적 ::before 요소
- highlight-box: gradient 배경 + 좌측 border
- price-card: grid 레이아웃, 4개 카드
- news-item: 좌측 border 강조
- 테이블: 다크 테마, hover 효과
- 반응형 디자인

4. 필수 UI 요소:
- header에 "← 홈으로" 버튼 (index.html 링크)
- footer에 Align Commodities 연락처
- 면책조항 포함

5. CSS 클래스 참고:
- .container: max-width 800px, padding
- .highlight-box: 중요 내용 강조
- .price-snapshot: 가격 카드 grid
- .price-card: 개별 가격 표시
- .news-item: 뉴스 아이템 스타일
- .price-change.up / .price-change.down: 상승/하락 색상

HTML 코드만 출력하세요. 설명이나 마크다운 코드블록 없이 순수 HTML만 출력합니다.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 32000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const htmlContent = response.content[0].text;

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

    // reports.json 업데이트 (HTML에서 메타데이터 추출)
    updateReportsJson(date, fileName, htmlContent);

    return filePath;
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
}

// HTML에서 REPORT_META 추출
function extractReportMeta(htmlContent) {
  const metaMatch = htmlContent.match(/<!--REPORT_META\s*([\s\S]*?)\s*REPORT_META-->/);
  if (metaMatch) {
    try {
      return JSON.parse(metaMatch[1]);
    } catch (e) {
      console.log("Failed to parse REPORT_META:", e.message);
    }
  }
  return null;
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
  const meta = extractReportMeta(htmlContent);

  const newReport = {
    title: meta?.title || `커피 선물 시장 주간 동향 | ${date.koreanDate}`,
    date: date.dateStr,
    link: `Reports/${date.year}/${date.month}/${fileName}`,
    summary: meta?.summary || "커피 시장 주간 동향 분석 리포트",
    tags: meta?.tags || ["주간동향", "아라비카", "ICE선물"],
    year: date.year.toString(),
    month: date.month,
    // 추가 메타데이터
    ...(meta?.price_current && { price_current: meta.price_current }),
    ...(meta?.price_change && { price_change: meta.price_change }),
    ...(meta?.fair_value && { fair_value: meta.fair_value }),
    ...(meta?.sources && { sources: meta.sources }),
  };

  // 중복 체크 - 같은 날짜 리포트가 있으면 업데이트
  const existingIndex = reportsData.reports.findIndex((r) => r.date === date.dateStr);
  if (existingIndex >= 0) {
    reportsData.reports[existingIndex] = newReport;
    console.log("reports.json entry updated");
  } else {
    reportsData.reports.unshift(newReport);
    console.log("reports.json new entry added");
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
