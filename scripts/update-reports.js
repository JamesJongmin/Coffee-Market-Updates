const fs = require('fs');
const path = require('path');

function extractReportMetadata(htmlContent) {
  // REPORT_META 블록에서 메타데이터 추출
  const metaMatch = htmlContent.match(/<!--\s*REPORT_META\s*([\s\S]*?)\s*REPORT_META\s*-->/);
  if (metaMatch && metaMatch[1]) {
    try {
      const jsonString = metaMatch[1].trim();
      console.log('Extracted JSON string:', jsonString.substring(0, 100) + '...');
      const metadata = JSON.parse(jsonString);
      console.log('Successfully parsed metadata for:', metadata.title || 'Unknown');
      return metadata;
    } catch (error) {
      console.error('Failed to parse REPORT_META JSON:', error.message);
      console.error('Raw JSON string:', metaMatch[1]);
    }
  } else {
    console.log('No REPORT_META block found in HTML content');
  }
  return null;
}

function cleanSummary(summary) {
  // HTML 태그, CSS 코드, 특수 문자 제거
  if (!summary) return '';
  
  const original = summary;
  const cleaned = summary
    .replace(/<[^>]*>/g, '') // HTML 태그 제거
    .replace(/style\s*=\s*["'][^"']*["']/gi, '') // style 속성 제거
    .replace(/[{}]/g, '') // CSS 중괄호 제거
    .replace(/[\r\n]+/g, ' ') // 줄바꿈을 공백으로
    .replace(/\s+/g, ' ') // 연속된 공백을 하나로
    .replace(/^["']+|["']+$/g, '') // 시작과 끝의 따옴표만 제거
    .trim();
  
  console.log(`Summary cleaning: ${original.length} -> ${cleaned.length} chars`);
  return cleaned;
}

function extractHeadline(htmlContent) {
  // 다양한 헤드라인 패턴을 찾아봄
  const patterns = [
    /<h2[^>]*>주요 헤드라인:\s*([^<]+)</i,
    /<h2[^>]*>헤드라인:\s*([^<]+)</i,
    /<h2[^>]*>[^:]*:\s*([^<]+)</i,
    /<div class="main-story"[^>]*>[\s\S]*?<h2[^>]*>[^:]*:\s*([^<]+)</i,
    /<p[^>]*class="[^"]*subtitle[^"]*"[^>]*>([^<]+)</i,
    /<div[^>]*class="[^"]*subtitle[^"]*"[^>]*>([^<]+)</i
  ];
  
  for (const pattern of patterns) {
    const match = htmlContent.match(pattern);
    if (match && match[1]) {
      return cleanSummary(match[1]);
    }
  }
  
  return null;
}

function findHtmlFiles(dir) {
  const reports = [];
  
  function scanDir(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (item.endsWith('.html') && !item.includes('test')) {
        const fileName = item.replace('.html', '');
        const dateMatch = fileName.match(/(\d{4})-(\d{2})-(\d{2})/);
        
        if (dateMatch) {
          const [, year, month, day] = dateMatch;
          const relativePath = path.relative('.', fullPath).replace(/\\/g, '/');
          
          try {
            const htmlContent = fs.readFileSync(fullPath, 'utf8');
            console.log(`Processing file: ${item}`);
            
            // 먼저 REPORT_META 블록에서 메타데이터 추출 시도
            const metadata = extractReportMetadata(htmlContent);
            
            let title = '커피 선물 시장 주간 동향';
            let subtitle = 'Coffee Futures Market Weekly Update';
            let summary = year + '년 ' + parseInt(month) + '월 ' + parseInt(day) + '일 커피 시장 분석 보고서입니다.';
            let tags = ['아라비카', '로부스타', '시장분석', '주간동향'];
            let type = 'weekly';
            
            if (metadata) {
              // REPORT_META에서 추출한 데이터 사용
              console.log('Using REPORT_META for ' + item);
              title = metadata.title || title;
              subtitle = metadata.subtitle || subtitle;
              summary = metadata.summary ? cleanSummary(metadata.summary) : summary;
              tags = metadata.tags || tags;
              type = metadata.type || type;
              console.log('Summary length: ' + summary.length);
            } else {
              // REPORT_META가 없으면 헤드라인 추출 시도
              console.log('No REPORT_META found for ' + item + ', trying headline extraction');
              const extractedHeadline = extractHeadline(htmlContent);
              if (extractedHeadline) {
                summary = extractedHeadline;
                console.log('Extracted headline: ' + summary.substring(0, 50) + '...');
              } else {
                console.log('No headline found for ' + item + ', using default summary');
              }
            }
            
            reports.push({
              date: year + '-' + month + '-' + day,
              displayDate: year + '년 ' + parseInt(month) + '월 ' + parseInt(day) + '일',
              title: title,
              subtitle: subtitle,
              summary: summary,
              tags: tags,
              type: type,
              link: relativePath,
              year: year,
              month: month
            });
          } catch (error) {
            console.log('Failed to process ' + item + ': ' + error.message);
            // 에러가 발생해도 기본값으로 리포트 추가
            reports.push({
              date: year + '-' + month + '-' + day,
              displayDate: year + '년 ' + parseInt(month) + '월 ' + parseInt(day) + '일',
              title: '커피 선물 시장 주간 동향',
              subtitle: 'Coffee Futures Market Weekly Update',
              summary: year + '년 ' + parseInt(month) + '월 ' + parseInt(day) + '일 커피 시장 분석 보고서입니다.',
              tags: ['아라비카', '로부스타', '시장분석', '주간동향'],
              type: 'weekly',
              link: relativePath,
              year: year,
              month: month
            });
          }
        }
      }
    }
  }
  
  scanDir(dir);
  return reports;
}

// 메인 실행
const reports = findHtmlFiles('Reports');
reports.sort((a, b) => new Date(b.date) - new Date(a.date));

const output = { reports: reports };
fs.writeFileSync('reports.json', JSON.stringify(output, null, 2));

console.log('Generated reports.json with ' + reports.length + ' reports');
reports.forEach(r => console.log('- ' + r.date + ': ' + r.title + ' - ' + r.summary.substring(0, 50) + '...'));
