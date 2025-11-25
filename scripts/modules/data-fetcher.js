/**
 * 시장 데이터 수집 모듈
 * 
 * 수집 대상:
 * - ICE Arabica Futures (KC)
 * - ICE Robusta Futures (RC)
 * - USD/BRL 환율
 * - ICE Certified Stocks
 * - CFTC COT Report
 */

const https = require('https');
const http = require('http');

// Google Sheets 데이터 소스 (기존 시스템과 연동)
const GOOGLE_SHEETS_URLS = {
    coffeefutures: 'https://docs.google.com/spreadsheets/d/1lnRrdQynfk-XrgYsKmf1_XFCBDa9jLr2XVRib-2lpTk/export?format=csv&gid=442491515',
    usdbrl: 'https://docs.google.com/spreadsheets/d/1FvqTjVTw_iCtZ9pQOHc1UBN7ghYvrdp_MOLTxsSLTyM/export?format=csv&gid=88171284',
    cftcpositions: 'https://docs.google.com/spreadsheets/d/1IgfIFB60VC2f3IGnU5m9xmqkmfOCnnAOYItj9SWKMxc/export?format=csv&gid=0',
    icestocks: 'https://docs.google.com/spreadsheets/d/1oxXXeBQDZmiq9te6fNkKTs9D1X8ruwUI0_yy8UOj7gI/export?format=csv&gid=0'
};

// HTTP/HTTPS 요청 헬퍼
function fetchUrl(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const timeout = options.timeout || 30000;
        
        const req = protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CoffeeReportBot/1.0)',
                ...options.headers
            }
        }, (res) => {
            // 리다이렉트 처리
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                fetchUrl(res.headers.location, options)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                return;
            }
            
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        
        req.on('error', reject);
        req.setTimeout(timeout, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// CSV 파싱
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            // 간단한 CSV 파싱 (쌍따옴표 내 쉼표 처리)
            const cells = [];
            let current = '';
            let inQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    cells.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            cells.push(current.trim());
            result.push(cells);
        }
    }
    
    return result;
}

// 날짜 파싱 (Excel 시리얼 또는 문자열)
function parseDate(dateValue) {
    if (typeof dateValue === 'number' || /^\d+$/.test(dateValue)) {
        // Excel 시리얼 날짜
        const serial = typeof dateValue === 'number' ? dateValue : parseInt(dateValue);
        const date = new Date((serial - 25569) * 86400 * 1000);
        return date;
    } else if (typeof dateValue === 'string') {
        return new Date(dateValue);
    }
    return new Date(dateValue);
}

// Google Sheets에서 데이터 읽기
async function readGoogleSheetData(sheetKey) {
    try {
        const url = GOOGLE_SHEETS_URLS[sheetKey];
        if (!url) {
            throw new Error(`Unknown sheet key: ${sheetKey}`);
        }
        
        console.log(`     📊 ${sheetKey} 데이터 로딩...`);
        
        // 직접 접근 시도
        let csvText;
        try {
            csvText = await fetchUrl(url);
        } catch (error) {
            // CORS 프록시 사용 (백업)
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            csvText = await fetchUrl(proxyUrl);
        }
        
        const data = parseCSV(csvText);
        const dataRows = data.slice(1); // 헤더 제외
        
        const processedData = dataRows
            .map(row => ({
                date: row[0],
                value: row[1]
            }))
            .filter(row => row.date && row.value !== undefined && row.value !== null && row.value !== '')
            .map(row => ({
                date: parseDate(row.date),
                value: parseFloat(row.value)
            }))
            .filter(row => !isNaN(row.value));
        
        // 날짜순 정렬
        processedData.sort((a, b) => a.date - b.date);
        
        console.log(`        ✓ ${processedData.length}개 데이터 포인트 로드됨`);
        return processedData;
        
    } catch (error) {
        console.error(`        ⚠️ ${sheetKey} 데이터 로드 실패: ${error.message}`);
        return null;
    }
}

