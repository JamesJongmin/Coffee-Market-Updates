#!/usr/bin/env node

/**
 * 커피 선물 시장 주간 동향 자동 리포트 생성 시스템
 * 
 * 매주 토요일 08:00 KST (금요일 23:00 UTC)에 자동 실행
 * 
 * 실행 방법:
 *   node scripts/generate-weekly-report.js
 *   node scripts/generate-weekly-report.js --date 2025-11-30  # 특정 날짜
 *   node scripts/generate-weekly-report.js --dry-run          # 테스트 실행
 */

const fs = require('fs');
const path = require('path');
const { fetchMarketData } = require('./modules/data-fetcher');
const { fetchNewsData } = require('./modules/news-fetcher');
const { generateReportContent } = require('./modules/content-generator');
const { buildReportHTML } = require('./modules/html-builder');
const { validateReport } = require('./modules/validator');

// 설정
const CONFIG = {
    outputDir: path.join(__dirname, '..', 'Reports'),
    templatePath: path.join(__dirname, 'templates', 'weekly-report-template.html'),
    reportsJsonPath: path.join(__dirname, '..', 'reports.json'),
    dryRun: false,
    targetDate: null
};

// 명령줄 인수 파싱
function parseArgs() {
    const args = process.argv.slice(2);
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--dry-run') {
            CONFIG.dryRun = true;
        } else if (args[i] === '--date' && args[i + 1]) {
            CONFIG.targetDate = args[i + 1];
            i++;
        } else if (args[i] === '--help') {
            console.log(`
커피 선물 시장 주간 동향 자동 리포트 생성 시스템

사용법:
  node generate-weekly-report.js [옵션]

옵션:
  --dry-run     실제 파일을 생성하지 않고 테스트만 실행
  --date YYYY-MM-DD  특정 날짜로 리포트 생성
  --help        도움말 표시
            `);
            process.exit(0);
        }
    }
}

// 날짜 유틸리티
function getReportDate() {
    if (CONFIG.targetDate) {
        return new Date(CONFIG.targetDate);
    }
    return new Date();
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatKoreanDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
}

function getWeekRange(date) {
    const endDate = new Date(date);
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - 7);
    
    return {
        start: formatDate(startDate),
        end: formatDate(endDate),
        startKorean: formatKoreanDate(startDate),
        endKorean: formatKoreanDate(endDate)
    };
}

