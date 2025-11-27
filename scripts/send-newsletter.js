/**
 * Buttondown Newsletter 발송 스크립트
 * 새 리포트 HTML을 구독자들에게 이메일로 발송합니다.
 * 
 * 업데이트: 원본 HTML 스타일 유지 (라이트/다크 테마 모두 지원)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const juice = require('juice');

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
            return JSON.parse(metaMatch[1].trim());
        } catch (e) {
            console.log('메타데이터 파싱 실패, 레거시 추출 시도');
        }
    }
    
    // 레거시 방식: HTML에서 직접 추출
    const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i) ||
                       htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    
    const dateMatch = filePath.match(/(\d{4})-(\d{2})-(\d{2})/);
    
    return {
        title: titleMatch ? titleMatch[1].trim() : '커피 선물 시장 주간 동향',
        date: dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : new Date().toISOString().split('T')[0]
    };
}

/**
 * HTML 테마 감지 (라이트/다크)
 */
function detectTheme(htmlContent) {
    // CSS 변수나 배경색으로 테마 감지
    const darkPatterns = [
        /--paper:\s*#[0-2][0-9a-f]{5}/i,     // 어두운 paper 색상
        /background:\s*#[0-2][0-9a-f]{5}/i,   // 어두운 배경
        /background-color:\s*#[0-2][0-9a-f]{5}/i
    ];
    
    const lightPatterns = [
        /--paper:\s*#[f][a-f0-9]{5}/i,        // 밝은 paper 색상 (#faf8f5 등)
        /background:\s*#[f][a-f0-9]{5}/i,
        /background-color:\s*#[f][a-f0-9]{5}/i
    ];
    
    for (const pattern of lightPatterns) {
        if (pattern.test(htmlContent)) {
            return 'light';
        }
    }
    
    for (const pattern of darkPatterns) {
        if (pattern.test(htmlContent)) {
            return 'dark';
        }
    }
    
    return 'light'; // 기본값
}

/**
 * HTML을 이메일 친화적으로 변환
 * - CSS를 인라인 스타일로 변환 (juice 사용)
 * - 원본 색상/스타일 최대한 유지
 * - 이메일 클라이언트 호환성 최적화
 */
