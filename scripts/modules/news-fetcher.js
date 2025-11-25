/**
 * 뉴스 데이터 수집 모듈
 * 
 * 수집 대상:
 * - Reuters, Bloomberg (시장 뉴스)
 * - Perfect Daily Grind (산업 뉴스)
 * - Coffee Network, Global Coffee Report
 * - USDA, ICO 공식 발표
 * - StoneX, Volcafe, Rabobank (애널리스트 리포트)
 */

const https = require('https');
const http = require('http');

// 검색 키워드
const SEARCH_QUERIES = [
    'coffee futures price',
    'ICE arabica market',
    'Brazil coffee harvest',
    'Vietnam coffee production',
    'Colombia coffee exports',
    'coffee certified stocks ICE',
    'USDA coffee report',
    'StoneX coffee forecast',
    'Volcafe coffee',
    'Rabobank coffee'
];

// 우선순위 뉴스 소스
const PRIORITY_SOURCES = {
    tier1: ['Reuters', 'Bloomberg', 'USDA', 'ICO'],
    tier2: ['Perfect Daily Grind', 'Daily Coffee News', 'Comunicaffe'],
    tier3: ['Coffee Network', 'Global Coffee Report', 'Nasdaq', 'Barchart'],
    tier4: ['StoneX', 'Volcafe', 'Rabobank', 'Trading Economics']
};

// HTTP 요청 헬퍼
function fetchUrl(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const timeout = options.timeout || 30000;
        
        const req = protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                ...options.headers
            }
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                fetchUrl(res.headers.location, options)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        
        req.on('error', reject);
        req.setTimeout(timeout, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// RSS 피드 파싱 (간단한 버전)
function parseRSS(xml) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    
    while ((match = itemRegex.exec(xml)) !== null) {
        const itemContent = match[1];
        
        const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
        const linkMatch = itemContent.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i);
        const descMatch = itemContent.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
        const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/i);
        
        if (titleMatch) {
            items.push({
                title: titleMatch[1].replace(/<[^>]+>/g, '').trim(),
                link: linkMatch ? linkMatch[1].trim() : '',
                description: descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 300) : '',
                pubDate: pubDateMatch ? new Date(pubDateMatch[1]) : new Date()
            });
        }
    }
    
    return items;
}

// 커피 관련 뉴스 필터링
function isRelevantNews(news) {
    const keywords = [
        'coffee', 'arabica', 'robusta', 'ICE', 'futures',
        'brazil', 'vietnam', 'colombia', 'harvest', 'production',
        'export', 'import', 'price', 'stocks', 'inventory',
        'CFTC', 'COT', 'trader', 'roaster',
        '커피', '아라비카', '로부스타', '브라질', '베트남'
    ];
    
    const text = `${news.title} ${news.description}`.toLowerCase();
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
}

// 날짜 범위 내 뉴스 필터링
function isWithinDateRange(news, weekRange) {
    const newsDate = new Date(news.pubDate);
    const startDate = new Date(weekRange.start);
    const endDate = new Date(weekRange.end);
    
    // 범위를 약간 확장 (하루 여유)
    startDate.setDate(startDate.getDate() - 1);
    endDate.setDate(endDate.getDate() + 1);
    
    return newsDate >= startDate && newsDate <= endDate;
}

