# 📊 Coffee Market Updates - 리포트 관리 가이드

이 가이드는 **한국어 리포트 업데이트 시 영문 버전 자동 반영 시스템**에 대한 완전한 설명입니다.

## 🎯 핵심 답변: "한국 리포트 업데이트하면 영문 버전도 다 반영되나요?"

**✅ 네, 맞습니다!** 한국어 리포트를 업데이트하면 영문 버전에도 **자동으로 반영**됩니다.

### 🔄 자동 반영되는 항목들

#### 1. **리포트 구조 및 메타데이터**
- ✅ 리포트 파일 경로 (`Reports/2025/07/2025-07-26.html`)
- ✅ 날짜 정보 (한국어: "2025년 7월 26일" ↔ 영어: "July 26, 2025")
- ✅ 카테고리 자동 분류 (Weekly/In-depth/Fundamentals)
- ✅ 태그 번역 ("기술적분석" → "Technical Analysis")

#### 2. **페이지 라우팅 로직**
```javascript
// 제목 기반 자동 분류 예시
"커피 선물 시장 주간 동향" → Weekly Report 페이지
"단기 커피 선물 가격 전망 및 방향성 점검" → In-depth Analysis 페이지
"커피 시장 펀더멘털 분석" → Fundamentals 페이지
```

#### 3. **UI 요소 번역**
- ✅ "보고서 읽기" ↔ "Read Report" 버튼
- ✅ "More Reports" ↔ "Less Reports" 버튼
- ✅ 검색 placeholder 텍스트
- ✅ 필터 옵션 ("전체 년도" ↔ "All Years")

## 🤖 자동 카테고리 분류 시스템

### 📋 분류 규칙

#### **1. Weekly Report 분류**
```javascript
조건:
- 제목에 "주간 동향", "weekly update" 포함
- 태그에 "주간동향", "시장분석" 포함
- 정규표현식: /주간.*동향/i, /weekly.*update/i
```

#### **2. In-depth Analysis 분류**
```javascript
조건:
- 제목에 "심층 분석", "전망", "방향성 점검" 포함
- 태그에 "기술적분석", "가격전망", "단기전망" 포함
- 정규표현식: /심층.*분석/i, /.*전망.*점검/i
```

#### **3. Fundamentals 분류**
```javascript
조건:
- 제목에 "펀더멘털", "공급", "수요", "생산" 포함
- 태그에 "펀더멘털", "공급분석", "수요분석" 포함
```

### 🔍 실제 분류 예시

현재 `reports.json`의 리포트들이 어떻게 분류되는지:

```javascript
// 예시 리포트
{
  "title": "커피 선물 시장 주간 동향",
  "tags": ["아라비카", "로부스타", "시장분석", "주간동향"]
}
// → 자동 분류: "weekly" (Weekly Report 페이지로 이동)

{
  "title": "단기 커피 선물 가격 전망 및 방향성 점검", 
  "tags": ["가격전망", "기술적분석", "지지선"]
}
// → 자동 분류: "analysis" (In-depth Analysis 페이지로 이동)
```

## 🌐 번역 시스템 작동 방식

### 1. **리포트 제목 번역**

#### 자동 번역 패턴
```javascript
// 기본 패턴 기반 번역
"커피 선물 시장" → "Coffee Futures Market"
"주간 동향" → "Weekly Trends"  
"시장 분석" → "Market Analysis"
"가격 전망" → "Price Outlook"
"기술적 분석" → "Technical Analysis"
```

#### 수동 번역 (주요 리포트)
```javascript
// 정확한 번역이 등록된 리포트들
"단기 커피 선물 가격 전망 및 방향성 점검" 
→ "Short-term Coffee Futures Price Outlook and Direction Analysis"

"커피 가격, 폭풍 전야 - 아라비카 시장 인포그래픽"
→ "Coffee Prices: Before the Storm - Arabica Market Infographic"
```

### 2. **태그 번역**
```javascript
한국어 태그 → 영어 태그
"가격전망" → "Price Forecast"
"기술적분석" → "Technical Analysis" 
"지지선" → "Support Level"
"브라질수확" → "Brazil Harvest"
"투기포지션" → "Speculative Position"
```

### 3. **요약문 처리**
```javascript
// 영어 요약이 없는 경우 기본 메시지
"This report provides detailed analysis of coffee market trends and insights. 
Please refer to the original Korean report for complete content."
```

## 📝 새 리포트 추가 시 워크플로우