function convertToEmailHtml(htmlContent, reportUrl) {
    let emailHtml = htmlContent;
    
    console.log('📧 이메일용 HTML 변환 시작...');
    
    // 테마 감지
    const theme = detectTheme(htmlContent);
    console.log(`   🎨 감지된 테마: ${theme}`);
    
    // 시스템 폰트 스택
    const systemFontStack = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    const serifFontStack = "Georgia, 'Times New Roman', Times, serif";
    
    // 1. 외부 폰트 링크 제거 (이메일 클라이언트에서 로드 안됨)
    emailHtml = emailHtml.replace(/<link[^>]*fonts\.googleapis\.com[^>]*>/gi, '');
    emailHtml = emailHtml.replace(/<link[^>]*fonts\.gstatic\.com[^>]*>/gi, '');
    emailHtml = emailHtml.replace(/<link[^>]*pretendard[^>]*>/gi, '');
    emailHtml = emailHtml.replace(/<link[^>]*cdn\.jsdelivr[^>]*pretendard[^>]*>/gi, '');
    
    // 2. 모든 script 태그 제거 (이메일에서 JS 실행 안됨)
    emailHtml = emailHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // 3. 메타 코멘트 제거
    emailHtml = emailHtml.replace(/<!--REPORT_META[\s\S]*?REPORT_META-->/gi, '');
    
    // 4. 폰트 스택을 시스템 폰트로 대체 (CSS에서)
    emailHtml = emailHtml.replace(
        /font-family:\s*['"]?Pretendard['"]?[^;]*/gi,
        `font-family: ${systemFontStack}`
    );
    emailHtml = emailHtml.replace(
        /font-family:\s*['"]?Cormorant Garamond['"]?[^;]*/gi,
        `font-family: ${serifFontStack}`
    );
    emailHtml = emailHtml.replace(
        /font-family:\s*['"]?Plus Jakarta Sans['"]?[^;]*/gi,
        `font-family: ${systemFontStack}`
    );
    
    // 5. CSS 그라디언트를 단색으로 변환 (이메일 클라이언트 호환성)
    // linear-gradient에서 첫 번째 색상 추출하여 단색으로
    emailHtml = emailHtml.replace(
        /background:\s*linear-gradient\s*\([^,]+,\s*(#[a-f0-9]{3,6})[^)]*\)/gi,
        'background-color: $1'
    );
    
    // radial-gradient도 첫 번째 색상으로
    emailHtml = emailHtml.replace(
        /background:\s*radial-gradient\s*\([^,]+,\s*(#[a-f0-9]{3,6}|rgba?\([^)]+\))[^)]*\)/gi,
        'background-color: $1'
    );
    
    // 남은 그라디언트 제거 (인라인에서)
    emailHtml = emailHtml.replace(
        /background:\s*(linear|radial)-gradient\s*\([^)]+\)\s*;?/gi,
        ''
    );
    
    // 6. 이메일에서 지원하지 않는 CSS 속성 제거
    // position: fixed, sticky 등
    emailHtml = emailHtml.replace(/position:\s*(fixed|sticky)[^;]*;?/gi, '');
    // backdrop-filter
    emailHtml = emailHtml.replace(/backdrop-filter:[^;]*;?/gi, '');
    emailHtml = emailHtml.replace(/-webkit-backdrop-filter:[^;]*;?/gi, '');
    // CSS 애니메이션
    emailHtml = emailHtml.replace(/animation:[^;]*;?/gi, '');
    emailHtml = emailHtml.replace(/transition:[^;]*;?/gi, '');
    // ::before, ::after pseudo element 스타일 (CSS에서)
    emailHtml = emailHtml.replace(/[^{}]*::before\s*\{[^}]*\}/gi, '');
    emailHtml = emailHtml.replace(/[^{}]*::after\s*\{[^}]*\}/gi, '');
    
    // 7. 상대 경로 이미지를 절대 경로로 변환
    emailHtml = emailHtml.replace(/src="(?!http|data:)([^"]+)"/gi, (match, p1) => {
        return `src="${SITE_URL}/${p1}"`;
    });
    emailHtml = emailHtml.replace(/src='(?!http|data:)([^']+)'/gi, (match, p1) => {
        return `src='${SITE_URL}/${p1}'`;
    });
    
    // 8. 상대 경로 링크를 절대 경로로 변환
    emailHtml = emailHtml.replace(/href="(?!http|mailto|#|tel:)([^"]+)"/gi, (match, p1) => {
        return `href="${SITE_URL}/${p1}"`;
    });
    
    // 9. ★핵심★ juice로 CSS를 인라인 스타일로 변환
    console.log('   🔄 CSS를 인라인 스타일로 변환 중...');
    try {
        emailHtml = juice(emailHtml, {
            removeStyleTags: true,        // <style> 태그 제거
            preserveMediaQueries: false,  // 미디어쿼리 제거
            preserveFontFaces: false,     // @font-face 제거
            preserveKeyFrames: false,     // @keyframes 제거
            applyWidthAttributes: true,   // width를 HTML 속성으로도 적용
            applyHeightAttributes: true,  // height를 HTML 속성으로도 적용
            applyAttributesTableElements: true,
            inlinePseudoElements: false,
            preserveImportant: true
        });
        
        // juice가 남긴 style 태그 제거
        emailHtml = emailHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        
        console.log('   ✅ CSS 인라인 변환 완료');
    } catch (error) {
        console.error('   ⚠️ CSS 인라인 변환 실패, 원본 사용:', error.message);
    }
    
    // 10. 테이블에 기본 속성 추가 (이메일 클라이언트 호환성)
    emailHtml = emailHtml.replace(
        /<table([^>]*)>/gi,
        (match, attrs) => {
            if (!attrs.includes('cellpadding')) {
                attrs += ' cellpadding="0"';
            }
            if (!attrs.includes('cellspacing')) {
                attrs += ' cellspacing="0"';
            }
            if (!attrs.includes('border')) {
                attrs += ' border="0"';
            }
            return `<table${attrs} style="border-collapse: collapse; width: 100%;">`;
        }
    );
    
    // 11. 이미지에 display: block 추가 (이메일에서 여백 방지)
    emailHtml = emailHtml.replace(
        /<img([^>]*)>/gi,
        (match, attrs) => {
            if (attrs.includes('style=')) {
                return match.replace(/style="([^"]*)"/, 'style="$1; display: block;"');
            }
            return `<img${attrs} style="display: block; max-width: 100%; height: auto;">`;
        }
    );
    
    // 12. 웹에서 보기 링크 추가 (상단에)
    const viewOnlineStyle = theme === 'dark' 
        ? 'background-color: #2d1810; color: #cccccc; border-bottom: 2px solid #8B4513;'
        : 'background-color: #f5f0e8; color: #3d2314; border-bottom: 2px solid #b87333;';
    
    const viewLinkColor = theme === 'dark' ? '#D2691E' : '#b87333';
    
    const viewOnlineLink = `
    <div style="${viewOnlineStyle} padding: 15px; text-align: center; font-family: ${systemFontStack}; font-size: 14px; margin: 0;">
        이메일이 제대로 표시되지 않나요? 
        <a href="${reportUrl}" style="color: ${viewLinkColor}; text-decoration: underline; font-weight: 600;">웹브라우저에서 보기</a>
    </div>
    `;
    
    // body 태그 바로 뒤에 삽입
    emailHtml = emailHtml.replace(/<body([^>]*)>/i, (match, attrs) => {
        return `${match}${viewOnlineLink}`;
    });
    
    // 13. 구독 해지 링크 추가 (하단에)
    const footerStyle = theme === 'dark'
        ? 'background-color: #1a0f0a; border-top: 2px solid #8B4513; color: #999999;'
        : 'background-color: #f5f0e8; border-top: 2px solid #b87333; color: #666666;';
    
    const footerTitleColor = theme === 'dark' ? '#D2691E' : '#b87333';
    
    const unsubscribeLink = `
    <div style="${footerStyle} padding: 30px 20px; text-align: center; font-family: ${systemFontStack}; font-size: 12px; margin-top: 40px;">
        <p style="margin: 0 0 10px 0; color: ${footerTitleColor}; font-weight: 600; font-size: 14px;">Coffee Market Info | Align Commodities</p>
        <p style="margin: 0;">
            이 이메일은 coffeemarket.info 뉴스레터 구독자에게 발송되었습니다.<br><br>
            <a href="https://buttondown.com/coffeemarketinfo/unsubscribe/{{ subscriber.id }}" style="color: ${footerTitleColor}; text-decoration: underline;">구독 해지</a>
        </p>
    </div>
    `;
    
    // </body> 태그 바로 전에 삽입
    emailHtml = emailHtml.replace(/<\/body>/i, unsubscribeLink + '</body>');
    
    // 14. 이메일용 DOCTYPE 보장
    if (!emailHtml.includes('<!DOCTYPE')) {
        emailHtml = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n' + emailHtml;
    }
    
    // 15. <html> 태그에 xmlns 추가 (XHTML 호환)
    emailHtml = emailHtml.replace(
        /<html([^>]*)>/gi,
        '<html xmlns="http://www.w3.org/1999/xhtml"$1>'
    );
    
    // 16. nav 요소를 div로 변환 (일부 이메일 클라이언트 호환성)
    emailHtml = emailHtml.replace(/<nav([^>]*)>/gi, '<div$1>');
    emailHtml = emailHtml.replace(/<\/nav>/gi, '</div>');
    
    // 17. header, footer, section, article을 div로 변환
    emailHtml = emailHtml.replace(/<header([^>]*)>/gi, '<div$1>');
    emailHtml = emailHtml.replace(/<\/header>/gi, '</div>');
    emailHtml = emailHtml.replace(/<footer([^>]*)>/gi, '<div$1>');
    emailHtml = emailHtml.replace(/<\/footer>/gi, '</div>');
    emailHtml = emailHtml.replace(/<section([^>]*)>/gi, '<div$1>');
    emailHtml = emailHtml.replace(/<\/section>/gi, '</div>');
    emailHtml = emailHtml.replace(/<article([^>]*)>/gi, '<div$1>');
    emailHtml = emailHtml.replace(/<\/article>/gi, '</div>');
    
    // 18. canvas 요소 제거 (차트는 이메일에서 작동 안함)
    emailHtml = emailHtml.replace(/<canvas[^>]*>[\s\S]*?<\/canvas>/gi, 
        '<p style="color: #999; font-style: italic; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px;">[차트는 웹에서 확인하세요]</p>');
    
    console.log('   ✅ 이메일용 HTML 변환 완료');
    
    return emailHtml;
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
    
    if (!BUTTONDOWN_API_KEY) {
        console.error('❌ BUTTONDOWN_API_KEY 환경변수가 설정되지 않았습니다.');
        console.error('\n💡 해결 방법:');
        console.error('   1. GitHub Repository Settings > Secrets and variables > Actions 이동');
        console.error('   2. "New repository secret" 클릭');
        console.error('   3. Name: BUTTONDOWN_API_KEY');
        console.error('   4. Value: Buttondown 계정의 API 키 입력');
        process.exit(1);
    }
    
    if (BUTTONDOWN_API_KEY.length < 10) {
        console.error('❌ BUTTONDOWN_API_KEY가 너무 짧습니다. 올바른 API 키인지 확인하세요.');
        process.exit(1);
    }
    
    // 명령줄 인자로 파일 경로 받기, 없으면 최신 파일
    let reportPath = process.argv[2];
    
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
    console.log(`   날짜: ${metadata.date}`);
    
    // 리포트 URL 생성
    let relativePath = path.relative(path.join(__dirname, '..'), reportPath);
    relativePath = relativePath.replace(/\\/g, '/');
    const reportUrl = `${SITE_URL}/${relativePath}`;
    console.log(`   URL: ${reportUrl}`);
    
    // 이메일용 HTML 변환
    const emailHtml = convertToEmailHtml(htmlContent, reportUrl);
    
    // 이메일 제목 생성
    const emailSubject = `📊 ${metadata.title}`;
    
    // 발송
    console.log(`\n📧 이메일 발송 중...`);
    try {
        await sendEmail(emailSubject, emailHtml);
        console.log('\n✅ 뉴스레터 발송 완료!');
    } catch (error) {
        console.error('\n❌ 발송 실패:', error.message);
        process.exit(1);
    }
}

main();
