# 커피 시장 데이터 자동 수집 가이드

## 문제점
현재 제가 사용할 수 있는 도구에는 웹 검색 기능이 없습니다.

## 해결 방안

### 옵션 1: Node.js 스크래핑 (추천)

#### 필요한 패키지 설치
```bash
npm install axios cheerio rss-parser
```

#### 데이터 소스

**1. 커피 가격 데이터**
- Barchart: https://www.barchart.com/futures/quotes/KCZ25
- Investing.com: https://www.investing.com/commodities/us-coffee-c
- Yahoo Finance: 무료 API 제공

**2. 뉴스 소스 (RSS 피드)**
```javascript
const Parser = require('rss-parser');
const parser = new Parser();

// Google News - Coffee Futures
const feed = await parser.parseURL('https://news.google.com/rss/search?q=coffee+futures');

// Reuters Coffee
const reuters = await parser.parseURL('https://www.reuters.com/markets/commodities/');
```

**3. ICE 재고 데이터**
- ICE 공식 사이트 스크래핑
- 또는 USDA API 활용

### 옵션 2: 무료 API 활용

**Financial Modeling Prep API** (무료 tier 제공)
```javascript
const axios = require('axios');

const API_KEY = 'YOUR_KEY';
const url = `https://financialmodelingprep.com/api/v3/quote/KC=F?apikey=${API_KEY}`;
const response = await axios.get(url);
```

**Alpha Vantage** (무료 tier 제공)
```javascript
const url = `https://www.alphavantage.co/query?function=COMMODITY&symbol=COFFEE&apikey=${API_KEY}`;
```

### 옵션 3: 수동 데이터 입력 + AI 분석

1. 매주 토요일 템플릿 생성
2. 주요 URL 제공:
   - Barchart: 가격 데이터
   - Google News: 최근 뉴스
   - ICE 공식 사이트: 재고 데이터
3. Claude나 ChatGPT에게 데이터 분석 요청
4. 생성된 내용을 리포트에 복사

## 추천 방안

**단기 (지금 바로 구현 가능):**
- `fetch-market-data.js` 스크립트 완성
- RSS 피드로 뉴스 자동 수집
- 템플릿에 자동 삽입

**장기 (더 정교한 자동화):**
- 유료 API 구독 (정확한 데이터)
- AI/LLM 통합하여 분석 자동 작성
- 스케줄러로 완전 자동화

## 다음 단계

어느 방식을 선택하시겠습니까?

1. **Node.js 스크래핑 구현** (무료, 설정 필요)
2. **무료 API 사용** (제한적, 간단)
3. **수동 + AI 보조** (가장 현실적, 품질 높음)
