# 사용자 프롬프트 템플릿 (User Prompt Template)

> 이 템플릿의 `{{변수}}` 는 스크립트 실행 시 실제 값으로 대체됩니다.

---

## 기본 정보

- **오늘 날짜**: {{KOREAN_DATE}}
- **데이터 수집 기간**: {{WEEK_START}} ~ {{WEEK_END}}
- **주력 계약**: {{CONTRACT_SYMBOL}} ({{CONTRACT_NAME}})

---

## 필수 수행 작업

### 1단계: 가격 데이터 수집 (웹 검색 필수)

다음 검색을 수행하여 **실제 가격 데이터**를 확인하세요:

| # | 검색어 | 목적 |
|---|--------|------|
| 1 | `site:barchart.com coffee futures KC` | Barchart에서 아라비카 선물 가격 |
| 2 | `ICE arabica coffee {{CONTRACT_SYMBOL}} price` | 주력 계약 가격 |
| 3 | `ICE robusta coffee futures price RC` | 로부스타 가격 |
| 4 | `USD BRL exchange rate` | 브라질 환율 |
| 5 | `ICE certified coffee stocks inventory` | 인증 재고 |
| 6 | `coffee COT report CFTC` | 선물 포지션 데이터 |

> ⚠️ **중요**: {{CONTRACT_NAME}} 가격이 300센트 이상인지 확인하세요. 최근 커피 가격은 역사적 고점 수준입니다.

---

### 2단계: 뉴스 및 펀더멘털 수집

> ⚠️ **중요**: 반드시 {{WEEK_START}} ~ {{WEEK_END}} 기간 내 뉴스만 검색하고 분석하세요.
> 발행일({{DATE_STR}}) 기준으로 최근 7일 이내의 기사만 포함해야 합니다.
> 오래된 뉴스(1주일 이상 지난 기사)는 제외하세요.

#### 검색 키워드 목록

| 카테고리 | 검색어 |
|----------|--------|
| 일반 시장 | `coffee market news {{WEEK_END}}` |
| 월별 가격 | `coffee price {{YEAR}} {{MONTH}}` |
| 브라질 | `Brazil coffee {{WEEK_END}}` |
| 베트남 | `Vietnam robusta coffee {{YEAR}}` |
| 콜롬비아 | `Colombia coffee exports` |
| 기관 분석 | `Volcafe coffee`, `StoneX coffee` |
| 규제 | `EUDR coffee regulation {{YEAR}}` |
| 관세 | `coffee tariff {{YEAR}}` |

#### 검색 결과 필터링 규칙

- 각 뉴스 항목의 날짜를 확인
- {{WEEK_START}} 이전의 기사는 제외
- 리포트에 포함하는 뉴스는 반드시 해당 주간 내 발행된 것만 선택

---

### 3단계: 종합 분석 및 전망 작성

수집한 정보를 바탕으로 다음을 체계적으로 분석하세요:

#### 1. 시장 구조 분석

- 주력 계약과 차월물 스프레드 (백워데이션/콘탱고)
- 거래량 및 미결제약정 변화
- COT 포지션 (상업적/비상업적 참여자)

#### 2. 수급 밸런스

- 글로벌 수급 전망 (USDA, ICO, Volcafe, StoneX)
- ICE 인증재고 추이
- 산지별 작황 및 수출 동향

#### 3. 가격 전망

- 단기 (1-3개월): 지지/저항선, 예상 레인지
- 시나리오별 가격 전망 (낙관/기본/비관)
- 리스크 요인 (상방/하방)

#### 4. 투자 시사점

- 로스터/트레이더 헤지 전략
- 포지션 권고

---

## 템플릿 변수 참조

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `{{KOREAN_DATE}}` | 한글 날짜 | 2025년 12월 5일 |
| `{{DATE_STR}}` | ISO 날짜 | 2025-12-05 |
| `{{YEAR}}` | 연도 | 2025 |
| `{{MONTH}}` | 월 (2자리) | 12 |
| `{{WEEK_START}}` | 분석 시작일 | 2025-11-28 |
| `{{WEEK_END}}` | 분석 종료일 | 2025-12-05 |
| `{{CONTRACT_SYMBOL}}` | 계약 심볼 | KCH25 |
| `{{CONTRACT_NAME}}` | 계약 이름 | 2025년 3월물 |
| `{{CONTRACT_SHORT_NAME}}` | 계약 약칭 | 25년 3월물 |
