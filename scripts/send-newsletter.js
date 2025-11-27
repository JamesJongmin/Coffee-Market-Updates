/**
 * Buttondown Newsletter 발송 스크립트
 * 리포트의 Summary만 추출하여 깔끔한 이메일로 발송합니다.
 * 
 * 업데이트: 전체 HTML 대신 Summary + 링크 방식으로 변경
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 설정
const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY;
const SITE_URL = 'https://www.coffeemarket.info';

// 디버그 정보 출력
console.log('🔧 환경 정보:');
console.log(`   Node.js 버전: ${process.version}`);
console.log(`   작업 디렉토리: ${process.cwd()}`);
console.log(`   API 키 설정됨: ${BUTTONDOWN_API_KEY ? '✅ 예' : '❌ 아니오'}`);

/**
 * HTML에서 메타데이터 추출
 */
function extractMetadata(htmlContent, filePath) {
    // 새로운 메타데이터 형식 시도
    const metaMatch = htmlContent.match(/<!--REPORT_META\s*([\s\S]*?)\s*REPORT_META-->/);
    
    if (metaMatch) {
        try {
            const meta = JSON.parse(metaMatch[1].trim());
            console.log('✅ REPORT_META에서 메타데이터 추출 성공');
            return meta;
        } catch (e) {
            console.log('⚠️ 메타데이터 파싱 실패, 레거시 추출 시도');
        }
    }
    
    // 레거시 방식: HTML에서 직접 추출
    const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i) ||
                       htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    
    const dateMatch = filePath.match(/(\d{4})-(\d{2})-(\d{2})/);
    
    // Hero 섹션에서 subtitle 추출 시도
    const subtitleMatch = htmlContent.match(/<p[^>]*class="[^"]*hero-subtitle[^"]*"[^>]*>([^<]+)<\/p>/i);
    
    return {
        title: titleMatch ? titleMatch[1].trim().replace(' | Coffee Market Info', '') : '커피 선물 시장 주간 동향',
        subtitle: subtitleMatch ? subtitleMatch[1].trim() : '',
        date: dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : new Date().toISOString().split('T')[0],
        summary: '',
        tags: []
    };
}

/**
 * HTML에서 주요 통계 (Key Stats) 추출
 */
function extractKeyStats(htmlContent, metadata = {}) {
    const stats = [];
    
    // stat-box 패턴 추출
    const statBoxPattern = /<div[^>]*class="[^"]*stat-box[^"]*"[^>]*>[\s\S]*?<span[^>]*class="[^"]*stat-number[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<span[^>]*class="[^"]*stat-label[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<\/div>/gi;
    
    let match;
    while ((match = statBoxPattern.exec(htmlContent)) !== null) {
        stats.push({
            value: match[1].trim(),
            label: match[2].trim()
        });
    }
    
    // stat-box가 없고 메타데이터에 가격 정보가 있는 경우 (주간 리포트)
    if (stats.length === 0 && metadata.price_current) {
        // 현재 가격
        stats.push({
            value: `${metadata.price_current}¢`,
            label: '현재가 (3월물)'
        });
        
        // 가격 변동
        if (metadata.price_change) {
            const changeMatch = metadata.price_change.match(/([-+]?\d+\.?\d*)/);
            if (changeMatch) {
                stats.push({
                    value: metadata.price_change,
                    label: '주간 변동'
                });
            }
        }
        
        // 공정가치
        if (metadata.fair_value) {
            stats.push({
                value: `${metadata.fair_value}¢`,
                label: '공정가치 추정'
            });
        }
        
        // 분석 기간
        if (metadata.analysis_period) {
            const period = metadata.analysis_period.split(' to ');
            if (period.length === 2) {
                const endDate = period[1].split('-');
                stats.push({
                    value: `${endDate[1]}/${endDate[2]}`,
                    label: '분석 기준일'
                });
            }
        }
    }
    
    return stats;
}

/**
 * HTML에서 Executive Summary 섹션 추출
 */
