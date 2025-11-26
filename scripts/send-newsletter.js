/**
 * Buttondown Newsletter 발송 스크립트
 * 새 리포트 HTML을 구독자들에게 이메일로 발송합니다.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const juice = require('juice');

// 설정
const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY;
const SITE_URL = 'https://coffeemarketinfo.com';

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
 * HTML을 이메일 친화적으로 변환
 * - CSS를 인라인 스타일로 변환 (juice 사용)
 * - 이메일 클라이언트 호환성 최적화
 */
function convertToEmailHtml(htmlContent, reportUrl) {
    let emailHtml = htmlContent;
    
    console.log('📧 이메일용 HTML 변환 시작...');
    
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
        "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    );
    emailHtml = emailHtml.replace(
        /font-family:\s*['"]?Cormorant Garamond['"]?[^;]*/gi,
        "font-family: Georgia, 'Times New Roman', serif"
    );
    emailHtml = emailHtml.replace(
        /font-family:\s*['"]?Plus Jakarta Sans['"]?[^;]*/gi,
        "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    );
    
    // 5. 이메일에서 지원하지 않는 CSS 속성 제거/수정
    // position: fixed는 이메일에서 작동 안함 - body::before pseudo element 제거
    emailHtml = emailHtml.replace(/body::before\s*\{[^}]*\}/gi, '');
    
    // 6. 상대 경로 이미지를 절대 경로로 변환
    emailHtml = emailHtml.replace(/src="(?!http|data:)([^"]+)"/gi, `src="${SITE_URL}/$1"`);
    emailHtml = emailHtml.replace(/src='(?!http|data:)([^']+)'/gi, `src='${SITE_URL}/$1'`);
    
    // 7. 상대 경로 링크를 절대 경로로 변환
    emailHtml = emailHtml.replace(/href="(?!http|mailto|#|tel:)([^"]+)"/gi, `href="${SITE_URL}/$1"`);
    
    // 8. ★핵심★ juice로 CSS를 인라인 스타일로 변환
    console.log('   🔄 CSS를 인라인 스타일로 변환 중...');
    try {
        emailHtml = juice(emailHtml, {
            removeStyleTags: true,        // <style> 태그 제거
            preserveMediaQueries: false,  // 미디어쿼리 제거 (이메일에서 제한적 지원)
            preserveFontFaces: false,     // @font-face 제거
            preserveKeyFrames: false,     // @keyframes 제거
            applyWidthAttributes: true,   // width를 HTML 속성으로도 적용
            applyHeightAttributes: true,  // height를 HTML 속성으로도 적용
            applyAttributesTableElements: true, // 테이블 요소에 속성 적용
            inlinePseudoElements: false,  // pseudo element는 처리 안함
            preserveImportant: true       // !important 유지
        });
        
        // juice가 남긴 hover 등 pseudo-class 스타일 태그 제거
        emailHtml = emailHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        
        console.log('   ✅ CSS 인라인 변환 완료');
    } catch (error) {
        console.error('   ⚠️ CSS 인라인 변환 실패, 원본 사용:', error.message);
    }
    
    // 9. 웹에서 보기 링크 추가 (상단에)
    const viewOnlineLink = `
    <div style="background-color: #f5f0e8; padding: 15px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; margin: 0;">
        이메일이 제대로 표시되지 않나요? 
        <a href="${reportUrl}" style="color: #b87333; text-decoration: underline;">웹브라우저에서 보기</a>
    </div>
    `;
    
    // body 태그 바로 뒤에 삽입
    emailHtml = emailHtml.replace(/<body[^>]*>/i, (match) => match + viewOnlineLink);
    
    // 10. 구독 해지 링크 추가 (하단에)
    const unsubscribeLink = `
    <div style="background-color: #1a0f0a; padding: 20px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #999999; margin-top: 40px;">
        <p style="margin: 0 0 10px 0; color: #999999;">Coffee Market Info | Align Commodities</p>
        <p style="margin: 0; color: #999999;">
            이 이메일은 coffeemarketinfo.com 뉴스레터 구독자에게 발송되었습니다.<br>
            <a href="https://buttondown.com/coffeemarketinfo/unsubscribe/{{ subscriber.id }}" style="color: #b87333;">구독 해지</a>
        </p>
    </div>
    `;
    
    // </body> 태그 바로 전에 삽입
    emailHtml = emailHtml.replace(/<\/body>/i, unsubscribeLink + '</body>');
    
    // 11. 이메일용 DOCTYPE 및 기본 설정 보장
    if (!emailHtml.includes('<!DOCTYPE')) {
        emailHtml = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n' + emailHtml;
    }
    
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
            status: 'about_to_send'  // 즉시 발송 (Buttondown API는 새 이메일에 'sent' 상태를 허용하지 않음)
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
                    
                    // 일반적인 오류에 대한 설명 추가
                    if (res.statusCode === 401) {
                        console.error('');
                        console.error('💡 401 Unauthorized: API 키가 유효하지 않습니다.');
                        console.error('   - Buttondown 계정에서 API 키 확인: https://buttondown.email/settings');
                        console.error('   - GitHub Secrets에 올바른 키가 저장되었는지 확인');
                    } else if (res.statusCode === 403) {
                        console.error('');
                        console.error('💡 403 Forbidden: API 접근 권한이 없습니다.');
                        console.error('   - Buttondown 유료 플랜이 필요할 수 있습니다.');
                    } else if (res.statusCode === 400) {
                        console.error('');
                        console.error('💡 400 Bad Request: 요청 형식이 잘못되었습니다.');
                        console.error('   - HTML 컨텐츠에 문제가 있을 수 있습니다.');
                    } else if (res.statusCode === 429) {
                        console.error('');
                        console.error('💡 429 Too Many Requests: API 호출 제한 초과');
                        console.error('   - 잠시 후 다시 시도해주세요.');
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
    let latestDate = null;
    
    // 연도 폴더 순회
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
                latestDate = files[0].replace('.html', '');
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
        console.error('');
        console.error('💡 해결 방법:');
        console.error('   1. GitHub Repository Settings > Secrets and variables > Actions 이동');
        console.error('   2. "New repository secret" 클릭');
        console.error('   3. Name: BUTTONDOWN_API_KEY');
        console.error('   4. Value: Buttondown 계정의 API 키 입력');
        console.error('   5. Buttondown API 키는 https://buttondown.email/settings 에서 확인 가능');
        console.error('');
        process.exit(1);
    }
    
    // API 키 유효성 간단 체크
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
    const relativePath = path.relative(path.join(__dirname, '..'), reportPath);
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
