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
   - `summary`: 리포트 요약 (50-200자 권장)
   - `tags`: 관련 태그 배열 (4-8개 권장)

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
        "summary": "아라비카 선물이 300센트를 돌파하며 6개월 최고치를 기록했습니다. 브라질 서리 피해 우려와 글로벌 재고 감소가 주요 상승 요인으로 작용했습니다.",
        "tags": ["아라비카", "로부스타", "브라질", "서리피해", "재고감소", "가격상승"]
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

**기본 태그** (주간 리포트):
- "아라비카", "로부스타", "시장분석", "주간동향"

**추가 태그 예시**:
- 지역: "브라질", "베트남", "콜롬비아", "에티오피아"
- 이슈: "가격전망", "수급분석", "기후영향", "환율변동"
- 특별 주제: "관세정책", "투기포지션", "기술적분석", "수확전망"

### 자동화 프로세스

1. 새 리포트를 `Reports/YYYY/MM/YYYY-MM-DD.html` 형식으로 저장
2. GitHub에 푸시하면 자동으로 `reports.json` 파일이 업데이트됨
3. 웹사이트에 자동으로 반영됨

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