function extractExecutiveSummary(htmlContent) {
    // Executive Summary 섹션 찾기
    const summaryMatch = htmlContent.match(/<section[^>]*>[\s\S]*?<h2[^>]*>(?:Executive Summary|요약)[^<]*<\/h2>([\s\S]*?)(?=<section|<\/section>)/i);
    
    if (summaryMatch) {
        // 첫 번째 단락만 추출
        const paragraphMatch = summaryMatch[1].match(/<p[^>]*>([\s\S]*?)<\/p>/i);
        if (paragraphMatch) {
            // HTML 태그 제거하고 텍스트만 추출
            return paragraphMatch[1]
                .replace(/<[^>]+>/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        }
    }
    
    return '';
}

/**
 * HTML에서 Core Insight 추출
 */
function extractCoreInsight(htmlContent) {
    // insight-box 패턴 추출
    const insightMatch = htmlContent.match(/<div[^>]*class="[^"]*insight-box[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    
    if (insightMatch) {
        // HTML 태그 제거
        return insightMatch[1]
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    return '';
}

/**
 * 깔끔한 Summary 이메일 HTML 생성
 */
function createSummaryEmail(metadata, stats, executiveSummary, coreInsight, reportUrl) {
    const { title, subtitle, date, summary, tags } = metadata;
    
    // 날짜 포맷팅
    const dateObj = new Date(date);
    const formattedDate = `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;
    
    // 사용할 요약 텍스트 결정
    const displaySummary = summary || executiveSummary || '';
    
    // 태그 HTML 생성
    const tagsHtml = tags && tags.length > 0 
        ? tags.map(tag => `<span style="display: inline-block; background-color: #f5f0e8; color: #8B4513; padding: 4px 12px; border-radius: 16px; font-size: 12px; margin-right: 8px; margin-bottom: 8px;">#${tag}</span>`).join('')
        : '';
    
    // Key Stats HTML 생성 (2x2 그리드로 모바일 친화적)
    const statsHtml = stats.length > 0 ? `
        <table cellpadding="0" cellspacing="8" border="0" width="100%" style="margin: 20px 0;">
            <tr>
                ${stats.slice(0, 2).map(stat => `
                <td width="50%" style="text-align: center; padding: 18px 12px; background-color: #fefefe; border: 1px solid #e8e2d9; border-radius: 8px;">
                    <div style="font-size: 22px; font-weight: 700; color: #b87333; font-family: Georgia, serif; margin-bottom: 6px;">${stat.value}</div>
                    <div style="font-size: 10px; color: #666666; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.3;">${stat.label}</div>
                </td>
                `).join('')}
            </tr>
            ${stats.length > 2 ? `
            <tr>
                ${stats.slice(2, 4).map(stat => `
                <td width="50%" style="text-align: center; padding: 18px 12px; background-color: #fefefe; border: 1px solid #e8e2d9; border-radius: 8px;">
                    <div style="font-size: 22px; font-weight: 700; color: #b87333; font-family: Georgia, serif; margin-bottom: 6px;">${stat.value}</div>
                    <div style="font-size: 10px; color: #666666; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.3;">${stat.label}</div>
                </td>
                `).join('')}
            </tr>
            ` : ''}
        </table>
    ` : '';
    
    // Core Insight HTML 생성
    const insightHtml = coreInsight ? `
        <div style="background-color: rgba(184, 115, 51, 0.08); border-left: 4px solid #b87333; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #3d2314;">${coreInsight}</p>
        </div>
    ` : '';
    
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #faf8f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    
    <!-- Email Container -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #faf8f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                
                <!-- Main Content -->
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 2px solid #b87333;">
                            <a href="${SITE_URL}" style="font-family: Georgia, 'Times New Roman', serif; font-size: 18px; color: #b87333; text-decoration: none; font-weight: 600; letter-spacing: 1px;">☕ Coffee Market Info</a>
                        </td>
                    </tr>
                    
                    <!-- Title Section -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px;">
                            <p style="margin: 0 0 15px 0; font-size: 12px; color: #888888; text-transform: uppercase; letter-spacing: 2px;">NEW REPORT</p>
                            <h1 style="margin: 0 0 12px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 32px; font-weight: 700; color: #1a0f0a; line-height: 1.2;">${title}</h1>
                            ${subtitle ? `<p style="margin: 0 0 15px 0; font-size: 18px; color: #b87333; font-weight: 500;">${subtitle}</p>` : ''}
                            <p style="margin: 0; font-size: 14px; color: #888888;">📅 ${formattedDate}</p>
                        </td>
                    </tr>
                    
                    ${tagsHtml ? `
                    <!-- Tags -->
                    <tr>
                        <td style="padding: 0 40px 20px 40px;">
                            ${tagsHtml}
                        </td>
                    </tr>
                    ` : ''}
                    
                    <!-- Summary -->
                    ${displaySummary ? `
                    <tr>
                        <td style="padding: 20px 40px;">
                            <p style="margin: 0; font-size: 16px; line-height: 1.8; color: #3d2314;">${displaySummary}</p>
                        </td>
                    </tr>
                    ` : ''}
                    
                    <!-- Key Stats -->
                    ${stats.length > 0 ? `
                    <tr>
                        <td style="padding: 10px 30px;">
                            ${statsHtml}
                        </td>
                    </tr>
                    ` : ''}
                    
                    <!-- Core Insight -->
                    ${coreInsight ? `
                    <tr>
                        <td style="padding: 10px 40px;">
                            ${insightHtml}
                        </td>
                    </tr>
                    ` : ''}
                    
                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center;">
                            <a href="${reportUrl}" style="display: inline-block; background-color: #b87333; color: #ffffff; padding: 16px 40px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(184, 115, 51, 0.3);">📖 전체 리포트 읽기</a>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 0 40px 30px 40px; text-align: center;">
                            <p style="margin: 0; font-size: 13px; color: #888888;">웹브라우저에서 최적의 경험을 제공합니다</p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f5f0e8; border-radius: 0 0 12px 12px; text-align: center;">
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #b87333; font-weight: 600;">Align Commodities</p>
                            <p style="margin: 0 0 15px 0; font-size: 12px; color: #888888;">
                                글로벌 커피 선물 시장 인사이트
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #aaaaaa;">
                                <a href="${SITE_URL}" style="color: #b87333; text-decoration: none;">웹사이트</a> · 
                                <a href="mailto:james.baek@aligncommodities.com" style="color: #b87333; text-decoration: none;">문의하기</a> · 
                                <a href="https://buttondown.com/coffeemarketinfo/unsubscribe/{{ subscriber.id }}" style="color: #888888; text-decoration: underline;">구독 해지</a>
                            </p>
                        </td>
                    </tr>
                    
                </table>
                
            </td>
        </tr>
    </table>
    
</body>
</html>`;
}

/**
 * Buttondown API로 이메일 발송
 */
async function sendEmail(subject, htmlBody) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            subject: subject,
            body: htmlBody,
            status: 'about_to_send'
        });
        
        const options = {
            hostname: 'api.buttondown.email',
            port: 443,
            path: '/v1/emails',
            method: 'POST',
            headers: {
                'Authorization': `Token ${BUTTONDOWN_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };
        
        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('✅ 이메일 발송 성공!');
                    console.log('응답:', responseData);
                    resolve(JSON.parse(responseData));
                } else {
                    console.error('❌ 이메일 발송 실패');
                    console.error('상태 코드:', res.statusCode);
                    console.error('응답:', responseData);
                    
                    if (res.statusCode === 401) {
                        console.error('\n💡 401 Unauthorized: API 키가 유효하지 않습니다.');
                    } else if (res.statusCode === 403) {
                        console.error('\n💡 403 Forbidden: API 접근 권한이 없습니다.');
                    } else if (res.statusCode === 400) {
                        console.error('\n💡 400 Bad Request: 요청 형식이 잘못되었습니다.');
                    } else if (res.statusCode === 429) {
                        console.error('\n💡 429 Too Many Requests: API 호출 제한 초과');
                    }
                    
                    reject(new Error(`API 오류: ${res.statusCode} - ${responseData}`));
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ 요청 오류:', error);
            reject(error);
        });
        
        req.write(data);
        req.end();
    });
}