// 뉴스 소스별 수집
async function fetchFromSource(source) {
    const sources = {
        'perfectdailygrind': {
            url: 'https://perfectdailygrind.com/feed/',
            name: 'Perfect Daily Grind'
        },
        'dailycoffeenews': {
            url: 'https://dailycoffeenews.com/feed/',
            name: 'Daily Coffee News'
        },
        'comunicaffe': {
            url: 'https://www.comunicaffe.com/feed/',
            name: 'Comunicaffe'
        }
    };
    
    const sourceConfig = sources[source];
    if (!sourceConfig) {
        return [];
    }
    
    try {
        console.log(`        - ${sourceConfig.name} 수집 중...`);
        const response = await fetchUrl(sourceConfig.url);
        
        if (response.status !== 200) {
            console.log(`        ⚠️ ${sourceConfig.name}: HTTP ${response.status}`);
            return [];
        }
        
        const items = parseRSS(response.data);
        const coffeeNews = items.filter(isRelevantNews);
        
        console.log(`        ✓ ${sourceConfig.name}: ${coffeeNews.length}건`);
        
        return coffeeNews.map(item => ({
            ...item,
            source: sourceConfig.name,
            sourceKey: source
        }));
        
    } catch (error) {
        console.log(`        ⚠️ ${sourceConfig.name} 실패: ${error.message}`);
        return [];
    }
}

// 웹 검색 결과 수집 (선택적 - API 키 필요)
async function searchNews(query, options = {}) {
    // Google Custom Search API 또는 다른 검색 API 사용 가능
    // 여기서는 placeholder로 두고, 실제 구현 시 API 키 필요
    
    if (!process.env.SEARCH_API_KEY) {
        return [];
    }
    
    // 실제 구현 시:
    // const apiKey = process.env.SEARCH_API_KEY;
    // const searchUrl = `https://api.example.com/search?q=${encodeURIComponent(query)}&key=${apiKey}`;
    // ...
    
    return [];
}

// 메인 뉴스 수집 함수
async function fetchNewsData(weekRange) {
    console.log(`        분석 기간: ${weekRange.start} ~ ${weekRange.end}`);
    
    const allNews = [];
    
    // RSS 피드에서 수집
    const rssResults = await Promise.all([
        fetchFromSource('perfectdailygrind'),
        fetchFromSource('dailycoffeenews'),
        fetchFromSource('comunicaffe')
    ]);
    
    rssResults.forEach(news => allNews.push(...news));
    
    // 날짜 범위 필터링
    const filteredNews = allNews.filter(news => isWithinDateRange(news, weekRange));
    
    // 중복 제거 (제목 기준)
    const uniqueNews = [];
    const seenTitles = new Set();
    
    for (const news of filteredNews) {
        const normalizedTitle = news.title.toLowerCase().trim();
        if (!seenTitles.has(normalizedTitle)) {
            seenTitles.add(normalizedTitle);
            uniqueNews.push(news);
        }
    }
    
    // 날짜순 정렬 (최신순)
    uniqueNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    // 소스 티어별 정렬
    const sortedNews = uniqueNews.sort((a, b) => {
        const getTier = (source) => {
            if (PRIORITY_SOURCES.tier1.some(s => source.includes(s))) return 1;
            if (PRIORITY_SOURCES.tier2.some(s => source.includes(s))) return 2;
            if (PRIORITY_SOURCES.tier3.some(s => source.includes(s))) return 3;
            return 4;
        };
        
        const tierA = getTier(a.source);
        const tierB = getTier(b.source);
        
        if (tierA !== tierB) return tierA - tierB;
        return new Date(b.pubDate) - new Date(a.pubDate);
    });
    
    console.log(`        총 ${sortedNews.length}건의 관련 뉴스 수집 완료`);
    
    return sortedNews;
}

// 수동 뉴스 입력 (환경 변수 또는 파일에서)
function loadManualNews() {
    const manualNewsPath = process.env.MANUAL_NEWS_PATH;
    
    if (manualNewsPath && require('fs').existsSync(manualNewsPath)) {
        try {
            const content = require('fs').readFileSync(manualNewsPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error('수동 뉴스 파일 로드 실패:', error.message);
        }
    }
    
    return [];
}

module.exports = {
    fetchNewsData,
    fetchFromSource,
    searchNews,
    loadManualNews,
    parseRSS,
    isRelevantNews,
    isWithinDateRange,
    SEARCH_QUERIES,
    PRIORITY_SOURCES
};
