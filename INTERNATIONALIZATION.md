# Coffee Market Updates - 국제화 (Internationalization) 시스템

이 문서는 Coffee Market Updates 웹사이트에 구현된 한국어-영어 이중 언어 지원 시스템에 대한 설명입니다.

## 🌐 기능 개요

- **언어 지원**: 한국어 (기본) 및 영어
- **언어 전환**: 각 페이지 상단 우측의 언어 선택기를 통한 실시간 언어 전환
- **언어 기억**: localStorage를 통한 사용자 언어 선택 저장
- **자동 적용**: 페이지 새로고침 시 이전 선택 언어 자동 적용

## 📁 파일 구조

```
/
├── js/
│   └── i18n.js                 # 국제화 시스템 핵심 파일
├── index.html                  # 메인 페이지 (완전 국제화 지원)
├── dashboards.html             # 대시보드 페이지 (완전 국제화 지원)
├── in-depth-analysis.html      # 심층 분석 페이지 (기본 국제화 지원)
├── weekly-report.html          # 주간 보고서 페이지 (기본 국제화 지원)
└── fundamentals/
    └── fundamentals.html       # 펀더멘털 페이지 (기본 국제화 지원)
```

## 🔧 구현 세부사항

### 1. 핵심 시스템 (`js/i18n.js`)

#### I18n 클래스
- **언어 관리**: 현재 언어 상태 관리 및 localStorage 연동
- **번역 데이터**: 한국어/영어 번역 텍스트 저장
- **DOM 업데이트**: `data-i18n` 속성을 가진 요소들의 자동 번역
- **이벤트 시스템**: 언어 변경 시 커스텀 이벤트 발생

#### 주요 메서드
```javascript
i18n.setLanguage(language)      // 언어 설정
i18n.t(key)                     // 번역 텍스트 반환
i18n.updatePageContent()        // 페이지 내용 업데이트
i18n.getCurrentLanguage()       // 현재 언어 반환
```

### 2. 언어 선택기 UI

#### 디자인 특징
- **위치**: 각 페이지 우상단
- **스타일**: 브랜드 컬러 (커피 브라운) 적용
- **플래그 아이콘**: SVG 기반 한국/미국 국기
- **드롭다운**: 호버 및 클릭 효과

#### HTML 구조
```html
<div class="language-selector">
    <button class="language-toggle" id="languageToggle">
        <span class="flag-icon ko" id="currentFlag"></span>
        <span id="currentLang">KO</span>
    </button>
    <div class="language-dropdown" id="languageDropdown">
        <div class="language-option" data-lang="ko">
            <span class="flag-icon ko"></span>
            <span>한국어</span>
        </div>
        <div class="language-option" data-lang="en">
            <span class="flag-icon en"></span>
            <span>English</span>
        </div>
    </div>
</div>
```

### 3. 번역 적용 방법

#### HTML 요소에 번역 키 지정
```html
<!-- 기본 텍스트 번역 -->
<h1 data-i18n="header.title">Coffee Market Updates</h1>

<!-- placeholder 번역 -->
<input type="text" data-i18n="search.placeholder" placeholder="검색어 입력...">

<!-- 복합 텍스트 번역 -->
<div class="analysis-text" data-i18n="analysis.coffee">
    커피 관련 분석 내용...
</div>
```

## 📝 번역 키 체계

### 네이밍 규칙
- **계층 구조**: 점(.)으로 구분된 계층적 키 구조
- **명확성**: 기능과 위치를 명확히 표현하는 키명
- **일관성**: 유사한 요소들의 일관된 네이밍

### 주요 번역 카테고리

#### 메뉴 및 네비게이션
```javascript
'menu.title': 'Coffee Market'
'menu.subtitle': 'Information Menu'
'menu.weeklyReport': 'Weekly Report'
'menu.analysis': 'In-depth Analysis'
```

#### 메인 헤더
```javascript
'header.title': 'Coffee Market Updates'
'header.subtitle': 'Coffee Futures Market Analysis & Dashboard'
'header.description': '커피 선물 시장 분석 보고서...'
```