### Step 1: 한국어 리포트 작성 및 업로드
```bash
# 예시: 새 주간 보고서 추가
Reports/2025/08/2025-08-01.html  # 한국어 리포트 파일
```

### Step 2: reports.json 업데이트 (선택사항)
```json
{
  "date": "2025-08-01",
  "displayDate": "2025년 8월 1일", 
  "title": "커피 선물 시장 주간 동향",
  "summary": "새로운 시장 동향 분석...",
  "tags": ["아라비카", "로부스타", "주간동향"],
  "link": "Reports/2025/08/2025-08-01.html"
}
```

### Step 3: 자동 처리 (코드에서 자동 실행)
1. ✅ **카테고리 자동 분류**: "주간 동향" → `weekly` 카테고리
2. ✅ **페이지 라우팅**: Weekly Report 페이지로 자동 연결
3. ✅ **번역 적용**: 영어 사용자에게는 번역된 제목/태그 표시
4. ✅ **UI 반영**: 메인 페이지와 해당 카테고리 페이지에 자동 표시

## 🎛️ 관리자 기능

### 커스텀 번역 추가
```javascript
// 특정 리포트의 정확한 영어 번역 추가
reportTranslator.addReportTranslation(
    "새로운 한국어 제목",
    "New English Title", 
    "한국어 요약",
    "English Summary"
);
```

### 카테고리 분류 디버깅
```javascript
// 브라우저 콘솔에서 실행
reportCategorizer.debugCategorization(allReports);
// 출력: 각 리포트의 분류 결과와 카테고리별 개수
```

## 🔧 메뉴 클릭 시 동작

### Weekly Report 메뉴 클릭
```javascript
weeklyReportMenu.addEventListener('click', (e) => {
    // 1. 메뉴 닫기
    closeMenu();
    
    // 2. weekly-report.html로 이동
    window.location.href = 'weekly-report.html';
    
    // 3. 해당 페이지에서 "weekly" 카테고리 리포트만 필터링 표시
});
```

### In-depth Analysis 메뉴 클릭
```javascript
analysisMenu.addEventListener('click', (e) => {
    // 1. 메뉴 닫기
    closeMenu();
    
    // 2. in-depth-analysis.html로 이동  
    window.location.href = 'in-depth-analysis.html';
    
    // 3. 해당 페이지에서 "analysis" 카테고리 리포트만 필터링 표시
});
```

## 📊 실시간 상태 확인

### 브라우저 콘솔에서 확인 가능한 정보
```javascript
// 1. 전체 리포트 수와 카테고리별 분포
console.log('📊 카테고리별 리포트 수:', reportCategorizer.getCategoryCounts(allReports));

// 2. 특정 리포트의 분류 결과
console.log('분류 결과:', reportCategorizer.categorizeReport(allReports[0]));

// 3. 현재 언어 설정
console.log('현재 언어:', i18n.getCurrentLanguage());

// 4. 번역된 리포트 목록
console.log('번역된 리포트:', reportTranslator.translateReports(allReports, 'en'));
```

## 🚀 최종 정리: "내가 한국 리포트만 올리면 끝?"

### ✅ **네, 맞습니다!** 

1. **한국어 리포트 파일만 업로드** → 시스템이 자동으로 처리
2. **제목에 따라 자동 분류** → Weekly/In-depth/Fundamentals 페이지로 자동 배치  
3. **영어 사용자에게는 번역된 버전 표시** → UI 요소 모두 영어로 변환
4. **메뉴 클릭 시 올바른 페이지로 이동** → 카테고리별 자동 필터링

### 🎯 **추가 작업이 필요한 경우**

#### 1. **정확한 영어 제목이 필요한 특별한 리포트**
```javascript
// 브라우저 콘솔에서 실행
reportTranslator.addReportTranslation(
    "특별한 한국어 제목",
    "Precise English Title"
);
```

#### 2. **새로운 카테고리 추가**
- `js/report-categorizer.js`에서 새 카테고리 규칙 추가
- 해당 카테고리용 페이지 생성

#### 3. **번역 품질 개선**
- `js/report-translator.js`에서 번역 패턴 업데이트

---

## 💡 결론

**한국어 리포트 하나만 업데이트하면, 영문 버전까지 모든 것이 자동으로 처리됩니다!** 

시스템이 알아서:
- 📂 카테고리 분류 (Weekly/In-depth/Fundamentals)
- 🌐 언어별 UI 번역  
- 🔄 페이지 라우팅
- 📱 반응형 표시

를 모두 처리하므로, **리포트 작성에만 집중**하시면 됩니다! 🎉