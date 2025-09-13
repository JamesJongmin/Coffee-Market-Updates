const fs = require('fs');
const path = require('path');

// 리포트 메타데이터 추출
function extractReportMetadata(htmlContent, filePath) {
    const metaMatch = htmlContent.match(/<!--REPORT_META\s*([\s\S]*?)\s*REPORT_META-->/);
    
    if (metaMatch) {
        try {
            return JSON.parse(metaMatch[1].trim());
        } catch (error) {
            console.error(`메타데이터 파싱 실패 ${filePath}:`, error);
        }
    }
    
    // 레거시 방식으로 추출
    const titleMatch = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const dateMatch = filePath.match(/(\d{4})-(\d{2})-(\d{2})/);
    
    return {
        title: titleMatch ? titleMatch[1].trim() : '제목 없음',
        subtitle: '',
        date: dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : '',
        summary: '리포트 요약 정보가 없습니다.',
        tags: []
    };
}

// 리포트 분류
function classifyReport(metadata) {
    // 제목이 정확히 "커피 선물 시장 주간 동향"인 경우
    if (metadata.title === '커피 선물 시장 주간 동향') {
        return 'weekly';
    }
    
    // 명시적으로 type이 지정된 경우
    if (metadata.type === 'weekly') {
        return 'weekly';
    }
    
    // 그 외는 모두 in-depth-analysis
    return 'in-depth-analysis';
}

// 날짜 포맷팅
function formatKoreanDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
}

// Reports 폴더 스캔
function scanReports() {
    const reports = [];
    const reportsDir = path.join(__dirname, 'Reports');
    
    // 기존 reports.json 로드
    let existingData = {};
    try {
        const existingContent = fs.readFileSync(path.join(__dirname, 'reports.json'), 'utf8');
        const existingReports = JSON.parse(existingContent).reports;
        existingData = existingReports.reduce((acc, report) => {
            acc[report.link] = report;
            return acc;
        }, {});
    } catch (error) {
        console.log('기존 reports.json 없음, 새로 생성합니다.');
    }
    
    // 재귀적으로 HTML 파일 찾기
    function scanDirectory(dir) {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                scanDirectory(filePath);
            } else if (file.endsWith('.html')) {
                const relativePath = path.relative(__dirname, filePath).replace(/\\/g, '/');
                const htmlContent = fs.readFileSync(filePath, 'utf8');
                const metadata = extractReportMetadata(htmlContent, relativePath);
                
                const dateMatch = relativePath.match(/(\d{4})\/(\d{2})\/\d{4}-\d{2}-\d{2}/);
                const category = classifyReport(metadata);
                
                const reportData = {
                    date: metadata.date,
                    displayDate: formatKoreanDate(metadata.date),
                    title: metadata.title,
                    subtitle: metadata.subtitle || '',
                    summary: metadata.summary || '',
                    tags: metadata.tags || [],
                    link: relativePath,
                    year: dateMatch ? dateMatch[1] : '',
                    month: dateMatch ? dateMatch[2] : '',
                    type: category,
                    // 기존 데이터 보존
                    authors: metadata.authors || existingData[relativePath]?.authors || [],
                    contact: metadata.contact || existingData[relativePath]?.contact || '',
                    language: metadata.language || existingData[relativePath]?.language || 'ko',
                    regions: metadata.regions || existingData[relativePath]?.regions || [],
                    commodities: metadata.commodities || existingData[relativePath]?.commodities || [],
                    markets: metadata.markets || existingData[relativePath]?.markets || []
                };
                
                reports.push(reportData);
            }
        });
    }
    
    if (fs.existsSync(reportsDir)) {
        scanDirectory(reportsDir);
    }
    
    // 날짜순 정렬 (최신순)
    reports.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return reports;
}

// 메인 실행
function main() {
    console.log('Reports 폴더 스캔 시작...');
    const reports = scanReports();
    
    console.log(`총 ${reports.length}개의 리포트 발견`);
    console.log(`- Weekly Reports: ${reports.filter(r => r.type === 'weekly').length}개`);
    console.log(`- In-depth Analysis: ${reports.filter(r => r.type === 'in-depth-analysis').length}개`);
    
    // reports.json 저장
    const jsonData = {
        reports: reports
    };
    
    fs.writeFileSync(
        path.join(__dirname, 'reports.json'),
        JSON.stringify(jsonData, null, 2),
        'utf8'
    );
    
    console.log('reports.json 업데이트 완료!');
}

main();