// 주간 데이터 분석
function analyzeWeeklyData(data, weekRange) {
    if (!data || data.length === 0) return null;
    
    const startDate = new Date(weekRange.start);
    const endDate = new Date(weekRange.end);
    
    // 주간 데이터 필터링
    const weekData = data.filter(d => d.date >= startDate && d.date <= endDate);
    
    if (weekData.length === 0) {
        // 가장 최근 데이터 사용
        const latest = data[data.length - 1];
        const previous = data.length > 5 ? data[data.length - 6] : data[0];
        
        return {
            latest: latest.value,
            latestDate: latest.date,
            weekHigh: latest.value,
            weekLow: latest.value,
            weekOpen: previous.value,
            weekClose: latest.value,
            weekChange: latest.value - previous.value,
            weekChangePercent: ((latest.value - previous.value) / previous.value * 100).toFixed(2)
        };
    }
    
    // 주간 분석
    const values = weekData.map(d => d.value);
    const latest = weekData[weekData.length - 1];
    const first = weekData[0];
    
    // 전주 종가 (주간 시작 직전 데이터)
    const prevWeekData = data.filter(d => d.date < startDate);
    const prevClose = prevWeekData.length > 0 ? prevWeekData[prevWeekData.length - 1].value : first.value;
    
    return {
        latest: latest.value,
        latestDate: latest.date,
        weekHigh: Math.max(...values),
        weekLow: Math.min(...values),
        weekOpen: first.value,
        weekClose: latest.value,
        weekChange: latest.value - prevClose,
        weekChangePercent: ((latest.value - prevClose) / prevClose * 100).toFixed(2),
        prevClose: prevClose
    };
}

// 메인 데이터 수집 함수
async function fetchMarketData(weekRange) {
    const result = {
        arabica: null,
        robusta: null,
        usdBrl: null,
        iceStocks: null,
        cftcPositions: null,
        fetchedAt: new Date().toISOString()
    };
    
    // 병렬로 데이터 수집
    const [coffeeData, brlData, cftcData, stocksData] = await Promise.all([
        readGoogleSheetData('coffeefutures'),
        readGoogleSheetData('usdbrl'),
        readGoogleSheetData('cftcpositions'),
        readGoogleSheetData('icestocks')
    ]);
    
    // 아라비카 커피 선물
    if (coffeeData) {
        const analysis = analyzeWeeklyData(coffeeData, weekRange);
        if (analysis) {
            result.arabica = {
                price: analysis.latest,
                change: analysis.weekChange,
                changePercent: analysis.weekChangePercent,
                weekHigh: analysis.weekHigh,
                weekLow: analysis.weekLow,
                prevClose: analysis.prevClose,
                latestDate: analysis.latestDate
            };
        }
    }
    
    // USD/BRL 환율
    if (brlData) {
        const analysis = analyzeWeeklyData(brlData, weekRange);
        if (analysis) {
            result.usdBrl = {
                rate: analysis.latest,
                change: analysis.weekChange,
                changePercent: analysis.weekChangePercent,
                latestDate: analysis.latestDate
            };
        }
    }
    
    // CFTC 포지션
    if (cftcData) {
        const analysis = analyzeWeeklyData(cftcData, weekRange);
        if (analysis) {
            result.cftcPositions = {
                netPosition: analysis.latest,
                change: analysis.weekChange,
                changePercent: analysis.weekChangePercent,
                latestDate: analysis.latestDate
            };
        }
    }
    
    // ICE 재고
    if (stocksData) {
        const analysis = analyzeWeeklyData(stocksData, weekRange);
        if (analysis) {
            result.iceStocks = {
                total: analysis.latest,
                change: analysis.weekChange,
                changePercent: analysis.weekChangePercent,
                latestDate: analysis.latestDate
            };
        }
    }
    
    return result;
}

// 외부 API에서 추가 데이터 수집 (선택적)
async function fetchExternalData(source, options = {}) {
    try {
        switch (source) {
            case 'investing':
                // Investing.com 데이터 (스크래핑 필요 시)
                console.log('     📈 Investing.com 데이터 수집...');
                return null; // 실제 구현 필요
                
            case 'barchart':
                // Barchart 데이터
                console.log('     📊 Barchart 데이터 수집...');
                return null; // 실제 구현 필요
                
            case 'tradingeconomics':
                // Trading Economics 데이터
                console.log('     📉 Trading Economics 데이터 수집...');
                return null; // 실제 구현 필요
                
            default:
                return null;
        }
    } catch (error) {
        console.error(`     ⚠️ ${source} 데이터 수집 실패: ${error.message}`);
        return null;
    }
}

module.exports = {
    fetchMarketData,
    fetchExternalData,
    readGoogleSheetData,
    parseCSV,
    parseDate,
    analyzeWeeklyData
};
