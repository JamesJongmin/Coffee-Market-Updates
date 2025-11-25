# 커피 선물 시장 주간 동향 자동 리포트 생성 시스템

매주 토요일 오전 8시 (KST)에 자동으로 커피 시장 주간 동향 리포트를 생성합니다.

## 📋 개요

이 시스템은 다음 기능을 수행합니다:

1. **데이터 수집**: Google Sheets 및 외부 API에서 시장 데이터 수집
2. **뉴스 수집**: RSS 피드에서 커피 관련 뉴스 수집
3. **콘텐츠 생성**: AI (Claude/GPT)를 사용하여 리포트 콘텐츠 생성
4. **HTML 생성**: 기존 템플릿 스타일에 맞춰 HTML 파일 생성
5. **검증**: 생성된 리포트의 품질 검증
6. **발행**: GitHub에 자동 커밋 및 푸시

## 🚀 시작하기

### 필수 요구사항

- Node.js 18.0.0 이상
- GitHub Actions (자동 실행용)
- Anthropic API 키 또는 OpenAI API 키

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-repo/coffee-market-info.git
cd coffee-market-info

# 의존성 설치 (현재는 외부 의존성 없음)
npm install
```

### 환경 변수 설정

GitHub Secrets에 다음 값을 설정하세요:

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | Anthropic Claude API 키 | 권장 |
| `OPENAI_API_KEY` | OpenAI API 키 | 대체 |
| `SLACK_WEBHOOK_URL` | Slack 알림 웹훅 URL | 선택 |

## 📁 파일 구조

```
scripts/
├── generate-weekly-report.js  # 메인 스크립트
├── modules/
│   ├── data-fetcher.js        # 시장 데이터 수집
│   ├── news-fetcher.js        # 뉴스 수집
│   ├── content-generator.js   # AI 콘텐츠 생성
│   ├── html-builder.js        # HTML 빌더
│   └── validator.js           # 리포트 검증
└── README.md                  # 이 문서

.github/workflows/
└── weekly-report.yml          # GitHub Actions 워크플로우
```

## 🛠️ 사용 방법

### 로컬 실행

```bash
# 기본 실행 (오늘 날짜 기준)
npm run generate

# 테스트 모드 (파일 생성 안함)
npm run generate:test

# 특정 날짜로 생성
node scripts/generate-weekly-report.js --date 2025-11-30

# 도움말
node scripts/generate-weekly-report.js --help
```

### GitHub Actions 자동 실행

- **스케줄**: 매주 금요일 23:00 UTC (토요일 08:00 KST)
- **수동 실행**: GitHub Actions → Weekly Coffee Market Report → Run workflow

수동 실행 시 옵션:
- `target_date`: 특정 날짜로 리포트 생성 (YYYY-MM-DD)
- `dry_run`: 테스트 모드 (파일 생성 안함)

## 📊 데이터 소스

### 가격 데이터
- ICE Arabica Futures (KC) - Google Sheets 연동
- ICE Robusta Futures (RC)
- USD/BRL 환율
- ICE Certified Stocks
- CFTC COT Report

### 뉴스 소스
우선순위순:
1. **Tier 1**: Reuters, Bloomberg, USDA, ICO
2. **Tier 2**: Perfect Daily Grind, Daily Coffee News, Comunicaffe
3. **Tier 3**: Coffee Network, Global Coffee Report, Nasdaq, Barchart
4. **Tier 4**: StoneX, Volcafe, Rabobank, Trading Economics

## 📝 리포트 구조

생성되는 리포트는 다음 섹션을 포함합니다:

1. **시장 개요** (Market Overview)
   - 주간 핵심 요약
   - 현재 가격 및 변동률

2. **주요 가격 동향** (Price Action)
   - ICE Arabica 근월물/차근월물
   - 백워데이션 분석
   - USD/BRL 환율 영향

3. **주간 핵심 뉴스** (Key Developments)
   - 뉴스별 소제목 + 요약
   - 출처 링크

4. **산지별 동향** (Origin Updates)
   - 브라질, 베트남, 콜롬비아 등

5. **수급 전망** (Supply & Demand)

6. **기술적 분석** (Technical Analysis)

7. **리스크 요인** (Risk Factors)

8. **시장 전망** (Outlook)

## 🔧 설정

### Google Sheets 연동

`scripts/modules/data-fetcher.js`에서 데이터 소스 URL 설정:

```javascript
const GOOGLE_SHEETS_URLS = {
    coffeefutures: 'https://docs.google.com/spreadsheets/d/...',
    usdbrl: 'https://docs.google.com/spreadsheets/d/...',
    cftcpositions: 'https://docs.google.com/spreadsheets/d/...',
    icestocks: 'https://docs.google.com/spreadsheets/d/...'
};
```

### AI 모델 설정

`scripts/modules/content-generator.js`에서 모델 변경 가능:

```javascript
// Anthropic Claude
model: 'claude-sonnet-4-20250514'

// OpenAI
model: 'gpt-4o'
```

## ⚠️ 문제 해결

### 데이터 수집 실패
- Google Sheets 권한 확인
- CORS 프록시 설정 확인
- 네트워크 연결 확인

### AI 콘텐츠 생성 실패
- API 키 유효성 확인
- API 사용량 한도 확인
- 폴백 콘텐츠가 자동 생성됨

### GitHub Actions 실패
- Secrets 설정 확인
- 워크플로우 권한 확인
- 로그에서 상세 에러 확인

## 📌 주의사항

1. **API 키 보안**: API 키는 절대 코드에 직접 포함하지 마세요.
2. **데이터 정확성**: 자동 생성된 데이터는 반드시 검토하세요.
3. **저작권**: 뉴스 콘텐츠 사용 시 출처를 명시하세요.
4. **투자 권유 금지**: 리포트는 정보 제공 목적으로만 사용됩니다.

## 📧 문의

- Email: james.baek@aligncommodities.com
- Website: coffeemarket.info

## 📄 라이선스

MIT License
