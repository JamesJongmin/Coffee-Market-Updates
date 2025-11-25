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
모든 정보에는 반드시 출처를 명시합니다.`;

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

다음 구조로 HTML 리포트를 생성해주세요:

1. **시장 개요**: 핵심 요약 3-4줄 + 현재 가격
2. **주요 가격 동향**: 아라비카/로부스타/환율/재고
3. **주간 핵심 뉴스**: 뉴스별 소제목 + 2-3문장 요약 + 출처 링크
4. **산지별 동향**: 브라질/베트남/콜롬비아
5. **수급 전망**: 주요 기관 전망치
6. **기술적 분석**: 지지/저항선, 단기 전망
7. **리스크 요인**: 상방 3개, 하방 3개
8. **출처**: 모든 참조 링크

## 출력 형식

완전한 HTML 파일을 생성해주세요. 다음 조건을 충족해야 합니다:

1. 메타데이터 블록 포함:
<!--REPORT_META
{
    "title": "커피 선물 시장 주간 동향 | ${date.koreanDate}",
    "date": "${date.dateStr}",
    "summary": "핵심 요약 1-2문장",
    "tags": ["주간동향", "아라비카", "관련태그들"]
}
REPORT_META-->

2. Google Analytics 포함: G-GX9R36120J

3. 디자인 시스템:
- 폰트: Cormorant Garamond (헤드라인), Pretendard (본문)
- 컬러: --espresso: #1a0f0a, --copper: #b87333, --paper: #faf8f5 등
- 밝은 에디토리얼 스타일

4. 반응형 디자인

HTML 코드만 출력하세요. 설명이나 마크다운 코드블록 없이 순수 HTML만 출력합니다.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
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

    // reports.json 업데이트 (있는 경우)
    updateReportsJson(date, fileName);

    return filePath;
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
}

// reports.json 업데이트
function updateReportsJson(date, fileName) {
  const reportsJsonPath = "reports.json";

  let reportsData = { reports: [] };

  if (fs.existsSync(reportsJsonPath)) {
    try {
      reportsData = JSON.parse(fs.readFileSync(reportsJsonPath, "utf8"));
    } catch (e) {
      console.log("Creating new reports.json");
    }
  }

  const newReport = {
    title: `커피 선물 시장 주간 동향 | ${date.koreanDate}`,
    date: date.dateStr,
    link: `Reports/${date.year}/${date.month}/${fileName}`,
    summary: "커피 시장 주간 동향 분석 리포트",
    tags: ["주간동향", "아라비카", "ICE선물"],
    year: date.year.toString(),
    month: date.month,
  };

  // 중복 체크
  const exists = reportsData.reports.some((r) => r.date === date.dateStr);
  if (!exists) {
    reportsData.reports.unshift(newReport);
    fs.writeFileSync(reportsJsonPath, JSON.stringify(reportsData, null, 2), "utf8");
    console.log("reports.json updated");
  }
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
