/**
 * 뉴스와 가격 데이터 기반 자동 분석 생성
 */

// 수집된 뉴스에서 헤드라인 자동 생성
function generateHeadline(newsItems, priceData) {
    if (!newsItems || newsItems.length === 0) {
        return '주간 커피 시장 동향';
    }
    
    // 가장 중요한 뉴스의 키워드 추출
    const topNews = newsItems.slice(0, 3);
    
    // 키워드 빈도 분석
    const keywords = new Map();
    const importantKeywords = [
        'tariff', '관세', 'brazil', '브라질', 'price', '가격',
        'vietnam', '베트남', 'inventory', '재고', 'ICE',
        'supply', '공급', 'demand', '수요', 'weather', '기후',
        'harvest', '수확', 'export', '수출', 'crop', '작황'
    ];
    
    topNews.forEach(news => {
        const text = (news.title + ' ' + news.content).toLowerCase();
        importantKeywords.forEach(keyword => {
            if (text.includes(keyword.toLowerCase())) {
                keywords.set(keyword, (keywords.get(keyword) || 0) + 1);
            }
        });
    });
    
    // 가장 빈번한 키워드 찾기
    const sortedKeywords = Array.from(keywords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([keyword]) => keyword);
    
    // 가격 동향 추가
    let priceContext = '';
    if (priceData) {
        const change = parseFloat(priceData.changePercent);
        if (Math.abs(change) > 2) {
            priceContext = change > 0 ? '급등' : '급락';
        } else if (Math.abs(change) > 0.5) {
            priceContext = change > 0 ? '상승' : '하락';
        } else {
            priceContext = '보합';
        }
    }
    
    // 헤드라인 패턴 생성
    const patterns = [
        `${priceData?.price || '--'}센트 ${priceContext}, ${sortedKeywords.slice(0, 2).join(' 및 ')} 영향`,
        `${sortedKeywords[0] || '시장'} 이슈로 ${priceContext} 마감`,
        `주간 ${priceContext} 기조, ${sortedKeywords.slice(0, 2).join('·')} 주목`
    ];
    
    // 가장 적절한 패턴 선택
    return patterns[0];
}

// 핵심 요약 자동 생성
function generateSummary(newsItems, priceData, inventory) {
    const parts = [];
    
    // 가격 정보
    if (priceData) {
        const change = parseFloat(priceData.changePercent);
        const direction = change >= 0 ? '상승' : '하락';
        parts.push(`커피 선물이 ${priceData.price}센트로 전주 대비 ${Math.abs(change).toFixed(2)}% ${direction}했습니다.`);
    }
    
    // 재고 정보
    if (inventory) {
        parts.push(`ICE 인증 재고는 ${inventory.arabica.toLocaleString()}백을 기록했습니다.`);
    }
    
    // 주요 뉴스 요약
    if (newsItems && newsItems.length > 0) {
        const topNews = newsItems[0];
        // 제목에서 핵심만 추출
        let newsTitle = topNews.title;
        if (newsTitle.length > 60) {
            newsTitle = newsTitle.substring(0, 57) + '...';
        }
        parts.push(`이번 주 주요 이슈는 "${newsTitle}"입니다.`);
    }
    
    return parts.join(' ');
}

// 시장 전망 자동 생성
function generateMarketOutlook(newsItems, priceData) {
    const outlook = {
        shortTerm: '',
        midTerm: '',
        risks: ''
    };
    
    // 뉴스 키워드 분석
    const allText = newsItems.map(n => n.title + ' ' + n.content).join(' ').toLowerCase();
    
    // 단기 전망 (가격 기반)
    if (priceData) {
        const change = parseFloat(priceData.changePercent);
        if (change > 1) {
            outlook.shortTerm = `현재 강세 모멘텀이 이어지고 있으며, ${priceData.price}센트 수준에서 추가 상승 가능성이 있습니다. `;
        } else if (change < -1) {
            outlook.shortTerm = `단기 조정 국면에 진입했으며, ${priceData.price}센트 근처에서 지지 여부를 확인해야 합니다. `;
        } else {
            outlook.shortTerm = `${priceData.price}센트 수준에서 횡보하고 있으며, 단기적으로 박스권 장세가 예상됩니다. `;
        }
    }
    
    // 중기 전망 (키워드 기반)
    const bullishKeywords = ['supply shortage', 'deficit', 'low inventory', 'weather risk', 'frost', 'drought'];
    const bearishKeywords = ['surplus', 'abundant', 'harvest complete', 'rain', 'recovery'];
    
    let bullishCount = 0;
    let bearishCount = 0;
    
    bullishKeywords.forEach(kw => {
        if (allText.includes(kw)) bullishCount++;
    });
    bearishKeywords.forEach(kw => {
        if (allText.includes(kw)) bearishCount++;
    });
    
    if (bullishCount > bearishCount) {
        outlook.midTerm = '공급 부족 우려가 지속되면서 중기적으로 강세 기조가 유지될 전망입니다. ';
    } else if (bearishCount > bullishCount) {
        outlook.midTerm = '공급 개선 전망으로 중기적으로 가격 조정 가능성이 있습니다. ';
    } else {
        outlook.midTerm = '공급과 수요가 균형을 이루면서 중기적으로 안정적인 흐름이 예상됩니다. ';
    }
    
    // 구조적 리스크 (고정 템플릿)
    outlook.risks = '기후 변화와 지정학적 리스크(관세 등)가 지속적인 변수로 작용하고 있습니다. ';
    
    if (allText.includes('tariff') || allText.includes('관세')) {
        outlook.risks += '특히 미-브라질 관세 협상 동향이 시장의 핵심 변수입니다.';
    } else if (allText.includes('weather') || allText.includes('climate')) {
        outlook.risks += '브라질과 베트남의 기후 상황을 면밀히 모니터링해야 합니다.';
    } else {
        outlook.risks += 'CFTC 투기 포지션과 환율 변동을 주의 깊게 살펴볼 필요가 있습니다.';
    }
    
    return outlook;
}

// 전체 분석 데이터 생성
function generateFullAnalysis(newsItems, priceData, inventory) {
    console.log('\n📝 자동 분석 생성 중...');
    
    const analysis = {
        headline: generateHeadline(newsItems, priceData),
        summary: generateSummary(newsItems, priceData, inventory),
        outlook: generateMarketOutlook(newsItems, priceData),
        generatedAt: new Date().toISOString()
    };
    
    console.log('✅ 분석 생성 완료');
    console.log(`   헤드라인: ${analysis.headline}`);
    console.log(`   요약: ${analysis.summary.substring(0, 60)}...`);
    
    return analysis;
}

// 테스트
async function main() {
    // 샘플 데이터
    const sampleNews = [
        { title: 'Coffee tariffs remain in place', content: 'Brazil coffee exports affected by US tariffs' },
        { title: 'ICE inventory hits low', content: 'Coffee inventory reaches 15-year low' },
        { title: 'Vietnam weather improves', content: 'Rain helps robusta crop' }
    ];
    
    const samplePrice = {
        price: '393.05',
        changePercent: '0.27'
    };
    
    const sampleInventory = {
        arabica: 465910
    };
    
    const analysis = generateFullAnalysis(sampleNews, samplePrice, sampleInventory);
    
    console.log('\n=== 생성된 분석 ===');
    console.log(JSON.stringify(analysis, null, 2));
}

if (require.main === module) {
    main();
}

module.exports = {
    generateHeadline,
    generateSummary,
    generateMarketOutlook,
    generateFullAnalysis
};
