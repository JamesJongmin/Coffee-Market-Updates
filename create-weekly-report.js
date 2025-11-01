const fs = require('fs');
const path = require('path');
const { fetchAllCoffeeNews, formatNewsAsHTML } = require('./fetch-coffee-news');

/**
 * 주간 리포트 자동 생성 스크립트
 * 매주 토요일에 실행되어 다음 주 토요일 리포트 템플릿을 생성합니다.
 * RSS 피드에서 최근 뉴스를 자동 수집하여 포함합니다.
 */

// 다음 토요일 날짜 계산
function getNextSaturday(date = new Date()) {
    const day = date.getDay(); // 0=일요일, 6=토요일
    const daysUntilSaturday = day === 6 ? 7 : (6 - day);
    const nextSaturday = new Date(date);
    nextSaturday.setDate(date.getDate() + daysUntilSaturday);
    return nextSaturday;
}

// 날짜 포맷팅
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 한국어 날짜 포맷팅
function formatKoreanDate(date) {
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
}

// 리포트 HTML 템플릿 생성 (기존 리포트 형식 그대로 반영)
async function generateReportTemplate(targetDate, newsItems = []) {
    const dateStr = formatDate(targetDate);
    const koreanDate = formatKoreanDate(targetDate);
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const weekday = targetDate.toLocaleDateString('ko-KR', { weekday: 'long' });
    
    // REPORT_META 기본값
    const defaultTags = ['아라비카', '로부스타', '시장분석', '주간동향'];
    const defaultSummary = `${year}년 ${parseInt(month)}월 ${parseInt(day)}일 커피 선물 시장 주간 동향 분석 보고서입니다. 시장 동향과 가격 변동을 종합적으로 분석합니다.`;
    
    // 계약월 계산 (다음 달 기준)
    const nextMonth = targetDate.getMonth() + 1;
    const contractMonth = nextMonth > 12 ? 1 : nextMonth;
    const contractMonthStr = ['K', 'H', 'K', 'N', 'U', 'Z', 'H', 'K', 'N', 'U', 'Z', 'H'][contractMonth - 1];
    const contractYear = contractMonth === 1 ? year + 1 : year;
    const contractYearStr = String(contractYear).slice(-1);

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>커피 선물 시장 주간 동향 - ${year}년 ${parseInt(month)}월 ${parseInt(day)}일</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">

<!--REPORT_META
{
    "title": "커피 선물 시장 주간 동향",
    "subtitle": "Coffee Futures Market Weekly Update",
    "date": "${dateStr}",
    "summary": "${defaultSummary}",
    "tags": ${JSON.stringify(defaultTags)},
    "type": "weekly",
    "authors": ["Align Commodities"],
    "contact": "james.baek@aligncommodities.com",
    "language": "ko",
    "regions": ["글로벌", "미국", "브라질", "베트남"],
    "commodities": ["아라비카커피", "로부스타커피"],
    "markets": ["ICE선물시장", "현물시장"]
}
REPORT_META-->

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.7;
            color: #2c3e50;
            background: #f8f9fa;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 30px;
            background: white;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        
        /* Header Section */
        header {
            text-align: center;
            padding: 50px 30px;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            border-radius: 8px;
            margin-bottom: 40px;
            position: relative;
        }
        
        h1 {
            font-size: 2.8em;
            margin-bottom: 12px;
            font-weight: 700;
            letter-spacing: -1.5px;
            font-family: 'Inter', 'Noto Sans KR', sans-serif;
        }
        
        .subtitle {
            font-size: 1.1em;
            opacity: 0.9;
            font-weight: 400;
            letter-spacing: 1px;
            font-family: 'Inter', sans-serif;
        }
        
        .date-stamp {
            margin-top: 20px;
            font-size: 1em;
            font-weight: 500;
            padding: 10px 24px;
            background: rgba(255,255,255,0.15);
            border-radius: 24px;
            display: inline-block;
            backdrop-filter: blur(10px);
        }
        
        /* Grid Layout */
        .news-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
        }
        
        /* Main Story */
        .main-story {
            background: #ffffff;
            padding: 35px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        
        .main-story h2 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 1.6em;
            font-weight: 600;
        }
        
        /* Sidebar */
        .sidebar {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .price-box {
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
        }
        
        .price-label {
            font-size: 0.95em;
            opacity: 0.95;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        
        .price-value {
            font-size: 3.2em;
            font-weight: 700;
            margin: 15px 0;
            letter-spacing: -1px;
        }
        
        .price-change {
            font-size: 1.4em;
            font-weight: 600;
        }
        
        .price-change.negative {
            color: #ff6b6b;
        }
        
        .price-change.positive {
            color: #51cf66;
        }
        
        /* Quick Stats */
        .quick-stats {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        
        .quick-stats h3 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 1.1em;
            font-weight: 600;
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #dee2e6;
            font-size: 0.95em;
        }
        
        .stat-item:last-child {
            border-bottom: none;
        }
        
        .stat-label {
            color: #6c757d;
            font-weight: 500;
        }
        
        .stat-value {
            color: #2c3e50;
            font-weight: 600;
        }
        
        /* Content Sections */
        .content-section {
            margin: 30px 0;
            padding: 30px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }
        
        .content-section h3 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 1.3em;
            font-weight: 600;
        }
        
        .highlight {
            background: #fff8e1;
            padding: 25px;
            border-radius: 8px;
            border-left: 4px solid #ffc107;
            margin: 25px 0;
        }
        
        .highlight h3 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        /* News Sections */
        .news-sections {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 40px;
        }
        
        .news-section {
            background: #ffffff;
            padding: 30px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        
        .section-title {
            color: #2c3e50;
            font-size: 1.4em;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid #3498db;
            font-weight: 600;
        }
        
        .news-item {
            margin-bottom: 20px;
            padding: 18px;
            background: #f8f9fa;
            border-radius: 6px;
            border-left: 3px solid #3498db;
        }
        
        .news-date {
            font-size: 0.85em;
            color: #6c757d;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .news-content {
            color: #2c3e50;
            line-height: 1.7;
        }
        
        .news-content strong {
            color: #2c3e50;
            font-weight: 600;
        }
        
        .news-content a {
            color: #3498db;
            text-decoration: none;
            margin-left: 8px;
        }
        
        .news-content a:hover {
            text-decoration: underline;
        }
        
        /* Back link */
        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: #3498db;
            text-decoration: none;
            font-weight: 500;
        }
        
        .back-link:hover {
            text-decoration: underline;
        }
        
        /* Placeholder */
        .placeholder {
            background: #f0f0f0;
            padding: 20px;
            border-radius: 6px;
            border: 2px dashed #ccc;
            text-align: center;
            color: #999;
            margin: 20px 0;
        }
        
        @media (max-width: 768px) {
            .news-grid {
                grid-template-columns: 1fr;
            }
            
            .news-sections {
                grid-template-columns: 1fr;
            }
            
            h1 {
                font-size: 2em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>커피 선물 시장 주간 동향</h1>
            <p class="subtitle">Coffee Futures Market Weekly Update</p>
            <div class="date-stamp">${koreanDate}</div>
        </header>

        <div class="news-grid">
            <div class="main-story">
                <h2>주요 헤드라인: 여기에 주요 헤드라인을 작성하세요</h2>
                <p style="margin-bottom: 15px;">
                    <strong>여기에 이번 주 주요 헤드라인에 대한 설명을 작성하세요.</strong> 
                    주요 가격 변동, 시장 동향, 중요한 이벤트를 간략히 설명합니다.
                </p>
                
                <div class="content-section">
                    <h3>핵심 요약</h3>
                    <p style="line-height: 1.8;">
                        여기에 이번 주 커피 시장의 핵심 요약을 작성하세요. 주요 가격 변동, 시장 동향, 중요한 이벤트를 간략히 정리합니다.
                    </p>
                </div>
            </div>
            
            <div class="sidebar">
                <div class="price-box">
                    <div class="price-label">${contractMonthStr}월 아라비카 선물 (KC${contractMonthStr}${contractYearStr}25)</div>
                    <div class="price-value">--.--¢</div>
                    <div class="price-change">전주 대비</div>
                    <div style="font-size: 0.85em; margin-top: 10px; opacity: 0.9;">업데이트 필요</div>
                </div>
                
                <div class="quick-stats">
                    <h3>주요 지표</h3>
                    <div class="stat-item">
                        <span class="stat-label">ICE 재고</span>
                        <span class="stat-value">업데이트 필요</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">전주 대비</span>
                        <span class="stat-value">--</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">브라질 관세</span>
                        <span class="stat-value">50%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">시장 상태</span>
                        <span class="stat-value">업데이트 필요</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="news-sections">
            <div class="news-section">
                <h3 class="section-title">주간 주요 뉴스</h3>
                
${newsItems.length > 0 ? newsItems : `                <!-- 뉴스 항목 추가 예시:
                <div class="news-item">
                    <div class="news-date">2025.XX.XX</div>
                    <div class="news-content">
                        <strong>뉴스 제목:</strong> 뉴스 내용을 여기에 작성하세요.
                        <a href="출처URL" target="_blank">출처</a>
                    </div>
                </div>
                -->
                
                <p style="color: #6c757d; font-style: italic; padding: 20px;">
                    주간 주요 뉴스 항목을 여기에 추가하세요. 각 뉴스 항목은 위 주석의 형식을 따라 추가합니다.
                </p>`}
            </div>
            
            <div class="news-section">
                <h3 class="section-title">배경 정보</h3>
                
                <!-- 배경 정보 뉴스 항목 추가 예시:
                <div class="news-item">
                    <div class="news-date">2025.XX.XX</div>
                    <div class="news-content">
                        <strong>이벤트 제목:</strong> 배경 정보 내용을 여기에 작성하세요.
                        <a href="출처URL" target="_blank">출처</a>
                    </div>
                </div>
                -->
                
                <p style="color: #6c757d; font-style: italic; padding: 20px;">
                    시장 배경 정보 및 관련 이벤트를 여기에 추가하세요.
                </p>
            </div>
        </div>

        <div class="content-section">
            <h3>시장 전망 및 투자 시사점</h3>
            <p style="line-height: 1.8; margin-bottom: 15px;">
                <strong>단기 전망 (향후 1-2주):</strong> 여기에 단기 시장 전망을 작성하세요.
            </p>
            <p style="line-height: 1.8; margin-bottom: 15px;">
                <strong>중기 전망 (향후 3-6개월):</strong> 여기에 중기 시장 전망을 작성하세요.
            </p>
            <p style="line-height: 1.8;">
                <strong>구조적 리스크:</strong> 여기에 구조적 리스크 요인을 작성하세요.
            </p>
        </div>

        <div class="tags">
            <span class="tag">주간동향</span>
            <span class="tag">커피선물</span>
            <span class="tag">시장분석</span>
            <!-- 추가 태그를 여기에 추가하세요 -->
        </div>

        <footer>
            <p><strong>Published by Align Commodities (james.baek@aligncommodities.com)</strong> | 
            데이터 출처: ICE, Barchart, Trading Economics, Nasdaq, Bloomberg, USDA, Volcafe, ICO | 
            본 리포트는 정보 제공 목적으로 작성되었으며, 투자 권유가 아닙니다.</p>
        </footer>
    </div>
</body>
</html>`;

    return html;
}

// 메인 함수
async function main() {
    // 다음 토요일 계산
    const today = new Date();
    const nextSaturday = getNextSaturday(today);
    const dateStr = formatDate(nextSaturday);
    const year = nextSaturday.getFullYear();
    const month = String(nextSaturday.getMonth() + 1).padStart(2, '0');
    
    // 파일 경로 생성
    const reportDir = path.join(__dirname, 'Reports', String(year), month);
    const reportPath = path.join(reportDir, `${dateStr}.html`);
    
    console.log(`\n📅 다음 토요일: ${formatKoreanDate(nextSaturday)}`);
    console.log(`📁 리포트 경로: ${reportPath}`);
    
    // 디렉토리 생성
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
        console.log(`✅ 디렉토리 생성: ${reportDir}`);
    }
    
    // 파일이 이미 존재하는지 확인
    if (fs.existsSync(reportPath)) {
        console.log(`⚠️  리포트 파일이 이미 존재합니다: ${dateStr}.html`);
        console.log(`   기존 파일을 덮어쓰지 않습니다.`);
        return;
    }
    
    // RSS 뉴스 수집
    console.log(`\n📰 최근 커피 뉴스 수집 중...`);
    let newsHTML = '';
    try {
        const news = await fetchAllCoffeeNews();
        if (news.length > 0) {
            newsHTML = formatNewsAsHTML(news, 6);
            console.log(`✅ ${news.length}개 뉴스 수집 완료 (상위 6개 사용)`);
        } else {
            console.log(`⚠️  수집된 뉴스가 없습니다. 빈 템플릿을 생성합니다.`);
        }
    } catch (error) {
        console.error(`❌ 뉴스 수집 실패:`, error.message);
        console.log(`   빈 템플릿을 생성합니다.`);
    }
    
    // 리포트 템플릿 생성
    const html = await generateReportTemplate(nextSaturday, newsHTML);
    
    // 파일 저장
    fs.writeFileSync(reportPath, html, 'utf8');
    
    console.log(`\n✅ 주간 리포트 템플릿 생성 완료!`);
    console.log(`   파일: ${dateStr}.html`);
    console.log(`\n📝 다음 단계:`);
    console.log(`   1. 리포트 파일을 열어 내용을 확인하세요`);
    console.log(`   2. REPORT_META 블록의 summary와 tags를 업데이트하세요`);
    console.log(`   3. 가격 데이터를 업데이트하세요`);
    console.log(`   4. 필요시 추가 뉴스나 분석을 작성하세요`);
    console.log(`   5. 변경사항을 커밋하고 푸시하세요`);
}

// 스크립트 실행
if (require.main === module) {
    main().catch(error => {
        console.error('오류 발생:', error);
        process.exit(1);
    });
}

module.exports = { getNextSaturday, formatDate, generateReportTemplate };