/**
 * 최신 리포트 파일 찾기
 */
function findLatestReport() {
    const reportsDir = path.join(__dirname, '..', 'Reports');
    let latestFile = null;
    
    const years = fs.readdirSync(reportsDir).filter(f => /^\d{4}$/.test(f)).sort().reverse();
    
    for (const year of years) {
        const yearPath = path.join(reportsDir, year);
        const months = fs.readdirSync(yearPath).filter(f => /^\d{2}$/.test(f)).sort().reverse();
        
        for (const month of months) {
            const monthPath = path.join(yearPath, month);
            const files = fs.readdirSync(monthPath)
                .filter(f => f.endsWith('.html') && !f.includes('test'))
                .sort()
                .reverse();
            
            if (files.length > 0) {
                latestFile = path.join(monthPath, files[0]);
                break;
            }
        }
        if (latestFile) break;
    }
    
    return latestFile;
}

/**
 * 특정 파일 또는 최신 리포트 발송
 */
async function main() {
    console.log('\n📧 Buttondown Newsletter 발송 스크립트 시작\n');
    console.log('📝 모드: Summary 이메일 (전체 HTML 대신 요약본 발송)\n');
    
    // dry-run 모드 체크 (--dry-run 또는 API 키 없을 때)
    const isDryRun = process.argv.includes('--dry-run');
    
    if (!BUTTONDOWN_API_KEY && !isDryRun) {
        console.log('⚠️ BUTTONDOWN_API_KEY 없음 - Dry Run 모드로 전환합니다.\n');
    }
    
    const shouldSend = BUTTONDOWN_API_KEY && BUTTONDOWN_API_KEY.length >= 10 && !isDryRun;
    
    // 명령줄 인자로 파일 경로 받기, 없으면 최신 파일
    // --dry-run 플래그는 제외
    let reportPath = process.argv.slice(2).find(arg => !arg.startsWith('--'));
    
    if (!reportPath) {
        reportPath = findLatestReport();
        if (!reportPath) {
            console.error('❌ 발송할 리포트를 찾을 수 없습니다.');
            process.exit(1);
        }
        console.log(`📄 최신 리포트 발견: ${reportPath}`);
    }
    
    // 파일 읽기
    if (!fs.existsSync(reportPath)) {
        console.error(`❌ 파일을 찾을 수 없습니다: ${reportPath}`);
        process.exit(1);
    }
    
    const htmlContent = fs.readFileSync(reportPath, 'utf-8');
    
    // 메타데이터 추출
    const metadata = extractMetadata(htmlContent, reportPath);
    console.log(`📊 리포트 정보:`);
    console.log(`   제목: ${metadata.title}`);
    console.log(`   부제: ${metadata.subtitle || '(없음)'}`);
    console.log(`   날짜: ${metadata.date}`);
    console.log(`   요약: ${metadata.summary ? metadata.summary.substring(0, 50) + '...' : '(메타데이터에 없음)'}`);
    console.log(`   태그: ${metadata.tags?.join(', ') || '(없음)'}`);
    
    // Key Stats 추출
    const stats = extractKeyStats(htmlContent, metadata);
    console.log(`   핵심 통계: ${stats.length}개 발견`);
    stats.forEach(s => console.log(`      - ${s.label}: ${s.value}`));
    
    // Executive Summary 추출
    const executiveSummary = extractExecutiveSummary(htmlContent);
    if (executiveSummary) {
        console.log(`   Executive Summary: ${executiveSummary.substring(0, 50)}...`);
    }
    
    // Core Insight 추출
    const coreInsight = extractCoreInsight(htmlContent);
    if (coreInsight) {
        console.log(`   Core Insight: ${coreInsight.substring(0, 50)}...`);
    }
    
    // 리포트 URL 생성
    let relativePath = path.relative(path.join(__dirname, '..'), reportPath);
    relativePath = relativePath.replace(/\\/g, '/');
    const reportUrl = `${SITE_URL}/${relativePath}`;
    console.log(`   URL: ${reportUrl}`);
    
    // Summary 이메일 생성
    console.log('\n📧 Summary 이메일 생성 중...');
    const emailHtml = createSummaryEmail(metadata, stats, executiveSummary, coreInsight, reportUrl);
    
    // 이메일 제목 생성
    const emailSubject = `📊 ${metadata.title}${metadata.subtitle ? ' - ' + metadata.subtitle : ''}`;
    
    // 발송 또는 미리보기 저장
    if (shouldSend) {
        console.log(`\n📧 이메일 발송 중...`);
        console.log(`   제목: ${emailSubject}`);
        try {
            await sendEmail(emailSubject, emailHtml);
            console.log('\n✅ 뉴스레터 발송 완료!');
        } catch (error) {
            console.error('\n❌ 발송 실패:', error.message);
            process.exit(1);
        }
    } else {
        // Dry Run 모드 - 미리보기 HTML 파일로 저장
        const previewPath = path.join(__dirname, '..', 'newsletter-preview.html');
        fs.writeFileSync(previewPath, emailHtml, 'utf-8');
        console.log(`\n🔍 Dry Run 모드`);
        console.log(`   제목: ${emailSubject}`);
        console.log(`   미리보기 저장됨: ${previewPath}`);
        console.log(`\n💡 브라우저에서 newsletter-preview.html 파일을 열어 확인하세요.`);
    }
}

main();
