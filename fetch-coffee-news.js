const Parser = require('rss-parser');
const parser = new Parser({
    timeout: 10000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CoffeeMarketBot/1.0)'
    }
});

/**
 * RSS 피드에서 커피 관련 뉴스 수집
 * 최근 7일 이내의 뉴스만 필터링
 */

// RSS 피드 소스
const RSS_FEEDS = [
    {
        name: 'Google News - Coffee Futures',
        url: 'https://news.google.com/rss/search?q=coffee+futures+OR+coffee+prices+OR+coffee+market&hl=en-US&gl=US&ceid=US:en',
        weight: 10 // 우선순위
    },
    {
        name: 'Google News - Coffee Brazil',
        url: 'https://news.google.com/rss/search?q=coffee+brazil+OR+arabica&hl=en-US&gl=US&ceid=US:en',
        weight: 8
    },
    {
        name: 'Reuters Coffee',
        url: 'https://www.reuters.com/markets/commodities/rss',
        weight: 9
    }
];

// 날짜 필터 (최근 N일)
function isRecent(dateString, daysBack = 7) {
    const date = new Date(dateString);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysBack);
    return date >= cutoff;
}

// 커피 관련 키워드 필터
function isCoffeeRelated(title, content) {
    const keywords = [
        'coffee', 'arabica', 'robusta', 'futures', 'ICE', 
        'brazil', 'vietnam', 'colombia', 'ethiopia',
        'beans', 'harvest', 'crop', 'export', 'tariff'
    ];
    
    const text = (title + ' ' + content).toLowerCase();
    return keywords.some(keyword => text.includes(keyword));
}

// 단일 RSS 피드 파싱
async function parseFeed(feedConfig) {
    try {
        console.log(`📡 ${feedConfig.name} 수집 중...`);
        const feed = await parser.parseURL(feedConfig.url);
        
        const items = feed.items
            .filter(item => {
                // 날짜 필터
                if (item.pubDate && !isRecent(item.pubDate, 7)) {
                    return false;
                }
                
                // 커피 관련 필터
                const title = item.title || '';
                const content = item.contentSnippet || item.content || '';
                return isCoffeeRelated(title, content);
            })
            .map(item => ({
                date: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                title: item.title || 'No title',
                content: (item.contentSnippet || item.content || '').substring(0, 300),
                link: item.link || '',
                source: feedConfig.name,
                weight: feedConfig.weight
            }));
        
        console.log(`   ✅ ${items.length}개 뉴스 발견`);
        return items;
    } catch (error) {
        console.error(`   ❌ ${feedConfig.name} 수집 실패:`, error.message);
        return [];
    }
}

// 모든 RSS 피드 수집
async function fetchAllCoffeeNews() {
    console.log('\n=== 커피 뉴스 수집 시작 ===\n');
    
    const allNews = [];
    
    for (const feed of RSS_FEEDS) {
        const items = await parseFeed(feed);
        allNews.push(...items);
    }
    
    // 중복 제거 (같은 제목)
    const uniqueNews = [];
    const seenTitles = new Set();
    
    for (const news of allNews) {
        if (!seenTitles.has(news.title)) {
            seenTitles.add(news.title);
            uniqueNews.push(news);
        }
    }
    
    // 중요도와 날짜로 정렬
    uniqueNews.sort((a, b) => {
        // 최신순
        if (a.date !== b.date) {
            return b.date.localeCompare(a.date);
        }
        // 중요도순
        return b.weight - a.weight;
    });
    
    console.log(`\n=== 수집 완료: 총 ${uniqueNews.length}개 뉴스 ===\n`);
    
    return uniqueNews;
}

// 뉴스를 HTML 형식으로 변환
function formatNewsAsHTML(newsList, maxItems = 6) {
    const items = newsList.slice(0, maxItems);
    
    return items.map(news => {
        // 날짜 포맷 (YYYY-MM-DD -> YYYY.MM.DD)
        const formattedDate = news.date.replace(/-/g, '.');
        
        // 제목에서 핵심만 추출
        let title = news.title;
        if (title.length > 100) {
            title = title.substring(0, 97) + '...';
        }
        
        // 내용 정리
        let content = news.content
            .replace(/<[^>]*>/g, '') // HTML 태그 제거
            .replace(/\s+/g, ' ')     // 연속 공백 제거
            .trim();
        
        if (content.length > 200) {
            content = content.substring(0, 197) + '...';
        }
        
        return `                <div class="news-item">
                    <div class="news-date">${formattedDate}</div>
                    <div class="news-content">
                        <strong>${title}</strong> ${content}
                        <a href="${news.link}" target="_blank">출처</a>
                    </div>
                </div>`;
    }).join('\n                \n');
}

// 메인 함수
async function main() {
    try {
        const news = await fetchAllCoffeeNews();
        
        if (news.length > 0) {
            console.log('📰 최근 뉴스 샘플 (상위 3개):\n');
            news.slice(0, 3).forEach((item, idx) => {
                console.log(`${idx + 1}. [${item.date}] ${item.title}`);
                console.log(`   출처: ${item.source}`);
                console.log(`   링크: ${item.link}\n`);
            });
        }
        
        return news;
    } catch (error) {
        console.error('뉴스 수집 중 오류:', error);
        return [];
    }
}

// 실행
if (require.main === module) {
    main().then(news => {
        console.log(`\n총 ${news.length}개의 커피 관련 뉴스를 수집했습니다.`);
    });
}

module.exports = {
    fetchAllCoffeeNews,
    formatNewsAsHTML
};