// 디렉토리 생성
function ensureDirectoryExists(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 디렉토리 생성: ${dir}`);
    }
}

// reports.json 업데이트
function updateReportsJson(reportData) {
    let reportsData = { reports: [] };
    
    if (fs.existsSync(CONFIG.reportsJsonPath)) {
        try {
            const content = fs.readFileSync(CONFIG.reportsJsonPath, 'utf8');
            reportsData = JSON.parse(content);
        } catch (error) {
            console.warn('⚠️ 기존 reports.json 파싱 실패, 새로 생성합니다.');
        }
    }
    
    // 중복 체크 및 추가
    const existingIndex = reportsData.reports.findIndex(r => r.date === reportData.date);
    if (existingIndex >= 0) {
        reportsData.reports[existingIndex] = reportData;
        console.log(`🔄 기존 리포트 업데이트: ${reportData.date}`);
    } else {
        reportsData.reports.unshift(reportData);
        console.log(`➕ 새 리포트 추가: ${reportData.date}`);
    }
    
    // 날짜순 정렬 (최신순)
    reportsData.reports.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    fs.writeFileSync(CONFIG.reportsJsonPath, JSON.stringify(reportsData, null, 2), 'utf8');
    console.log('✅ reports.json 업데이트 완료');
}

// 메인 실행 함수
async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   커피 선물 시장 주간 동향 자동 리포트 생성 시스템');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    
    parseArgs();
    
    const reportDate = getReportDate();
    const dateStr = formatDate(reportDate);
    const weekRange = getWeekRange(reportDate);
    
    console.log(`📅 리포트 날짜: ${formatKoreanDate(reportDate)}`);
    console.log(`📊 분석 기간: ${weekRange.startKorean} ~ ${weekRange.endKorean}`);
    console.log(`🔧 모드: ${CONFIG.dryRun ? '테스트 (dry-run)' : '실제 생성'}`);
    console.log('');
    
    try {
        // 1단계: 데이터 수집
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📡 1단계: 시장 데이터 수집');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const marketData = await fetchMarketData(weekRange);
        console.log('   ✓ 가격 데이터 수집 완료');
        console.log(`     - 아라비카 근월물: ${marketData.arabica?.price || '데이터 미확인'}¢`);
        console.log(`     - USD/BRL: ${marketData.usdBrl?.rate || '데이터 미확인'}`);
        console.log(`     - ICE 재고: ${marketData.iceStocks?.total || '데이터 미확인'}백`);
        console.log('');
        
        // 2단계: 뉴스 수집
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📰 2단계: 뉴스 데이터 수집');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const newsData = await fetchNewsData(weekRange);
        console.log(`   ✓ 뉴스 ${newsData.length}건 수집 완료`);
        newsData.slice(0, 5).forEach((news, i) => {
            console.log(`     ${i + 1}. ${news.title.substring(0, 40)}...`);
        });
        console.log('');
        
        // 3단계: 콘텐츠 생성 (AI/LLM 사용)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✍️  3단계: 리포트 콘텐츠 생성');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const reportContent = await generateReportContent({
            date: reportDate,
            dateStr,
            weekRange,
            marketData,
            newsData
        });
        console.log('   ✓ 콘텐츠 생성 완료');
        console.log(`     - 섹션 수: ${Object.keys(reportContent.sections || {}).length}`);
        console.log('');
        
        // 4단계: HTML 생성
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔨 4단계: HTML 파일 생성');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const htmlContent = buildReportHTML({
            date: reportDate,
            dateStr,
            weekRange,
            marketData,
            newsData,
            content: reportContent
        });
        console.log('   ✓ HTML 생성 완료');
        console.log(`     - 파일 크기: ${Math.round(htmlContent.length / 1024)}KB`);
        console.log('');
        
        // 5단계: 검증
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 5단계: 리포트 검증');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const validation = validateReport(htmlContent, reportContent);
        if (validation.valid) {
            console.log('   ✓ 검증 통과');
        } else {
            console.log('   ⚠️ 검증 경고:');
            validation.warnings.forEach(w => console.log(`     - ${w}`));
        }
        console.log('');
        
        // 6단계: 파일 저장
        if (!CONFIG.dryRun) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('💾 6단계: 파일 저장');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            const year = reportDate.getFullYear();
            const month = String(reportDate.getMonth() + 1).padStart(2, '0');
            const fileName = `${dateStr}.html`;
            const filePath = path.join(CONFIG.outputDir, String(year), month, fileName);
            
            ensureDirectoryExists(filePath);
            fs.writeFileSync(filePath, htmlContent, 'utf8');
            
            console.log(`   ✓ 파일 저장 완료: ${filePath}`);
            
            // reports.json 업데이트
            const reportEntry = {
                date: dateStr,
                displayDate: formatKoreanDate(reportDate),
                title: reportContent.title || '커피 선물 시장 주간 동향',
                subtitle: reportContent.subtitle || 'Coffee Futures Market Weekly Update',
                summary: reportContent.summary || '',
                tags: reportContent.tags || [],
                link: `Reports/${year}/${month}/${fileName}`,
                year: String(year),
                month: month,
                type: 'weekly',
                authors: ['Align Commodities'],
                contact: 'james.baek@aligncommodities.com',
                language: 'ko',
                regions: reportContent.regions || ['글로벌', '브라질', '베트남'],
                commodities: ['아라비카커피', '로부스타커피'],
                markets: ['ICE선물시장', '현물시장']
            };
            
            updateReportsJson(reportEntry);
            console.log('');
        } else {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🧪 테스트 모드 - 파일이 저장되지 않았습니다');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('');
        }
        
        // 완료
        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ 리포트 생성 완료!');
        console.log('═══════════════════════════════════════════════════════════');
        
        if (!CONFIG.dryRun) {
            const year = reportDate.getFullYear();
            const month = String(reportDate.getMonth() + 1).padStart(2, '0');
            console.log(`📄 파일: Reports/${year}/${month}/${dateStr}.html`);
        }
        
        return {
            success: true,
            date: dateStr,
            path: CONFIG.dryRun ? null : `Reports/${reportDate.getFullYear()}/${String(reportDate.getMonth() + 1).padStart(2, '0')}/${dateStr}.html`
        };
        
    } catch (error) {
        console.error('');
        console.error('═══════════════════════════════════════════════════════════');
        console.error('❌ 리포트 생성 실패');
        console.error('═══════════════════════════════════════════════════════════');
        console.error(`에러: ${error.message}`);
        console.error('');
        console.error('스택 트레이스:');
        console.error(error.stack);
        
        throw error;
    }
}

// 실행
main()
    .then(result => {
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });

module.exports = { main, CONFIG };
