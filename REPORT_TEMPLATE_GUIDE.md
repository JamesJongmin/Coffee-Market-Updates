# 리포트 작성 가이드라인

## REPORT_META 블록 사용법

모든 새로운 리포트 HTML 파일에는 반드시 `REPORT_META` 블록을 포함해야 합니다. 이 블록은 자동화된 스크립트가 리포트 메타데이터를 추출하는 데 사용됩니다.

### 기본 구조

```html
<!--REPORT_META
{
    "title": "리포트 제목",
    "subtitle": "리포트 부제목 (영문)",
    "date": "YYYY-MM-DD",
    "type": "weekly 또는 in-depth-analysis",
    "summary": "리포트 요약 내용. HTML 태그나 특수 문자 없이 순수 텍스트로 작성하세요.",
    "tags": ["태그1", "태그2", "태그3", "태그4"]
}
REPORT_META-->
```

### 작성 규칙

1. **위치**: HTML 파일의 `<head>` 섹션이나 `<body>` 시작 부분에 배치
2. **형식**: 유효한 JSON 형식으로 작성
3. **필수 필드**:
   - `title`: 리포트의 메인 제목
   - `subtitle`: 영문 부제목
   - `date`: YYYY-MM-DD 형식의 날짜
   - `type`: 리포트 유형 (**필수** - 아래 참조)
   - `summary`: 리포트 요약 (50-200자 권장)
   - `tags`: 관련 태그 배열 (4-8개 권장)

### ⭐ type 필드 (리포트 분류)

리포트는 `type` 필드로 분류되어 해당 메뉴에 자동 배치됩니다:

| type 값 | 설명 | 표시 메뉴 |
|---------|------|----------|
| `"weekly"` | 주간 시장 동향 리포트 | Weekly Report |
| `"in-depth-analysis"` | 심층 분석/특별 리포트 | In-Depth Analysis |

**두 타입 모두:**
- ✅ 메인 페이지의 Latest Report 섹션에 표시됨 (최신순)
- ✅ 전체 리포트 목록에 표시됨

### Summary 작성 주의사항

❌ **피해야 할 것들**:
- HTML 태그 (`<p>`, `<div>`, `<span>` 등)
- CSS 스타일 속성 (`style="..."`)
- 특수 문자나 이스케이프 시퀀스 (`\"`, `\n`, `\t` 등)
- 줄바꿈 (모든 내용을 한 줄로 작성)

✅ **올바른 예시**:
```json
"summary": "커피 선물 가격이 전월 대비 15% 상승하며 연중 최고치를 기록했습니다. 브라질의 가뭄과 베트남의 수출 제한이 주요 원인으로 분석됩니다."
```

### 전체 예시

#### Weekly 리포트 예시
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>커피 시장 분석 리포트</title>
    
    <!--REPORT_META
    {
        "title": "커피 선물 시장 주간 동향",
        "subtitle": "Coffee Futures Market Weekly Update",
        "date": "2025-08-10",
        "type": "weekly",
        "summary": "아라비카 선물이 300센트를 돌파하며 6개월 최고치를 기록했습니다. 브라질 서리 피해 우려와 글로벌 재고 감소가 주요 상승 요인으로 작용했습니다.",
        "tags": ["주간동향", "아라비카", "브라질", "서리피해", "재고감소", "가격상승"]
    }
    REPORT_META-->
    
    <style>
        /* CSS 스타일 */
    </style>
</head>
<body>
    <!-- 리포트 내용 -->
</body>
</html>
```

#### In-depth 분석 리포트 예시
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>커피 관세 심층 분석</title>
    
    <!--REPORT_META
    {
        "title": "커피 대란의 서막: 50% 관세 충격 완전 분석",
        "subtitle": "Coffee Tariff Impact Analysis",
        "date": "2025-07-16",
        "type": "in-depth-analysis",
        "summary": "트럼프 행정부의 브라질산 커피 50% 관세가 시장에 미칠 연쇄 효과를 심층 분석합니다. CTD 메커니즘 재편과 공급망 변화를 다룹니다.",
        "tags": ["심층분석", "관세정책", "CTD메커니즘", "공급망", "가격전망"]
    }
    REPORT_META-->
    
    <style>
        /* CSS 스타일 */
    </style>
</head>
<body>
    <!-- 리포트 내용 -->
</body>
</html>
```

### 태그 권장사항

**Weekly 리포트 태그**:
- 기본: "주간동향", "아라비카", "로부스타", "시장분석"
- 지역: "브라질", "베트남", "콜롬비아", "에티오피아"
- 이슈: "가격동향", "수급현황", "환율변동", "ICE선물"

**In-depth 분석 리포트 태그**:
- 기본: "심층분석", "특별분석", "가격전망"
- 분석 유형: "기술적분석", "펀더멘털분석", "시나리오분석"
- 특별 주제: "관세정책", "기후변화", "투기포지션", "공급망위기"
- 시각화: "인포그래픽", "차트분석"

### 🌐 한국어/영문 리포트 파일 명명 규칙

리포트는 파일명에 따라 자동으로 한국어 또는 영문 페이지에 표시됩니다:

| 파일명 형식 | 언어 | 표시 위치 |
|------------|------|----------|
| `YYYY-MM-DD.html` | 한국어 🇰🇷 | 한국어 페이지 (index.html, weekly-report.html 등) |
| `YYYY-MM-DD-en.html` | 영문 🇺🇸 | 영문 페이지 (index-en.html, weekly-report-en.html 등) |

**예시:**
- `2025-11-30.html` → 한국어 리포트 (한국어 페이지에만 표시)
- `2025-11-30-en.html` → 영문 리포트 (영문 페이지에만 표시)

**중요:**
- 한국어 리포트를 작성할 때는 파일명에 `-en`을 포함하지 마세요
- 영문 리포트는 반드시 파일명 끝에 `-en.html`을 붙여야 합니다
- 같은 날짜의 한국어/영문 리포트를 모두 작성할 수 있습니다

### 자동화 프로세스

1. 새 리포트를 `Reports/YYYY/MM/YYYY-MM-DD.html` (한국어) 또는 `Reports/YYYY/MM/YYYY-MM-DD-en.html` (영문) 형식으로 저장
2. GitHub에 푸시하면 자동으로 `reports.json` 파일이 업데이트됨
3. 파일명에 따라 적절한 언어 페이지에 자동으로 반영됨

### 문제 해결

만약 `reports.json`에 잘못된 데이터가 들어간 경우:
1. 해당 HTML 파일의 REPORT_META 블록 확인
2. JSON 형식이 올바른지 검증
3. Summary에 HTML/CSS 코드가 없는지 확인
4. 수정 후 다시 푸시

### 검증 도구

리포트 작성 후 다음 명령으로 JSON 유효성을 검증할 수 있습니다:

```bash
# REPORT_META 블록 추출 및 검증
grep -A 20 "REPORT_META" your-report.html | grep -B 20 "REPORT_META-->" | sed '1d;$d' | jq .
```

이 가이드라인을 따라 작성하면 `reports.json` 파일에 올바른 메타데이터가 자동으로 추가됩니다.