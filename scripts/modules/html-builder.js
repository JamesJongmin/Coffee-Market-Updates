/**
 * HTML 빌더 모듈
 * 
 * 생성된 콘텐츠를 기존 리포트 템플릿 스타일에 맞춰 HTML로 변환합니다.
 */

// 날짜 포맷팅
function formatKoreanDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function formatDateISO(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// HTML 이스케이프
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 메타데이터 블록 생성
function buildReportMeta(data) {
    const { date, content } = data;
    
    const meta = {
        title: content.title || '커피 선물 시장 주간 동향',
        subtitle: content.subtitle || 'Coffee Futures Market Weekly Update',
        date: formatDateISO(date),
        summary: content.summary || '',
        tags: content.tags || [],
        author: 'Align Commodities',
        contact: 'james.baek@aligncommodities.com',
        sources: (content.sources || []).map(s => s.name),
        report_type: 'weekly',
        analysis_period: `${data.weekRange.start} to ${data.weekRange.end}`
    };
    
    // 가격 데이터 추가
    if (data.marketData.arabica) {
        meta.price_current = String(data.marketData.arabica.price);
        meta.price_change = `${data.marketData.arabica.change >= 0 ? '+' : ''}${data.marketData.arabica.change.toFixed(2)} (${data.marketData.arabica.changePercent}%)`;
    }
    
    return `<!--REPORT_META
${JSON.stringify(meta, null, 4)}
REPORT_META-->`;
}

// 가격 스냅샷 섹션 생성
function buildPriceSnapshot(marketData, content) {
    let priceCards = '';
    
    if (marketData.arabica) {
        const changeClass = marketData.arabica.change >= 0 ? 'up' : 'down';
        const changeSign = marketData.arabica.change >= 0 ? '+' : '';
        
        priceCards += `
                <div class="price-card">
                    <div class="price-label">ICE 아라비카 근월물</div>
                    <div class="price-value">${marketData.arabica.price}¢</div>
                    <div class="price-change ${changeClass}">${changeSign}${marketData.arabica.change.toFixed(2)}¢ (${changeSign}${marketData.arabica.changePercent}%)</div>
                    <p style="font-size: 0.85rem; color: #999; margin-top: 10px; margin-bottom: 0;">금요일 종가 기준</p>
                </div>`;
    }
    
    if (marketData.iceStocks && typeof marketData.iceStocks.total === 'number') {
        const stocksChangeClass = marketData.iceStocks.change >= 0 ? 'up' : 'down';
        
        priceCards += `
                <div class="price-card">
                    <div class="price-label">ICE 아라비카 재고</div>
                    <div class="price-value">${Math.round(marketData.iceStocks.total).toLocaleString()}백</div>
                    <div class="price-change ${stocksChangeClass}">전주 대비 ${marketData.iceStocks.changePercent}%</div>
                    <p style="font-size: 0.85rem; color: #999; margin-top: 10px; margin-bottom: 0;">ICE 인증 재고</p>
                </div>`;
    }
    
    if (!priceCards) {
        return '';
    }
    
    return `
            <div class="price-snapshot">
${priceCards}
            </div>`;
}

// 가격 테이블 생성
function buildPriceTable(content, marketData) {
    if (!content.sections?.priceAction?.priceTable?.length) {
        return '';
    }
    
    const rows = content.sections.priceAction.priceTable.map(row => {
        const changeClass = row.change?.startsWith('-') ? 'down' : 'up';
        return `
                    <tr>
                        <td>${escapeHtml(row.contract)}</td>
                        <td>${escapeHtml(row.price)}¢</td>
                        <td class="price-change ${changeClass}">${escapeHtml(row.change)}</td>
                        <td>${escapeHtml(row.volume || '-')}</td>
                    </tr>`;
    }).join('');
    
    return `
            <table>
                <thead>
                    <tr>
                        <th>계약월물</th>
                        <th>종가</th>
                        <th>주간 변동</th>
                        <th>거래량</th>
                    </tr>
                </thead>
                <tbody>
${rows}
                </tbody>
            </table>`;
}

// 핵심 포인트 박스 생성
function buildHighlightBox(title, points) {
    if (!points || points.length === 0) return '';
    
    const pointsList = points.map(p => `<li style="margin-bottom: 8px;">${escapeHtml(p)}</li>`).join('\n                    ');
    
    return `
            <div class="highlight-box">
                <h3>${escapeHtml(title)}</h3>
                <ul style="margin: 15px 0; padding-left: 20px;">
                    ${pointsList}
                </ul>
            </div>`;
}

// 뉴스 아이템 생성
function buildNewsItems(newsItems) {
    if (!newsItems || newsItems.length === 0) return '';
    
    return newsItems.map(news => `
            <div class="news-item">
                <p class="news-date">${escapeHtml(news.date)}</p>
                <p class="news-title">${escapeHtml(news.title)}</p>
                <p>${escapeHtml(news.summary)}</p>
                <p><a href="${escapeHtml(news.sourceUrl)}" target="_blank">${escapeHtml(news.source)}</a></p>
            </div>`).join('\n');
}

// 리스크 매트릭스 테이블 생성
function buildRiskMatrix(riskFactors) {
    if (!riskFactors) return '';
    
    const bullish = riskFactors.bullish || [];
    const bearish = riskFactors.bearish || [];
    const maxRows = Math.max(bullish.length, bearish.length);
    
    let rows = '';
    for (let i = 0; i < maxRows; i++) {
        rows += `
                    <tr>
                        <td>${bullish[i] ? escapeHtml(bullish[i]) : ''}</td>
                        <td>${bearish[i] ? escapeHtml(bearish[i]) : ''}</td>
                    </tr>`;
    }
    
    return `
            <table style="margin: 25px 0;">
                <thead>
                    <tr>
                        <th style="width: 50%;">상승 촉매</th>
                        <th style="width: 50%;">하락 촉매</th>
                    </tr>
                </thead>
                <tbody>
${rows}
                </tbody>
            </table>`;
}

// 출처 목록 생성
function buildSourcesList(sources) {
    if (!sources || sources.length === 0) return '';
    
    return sources.map(s => s.name).join(', ');
}

// 메인 HTML 빌더
function buildReportHTML(data) {
    const { date, dateStr, weekRange, marketData, newsData, content } = data;
    
    const reportMeta = buildReportMeta(data);
    const priceSnapshot = buildPriceSnapshot(marketData, content);
    const priceTable = buildPriceTable(content, marketData);
    
    const sections = content.sections || {};
    
    // 시장 개요 섹션
    const marketOverview = sections.marketOverview || {};
    const keyPointsBox = buildHighlightBox('🔑 이번 주 핵심 포인트', marketOverview.keyPoints);
    
    // 뉴스 섹션
    const keyNews = sections.keyNews || {};
    const newsItems = buildNewsItems(keyNews.items);
    
    // 산지별 동향
    const originUpdates = sections.originUpdates || {};
    
    // 리스크 매트릭스
    const riskMatrix = buildRiskMatrix(sections.riskFactors);
    
    // 전망 섹션
    const outlook = sections.outlook || {};
    
    // 출처 목록
    const sourcesList = buildSourcesList(content.sources);
    
    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>커피 선물 시장 주간 동향</title>
    <link rel="preconnect" href="https://cdn.jsdelivr.net">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">

${reportMeta}

    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-GX9R36120J"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-GX9R36120J');
    </script>

    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.8;
            color: #e0e0e0;
            background: #0a0a0a;
            position: relative;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: radial-gradient(circle at 20% 30%, rgba(139, 69, 19, 0.08) 0%, transparent 50%),
                        radial-gradient(circle at 80% 70%, rgba(210, 105, 30, 0.05) 0%, transparent 50%);
            pointer-events: none;
            z-index: 0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 60px 40px;
            position: relative;
            z-index: 1;
        }
        header {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: white;
            padding: 60px 40px;
            margin-bottom: 50px;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(139, 69, 19, 0.2);
            position: relative;
            overflow: hidden;
        }
        header::before {
            content: '';
            position: absolute;
            top: 0; right: 0;
            width: 300px; height: 300px;
            background: radial-gradient(circle, rgba(210, 105, 30, 0.15) 0%, transparent 70%);
            border-radius: 50%;
            transform: translate(30%, -30%);
        }
        header > * { position: relative; z-index: 1; }
        
        .home-button {
            position: absolute;
            top: 20px;
            right: 20px;
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: #D2691E;
            text-decoration: none;
            font-size: 0.85rem;
            font-weight: 500;
            transition: all 0.3s ease;
            z-index: 10;
        }
        
        .home-button:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(210, 105, 30, 0.3);
            transform: translateY(-1px);
        }
        
        .header-meta {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: rgba(210, 105, 30, 0.8);
            margin-bottom: 15px;
            font-weight: 600;
        }
        h1 {
            font-size: 2.5rem;
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 15px;
            color: #ffffff;
        }
        .subtitle {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 10px;
        }
        .date {
            font-size: 0.875rem;
            color: rgba(210, 105, 30, 0.9);
            font-weight: 500;
            display: inline-block;
            padding: 6px 16px;
            background: rgba(210, 105, 30, 0.1);
            border-radius: 20px;
            border: 1px solid rgba(210, 105, 30, 0.2);
        }
        h2 {
            font-size: 1.75rem;
            font-weight: 700;
            margin: 50px 0 25px 0;
            padding-bottom: 15px;
            border-bottom: 3px solid #8B4513;
            color: #ffffff;
        }
        h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 30px 0 15px 0;
            color: #ffffff;
        }
        p {
            margin-bottom: 20px;
            color: #cccccc;
            font-size: 1rem;
        }
        .highlight-box {
            background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%);
            border-left: 4px solid #8B4513;
            padding: 25px;
            margin: 30px 0;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }
        .price-snapshot {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 30px 0;
        }
        .price-card {
            background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%);
            padding: 25px;
            border-radius: 12px;
            border: 1px solid rgba(139, 69, 19, 0.3);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }
        .price-label {
            font-size: 0.85rem;
            color: rgba(210, 105, 30, 0.8);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
            font-weight: 600;
        }
        .price-value {
            font-size: 2rem;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 5px;
        }
        .price-change {
            font-size: 0.95rem;
            font-weight: 500;
        }
        .price-change.down { color: #e74c3c; }
        .price-change.up { color: #2ecc71; }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: #1a1a1a;
            border-radius: 8px;
            overflow: hidden;
        }
        thead {
            background: linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%);
        }
        th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid rgba(139, 69, 19, 0.2);
        }
        th {
            font-weight: 600;
            color: #D2691E;
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 1px;
        }
        td {
            color: #cccccc;
        }
        tbody tr:hover {
            background: rgba(139, 69, 19, 0.1);
        }
        .news-item {
            background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%);
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            border-left: 3px solid #8B4513;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        .news-date {
            font-size: 0.8rem;
            color: #D2691E;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .news-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 12px;
        }
        .news-item a {
            color: #D2691E;
            text-decoration: none;
            font-size: 0.85rem;
            transition: color 0.3s;
        }
        .news-item a:hover {
            color: #ff8c42;
            text-decoration: underline;
        }
        .footer {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px solid rgba(139, 69, 19, 0.3);
            color: #999;
            font-size: 0.9rem;
        }
        .footer strong {
            color: #D2691E;
        }
        .footer a {
            color: #D2691E;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 30px 20px;
            }
            header {
                padding: 40px 25px;
            }
            h1 {
                font-size: 1.75rem;
            }
            .price-snapshot {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <a href="../../../index.html" class="home-button">← 홈으로</a>
            <div class="header-meta">주간 시장 동향 리포트</div>
            <h1>${escapeHtml(content.title || '커피 선물 시장 주간 동향')}</h1>
            <p class="subtitle">${escapeHtml(content.subtitle || 'Coffee Futures Market Weekly Update')}</p>
            <p class="date">${formatKoreanDate(date)}</p>
        </header>

        <section>
            <h2>시장 개요</h2>
            
            <p>${escapeHtml(content.summary || '')}</p>

${priceSnapshot}

${keyPointsBox}

${priceTable}

        </section>

        <section>
            <h2>주간 핵심 뉴스</h2>
            
${newsItems}

        </section>

        <section>
            <h2>산지별 동향</h2>
            
            ${originUpdates.brazil ? `<h3>🇧🇷 ${escapeHtml(originUpdates.brazil.title || '브라질')}</h3>
            ${originUpdates.brazil.content || '<p>브라질 동향 정보가 없습니다.</p>'}` : ''}
            
            ${originUpdates.vietnam ? `<h3>🇻🇳 ${escapeHtml(originUpdates.vietnam.title || '베트남')}</h3>
            ${originUpdates.vietnam.content || '<p>베트남 동향 정보가 없습니다.</p>'}` : ''}
            
            ${originUpdates.others ? `<h3>🌍 ${escapeHtml(originUpdates.others.title || '기타 산지')}</h3>
            ${originUpdates.others.content || '<p>기타 산지 동향 정보가 없습니다.</p>'}` : ''}

        </section>

        ${sections.supplyDemand ? `<section>
            <h2>${escapeHtml(sections.supplyDemand.title || '수급 전망')}</h2>
            ${sections.supplyDemand.content || '<p>수급 전망 정보가 없습니다.</p>'}
        </section>` : ''}

        ${sections.technicalAnalysis ? `<section>
            <h2>${escapeHtml(sections.technicalAnalysis.title || '기술적 분석')}</h2>
            
            ${sections.technicalAnalysis.support?.length ? `<p><strong>주요 지지선:</strong> ${sections.technicalAnalysis.support.join(', ')}</p>` : ''}
            ${sections.technicalAnalysis.resistance?.length ? `<p><strong>주요 저항선:</strong> ${sections.technicalAnalysis.resistance.join(', ')}</p>` : ''}
            
            ${sections.technicalAnalysis.content || ''}
        </section>` : ''}

        <section>
            <h2>시장 전망</h2>
            
            ${outlook.shortTerm ? `<div class="highlight-box">
                <h3>📊 단기 전망</h3>
                ${outlook.shortTerm.range ? `<p style="font-size: 1.05rem; font-weight: 600; color: #D2691E; margin-bottom: 15px;">예상 레인지: ${escapeHtml(outlook.shortTerm.range)}¢</p>` : ''}
                <p>${escapeHtml(outlook.shortTerm.content || '')}</p>
            </div>` : ''}
            
            ${outlook.midTerm ? `<div class="highlight-box">
                <h3>🔮 중장기 전망</h3>
                <p>${escapeHtml(outlook.midTerm.content || '')}</p>
            </div>` : ''}
            
            <h3>⚖️ 리스크 매트릭스</h3>
${riskMatrix}

        </section>

        <div class="footer">
            <p style="font-size: 1rem; margin-bottom: 15px;"><strong>Published by Align Commodities</strong></p>
            
            <p style="font-size: 0.95rem; margin-bottom: 20px;">
                💬 생두 구매 문의는 <a href="mailto:james.baek@aligncommodities.com">james.baek@aligncommodities.com</a>으로 연락주세요.
            </p>
            
            <p style="margin-top: 25px; margin-bottom: 10px;"><strong>보고서 정보</strong></p>
            <p style="font-size: 0.85rem; color: #999 !important; margin-bottom: 20px;">
                작성일: ${formatKoreanDate(date)} | 분석 기간: ${weekRange.startKorean} - ${weekRange.endKorean}
            </p>
            
            <p style="margin-top: 20px; margin-bottom: 10px;"><strong>데이터 출처</strong></p>
            <p style="font-size: 0.85rem; line-height: 1.8; color: #999 !important; margin-bottom: 20px;">
                ${sourcesList || 'Bloomberg, Reuters, ICE Futures U.S., Trading Economics, Perfect Daily Grind, Comunicaffe, Daily Coffee News'}
            </p>
            
            <p style="font-size: 0.85rem; color: #999 !important; margin-top: 25px;">
                본 리포트는 정보 제공 목적으로 작성되었으며, 투자 권유가 아닙니다.
            </p>
        </div>
    </div>
</body>
</html>`;

    return html;
}

module.exports = {
    buildReportHTML,
    buildReportMeta,
    buildPriceSnapshot,
    buildPriceTable,
    buildHighlightBox,
    buildNewsItems,
    buildRiskMatrix,
    formatKoreanDate,
    formatDateISO,
    escapeHtml
};