#### 차트 관련
```javascript
'chart.coffeeFutures': 'Coffee Futures'
'chart.usdBrl': 'USD/BRL Exchange Rate'
'chart.source': 'Source'
'chart.analysis': '📊 Chart Analysis'
```

#### 페이지별 컨텐츠
```javascript
'page.dashboards.title': '📊 Market Dashboards'
'page.analysis.title': '🔍 In-depth Analysis'
'page.fundamentals.title': 'Coffee Market Fundamentals'
```

## 🚀 사용 방법

### 1. 새로운 페이지에 국제화 추가

#### HTML 헤드에 스크립트 추가
```html
<script src="js/i18n.js"></script>
```

#### 언어 선택기 UI 추가
```html
<!-- 언어 선택기 CSS는 기존 페이지 참조 -->
<div class="language-selector">
    <!-- 언어 선택기 HTML 구조 -->
</div>
```

#### JavaScript 초기화
```javascript
document.addEventListener('DOMContentLoaded', () => {
    i18n.updatePageContent();
    initializeLanguageSelector();
    // 기타 초기화 코드...
});
```

### 2. 새로운 번역 키 추가

#### i18n.js에 번역 추가
```javascript
// 한국어
ko: {
    'new.key': '새로운 한국어 텍스트'
}

// 영어  
en: {
    'new.key': 'New English Text'
}
```

#### HTML에 번역 키 적용
```html
<div data-i18n="new.key">새로운 한국어 텍스트</div>
```

## 🎨 스타일링

### CSS 클래스
- `.language-selector`: 언어 선택기 컨테이너
- `.language-toggle`: 언어 토글 버튼
- `.language-dropdown`: 드롭다운 메뉴
- `.language-option`: 개별 언어 옵션
- `.flag-icon`: 국기 아이콘

### 브랜드 컬러 적용
- **주 색상**: `#8B4513` (커피 브라운)
- **보조 색상**: `#A0522D` (연한 커피 브라운)
- **호버 효과**: 그라데이션 및 그림자 효과

## 📱 반응형 지원

- **데스크톱**: 우상단 고정 위치
- **모바일**: 적응형 크기 조정
- **터치 지원**: 모바일 터치 이벤트 최적화

## 🔄 확장 가능성

### 추가 언어 지원
```javascript
// 새로운 언어 추가 예시
loadTranslations() {
    this.translations = {
        ko: { /* 한국어 번역 */ },
        en: { /* 영어 번역 */ },
        ja: { /* 일본어 번역 */ },  // 새로운 언어
        zh: { /* 중국어 번역 */ }   // 새로운 언어
    };
}
```

### 동적 컨텐츠 번역
```javascript
// 동적으로 생성되는 컨텐츠의 번역
function createDynamicContent() {
    const element = document.createElement('div');
    element.innerHTML = i18n.t('dynamic.content.key');
    return element;
}
```

## 🐛 알려진 제한사항

1. **정적 번역**: 현재는 정적 텍스트 번역만 지원
2. **복잡한 HTML**: 복잡한 HTML 구조 내 번역은 수동 처리 필요
3. **차트 라벨**: Chart.js 라벨의 동적 번역은 별도 구현 필요

## 📈 성능 최적화

- **localStorage 캐싱**: 언어 선택 저장으로 빠른 로딩
- **이벤트 기반**: 필요시에만 DOM 업데이트
- **경량화**: 최소한의 JavaScript 코드로 구현

## 🔧 유지보수

### 번역 업데이트
1. `js/i18n.js`에서 해당 키의 번역 수정
2. 페이지 새로고침으로 즉시 반영

### 새로운 페이지 추가
1. 해당 페이지에 i18n.js 스크립트 추가
2. 언어 선택기 UI 추가 (CSS 포함)
3. 초기화 JavaScript 코드 추가
4. 필요한 번역 키 추가

---

이 국제화 시스템을 통해 Coffee Market Updates 웹사이트는 한국어와 영어 사용자 모두에게 최적화된 사용자 경험을 제공합니다.