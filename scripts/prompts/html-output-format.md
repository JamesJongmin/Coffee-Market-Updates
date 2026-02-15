# HTML 출력 형식 가이드 (HTML Output Format)

완전한 HTML 파일을 생성해주세요. 다음 조건을 충족해야 합니다.

---

## 1. HTML 헤더 필수 요소

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>커피 시장 주간 동향 | {{KOREAN_DATE}}</title>
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
```

---

## 2. 네비게이션 바

```html
<nav class="top-nav">
    <a href="https://www.coffeemarket.info" class="nav-brand">☕ Coffee Market Info</a>
    <a href="https://www.coffeemarket.info" class="home-btn">← 홈으로</a>
</nav>
```

---

## 3. 메타데이터 블록

> ⚠️ HTML 최상단 (`<!DOCTYPE html>` 바로 아래)에 포함해야 합니다.

```html
<!--REPORT_META
{
    "title": "커피 선물 시장 주간 동향",
    "subtitle": "Coffee Futures Market Weekly Update",
    "date": "{{DATE_STR}}",
    "displayDate": "{{KOREAN_DATE}}",
    "summary": "실제 수집한 데이터 기반 핵심 요약 2-3문장",
    "tags": ["주간동향", "{{CONTRACT_SHORT_NAME}}", "아라비카", "관련키워드들"],
    "type": "weekly",
    "price_current": "XXX.XX",
    "price_change": "+X.XX (+X.X%)",
    "fair_value": "XXX-XXX",
    "analysis_period": "{{WEEK_START}} ~ {{WEEK_END}}"
}
REPORT_META-->
```

### 메타데이터 필드 설명

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `title` | string | 리포트 제목 (한글) | "커피 선물 시장 주간 동향" |
| `subtitle` | string | 리포트 부제목 (영문) | "Coffee Futures Market Weekly Update" |
| `date` | string | ISO 날짜 | "2025-12-05" |
| `displayDate` | string | 표시용 날짜 (한글) | "2025년 12월 5일" |
| `summary` | string | 핵심 요약 2-3문장 | - |
| `tags` | array | 태그 목록 | ["주간동향", "25년 3월물", "아라비카"] |
| `type` | string | 리포트 유형 | "weekly" |
| `price_current` | string | 현재 주력 계약 가격 | "325.50" |
| `price_change` | string | 가격 변동 | "+5.25 (+1.6%)" |
| `fair_value` | string | 적정가치 범위 | "300-340" |
| `analysis_period` | string | 분석 기간 | "2025-11-28 ~ 2025-12-05" |

---

## 4. CSS 스타일

> 엘레강스 라이트 테마 CSS를 `<style>` 태그에 포함

```css
{{CSS_TEMPLATE}}
```

---

## 5. 가격 표시 규칙

| 상품 | 표시 형식 | 예시 |
|------|----------|------|
| 아라비카 | XXX.XX센트/파운드 또는 XXX.XX¢/lb | 325.50센트/파운드 |
| 로부스타 | $X,XXX/MT | $5,250/MT |
| 환율 | X.XXXX | 5.8234 |

---

## 6. CSS 클래스 참조

### 레이아웃 클래스

| 클래스명 | 용도 |
|---------|------|
| `container` | 메인 컨테이너 (최대 폭 800px) |
| `hero-section` | 히어로 섹션 |
| `section` | 일반 섹션 |
| `stat-grid` | 통계 카드 그리드 |

### 콘텐츠 클래스

| 클래스명 | 용도 |
|---------|------|
| `highlight-box` | 강조 박스 (핵심 이슈) |
| `news-item` | 뉴스 아이템 |
| `data-table` | 데이터 테이블 |
| `analysis-grid` | 분석 그리드 |
| `comprehensive-box` | 종합 분석 박스 |

### 시나리오/전략 클래스

| 클래스명 | 용도 |
|---------|------|
| `scenario-grid` | 시나리오 그리드 (낙관/기본/비관) |
| `strategy-grid` | 투자 전략 그리드 |
| `korea-strategy` | 한국 전략 섹션 |
| `korea-strategy-grid` | 한국 전략 그리드 |

### 리스크 클래스

| 클래스명 | 용도 |
|---------|------|
| `opportunity-section` | 상방 리스크 (기회) |
| `risk-section` | 하방 리스크 |

---

## 7. 출력 규칙

> ⚠️ **중요**

- HTML 코드만 출력하세요
- 설명이나 마크다운 코드블록 없이 순수 HTML만 출력합니다
- 반드시 `<!DOCTYPE html>`로 시작해야 합니다
- 코드블록(```)으로 감싸지 마세요
