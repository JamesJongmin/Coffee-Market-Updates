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
 * - 그라디언트를 단색으로 변환
 * - 모든 색상을 명시적으로 인라인
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
    const systemFontStack = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    emailHtml = emailHtml.replace(
        /font-family:\s*['"]?Pretendard['"]?[^;]*/gi,
        `font-family: ${systemFontStack}`
    );
    emailHtml = emailHtml.replace(
        /font-family:\s*['"]?Cormorant Garamond['"]?[^;]*/gi,
        "font-family: Georgia, 'Times New Roman', serif"
    );
    emailHtml = emailHtml.replace(
        /font-family:\s*['"]?Plus Jakarta Sans['"]?[^;]*/gi,
        `font-family: ${systemFontStack}`
    );
    
    // 5. CSS 그라디언트를 단색으로 변환 (이메일 클라이언트 호환성)
    // 헤더/카드용 그라디언트 -> 단색 배경
    emailHtml = emailHtml.replace(
        /background:\s*linear-gradient\s*\([^)]*#1a1a1a[^)]*#2d2d2d[^)]*\)/gi,
        'background-color: #1f1f1f'
    );
    emailHtml = emailHtml.replace(
        /background:\s*linear-gradient\s*\([^)]*#1a1a1a[^)]*#242424[^)]*\)/gi,
        'background-color: #1e1e1e'
    );
    emailHtml = emailHtml.replace(
        /background:\s*linear-gradient\s*\([^)]*#2d2d2d[^)]*#3a3a3a[^)]*\)/gi,
        'background-color: #333333'
    );
    emailHtml = emailHtml.replace(
        /background:\s*linear-gradient\s*\([^)]*#2d1810[^)]*#1a1a1a[^)]*\)/gi,
        'background-color: #231510'
    );
    // 나머지 그라디언트도 단색으로
    emailHtml = emailHtml.replace(
        /background:\s*linear-gradient\s*\([^)]+\)/gi,
        'background-color: #1a1a1a'
    );
    
    // radial-gradient도 제거
    emailHtml = emailHtml.replace(
        /background:\s*radial-gradient\s*\([^)]+\)/gi,
        ''
    );
    
    // 6. 이메일에서 지원하지 않는 CSS 속성 제거/수정
    // position: fixed는 이메일에서 작동 안함 - body::before pseudo element 제거
    emailHtml = emailHtml.replace(/body::before\s*\{[^}]*\}/gi, '');
    // header::before도 제거
    emailHtml = emailHtml.replace(/header::before\s*\{[^}]*\}/gi, '');
    
    // 7. 상대 경로 이미지를 절대 경로로 변환 (Reports -> reports 소문자)
    emailHtml = emailHtml.replace(/src="(?!http|data:)([^"]+)"/gi, (match, p1) => {
        const fixedPath = p1.replace(/^Reports/, 'reports');
        return `src="${SITE_URL}/${fixedPath}"`;
    });
    emailHtml = emailHtml.replace(/src='(?!http|data:)([^']+)'/gi, (match, p1) => {
        const fixedPath = p1.replace(/^Reports/, 'reports');
        return `src='${SITE_URL}/${fixedPath}'`;
    });
    
    // 8. 상대 경로 링크를 절대 경로로 변환 (Reports -> reports 소문자)
    emailHtml = emailHtml.replace(/href="(?!http|mailto|#|tel:)([^"]+)"/gi, (match, p1) => {
        const fixedPath = p1.replace(/^Reports/, 'reports');
        return `href="${SITE_URL}/${fixedPath}"`;
    });
    
    // 9. ★핵심★ juice로 CSS를 인라인 스타일로 변환
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
    
    // 10. ★중요★ 이메일 클라이언트용 색상 강화 (juice 후 처리)
    // 일부 이메일 클라이언트가 색상을 무시하는 경우가 있으므로 명시적으로 보강
    
    // body 태그에 배경색 추가 (기존 style 속성과 합치기)
    emailHtml = emailHtml.replace(
        /<body([^>]*)style="([^"]*)"([^>]*)>/gi,
        '<body$1bgcolor="#0a0a0a" style="$2; background-color: #0a0a0a !important; margin: 0; padding: 0;"$3>'
    );
    emailHtml = emailHtml.replace(
        /<body(?![^>]*style=)([^>]*)>/gi,
        '<body$1 bgcolor="#0a0a0a" style="background-color: #0a0a0a !important; margin: 0; padding: 0;">'
    );
    
    // 주요 색상 클래스 강화 - 가격 변동 표시 (더 명확한 색상)
    emailHtml = emailHtml.replace(
        /class="price-change down"/gi,
        'class="price-change down" style="color: #ff6b6b !important; font-weight: 600;"'
    );
    emailHtml = emailHtml.replace(
        /class="price-change up"/gi,
        'class="price-change up" style="color: #51cf66 !important; font-weight: 600;"'
    );
    
    // 테이블 셀 내 가격 변동 색상 (td 내부) - 더 밝은 빨간색/초록색
    emailHtml = emailHtml.replace(
        /<td([^>]*)class="price-change down"([^>]*)>/gi,
        '<td$1class="price-change down"$2 style="color: #ff6b6b !important; padding: 15px; text-align: left; border-bottom: 1px solid #3d2a1a; font-weight: 600;">'
    );
    emailHtml = emailHtml.replace(
        /<td([^>]*)class="price-change up"([^>]*)>/gi,
        '<td$1class="price-change up"$2 style="color: #51cf66 !important; padding: 15px; text-align: left; border-bottom: 1px solid #3d2a1a; font-weight: 600;">'
    );
    
    // 11. 모든 주요 요소에 명시적 색상 추가
    // 헤딩에 이미 style이 있는 경우 색상 추가
    emailHtml = emailHtml.replace(
        /<h1([^>]*)style="([^"]*)"([^>]*)>/gi,
        '<h1$1style="$2; color: #ffffff !important;"$3>'
    );
    emailHtml = emailHtml.replace(
        /<h1(?![^>]*style=)([^>]*)>/gi,
        '<h1$1 style="color: #ffffff !important; font-weight: 700;">'
    );
    
    emailHtml = emailHtml.replace(
        /<h2([^>]*)style="([^"]*)"([^>]*)>/gi,
        '<h2$1style="$2; color: #ffffff !important;"$3>'
    );
    emailHtml = emailHtml.replace(
        /<h2(?![^>]*style=)([^>]*)>/gi,
        '<h2$1 style="color: #ffffff !important; font-weight: 700; border-bottom: 3px solid #D2691E; padding-bottom: 15px;">'
    );
    
    emailHtml = emailHtml.replace(
        /<h3([^>]*)style="([^"]*)"([^>]*)>/gi,
        '<h3$1style="$2; color: #ffffff !important;"$3>'
    );
    emailHtml = emailHtml.replace(
        /<h3(?![^>]*style=)([^>]*)>/gi,
        '<h3$1 style="color: #ffffff !important; font-weight: 600;">'
    );
    
    // p 태그 기본 색상 - 더 밝은 회색으로
    emailHtml = emailHtml.replace(
        /<p([^>]*)style="([^"]*)"([^>]*)>/gi,
        '<p$1style="$2; color: #e0e0e0 !important;"$3>'
    );
    emailHtml = emailHtml.replace(
        /<p(?![^>]*style=)([^>]*)>/gi,
        '<p$1 style="color: #e0e0e0 !important; margin-bottom: 20px; line-height: 1.8;">'
    );
    
    // li 태그 색상 - 더 밝게
    emailHtml = emailHtml.replace(
        /<li([^>]*)style="([^"]*)"([^>]*)>/gi,
        '<li$1style="$2; color: #e0e0e0 !important;"$3>'
    );
    emailHtml = emailHtml.replace(
        /<li(?![^>]*style=)([^>]*)>/gi,
        '<li$1 style="color: #e0e0e0 !important; margin-bottom: 10px;">'
    );
    
    // strong 태그 - 밝은 흰색으로
    emailHtml = emailHtml.replace(
        /<strong([^>]*)style="([^"]*)"([^>]*)>/gi,
        '<strong$1style="$2; color: #ffffff !important;"$3>'
    );
    emailHtml = emailHtml.replace(
        /<strong(?![^>]*style=)([^>]*)>/gi,
        '<strong$1 style="color: #ffffff !important; font-weight: 600;">'
    );
    
    // 테이블 전체에 배경색 추가
    emailHtml = emailHtml.replace(
        /<table([^>]*)>/gi,
        '<table$1 bgcolor="#1a1a1a" style="background-color: #1a1a1a; width: 100%; border-collapse: collapse;">'
    );
    
    // 테이블 헤더 색상 강화 - 더 눈에 띄는 오렌지색
    emailHtml = emailHtml.replace(
        /<th([^>]*)>/gi,
        '<th$1 bgcolor="#333333" style="color: #ff9f43 !important; background-color: #333333 !important; padding: 15px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; border-bottom: 2px solid #D2691E;">'
    );
    
    // 테이블 데이터 셀 색상
    emailHtml = emailHtml.replace(
        /<td([^>]*)style="([^"]*)"([^>]*)>/gi,
        '<td$1style="$2; color: #e0e0e0 !important;"$3>'
    );
    emailHtml = emailHtml.replace(
        /<td(?![^>]*style=)([^>]*)>/gi,
        '<td$1 style="color: #e0e0e0 !important; padding: 15px; text-align: left; border-bottom: 1px solid #3d2a1a;">'
    );
    
    // tbody tr에 배경색 추가
    emailHtml = emailHtml.replace(
        /<tr([^>]*)>/gi,
        '<tr$1 bgcolor="#1a1a1a" style="background-color: #1a1a1a;">'
    );
    
    // thead tr에 다른 배경색
    emailHtml = emailHtml.replace(
        /<thead([^>]*)>[\s\S]*?<tr/gi,
        (match) => match.replace(/<tr([^>]*)>/gi, '<tr$1 bgcolor="#2d2d2d" style="background-color: #2d2d2d;">')
    );
    
    // 링크 색상 강화 - 더 밝은 오렌지색
    emailHtml = emailHtml.replace(
        /<a([^>]*)style="([^"]*)"([^>]*)href=/gi,
        '<a$1style="$2; color: #ff9f43 !important; text-decoration: underline;"$3href='
    );
    emailHtml = emailHtml.replace(
        /<a(?![^>]*style=)([^>]*)href=/gi,
        '<a$1 style="color: #ff9f43 !important; text-decoration: underline;" href='
    );
    
    // 12. highlight-box 스타일 강화 - 배경 더 밝게
    emailHtml = emailHtml.replace(
        /<div([^>]*)class="highlight-box"([^>]*)>/gi,
        '<div$1class="highlight-box"$2 bgcolor="#252525" style="background-color: #252525 !important; border-left: 4px solid #D2691E; padding: 25px; margin: 30px 0;">'
    );
    
    // news-item 스타일 강화
    emailHtml = emailHtml.replace(
        /<div([^>]*)class="news-item"([^>]*)>/gi,
        '<div$1class="news-item"$2 bgcolor="#252525" style="background-color: #252525 !important; padding: 20px; margin: 20px 0; border-left: 3px solid #D2691E;">'
    );
    
    // price-card 스타일 강화
    emailHtml = emailHtml.replace(
        /<div([^>]*)class="price-card"([^>]*)>/gi,
        '<div$1class="price-card"$2 bgcolor="#252525" style="background-color: #252525 !important; padding: 25px; border: 1px solid #D2691E;">'
    );
    
    // price-label 색상 강화
    emailHtml = emailHtml.replace(
        /<div([^>]*)class="price-label"([^>]*)>/gi,
        '<div$1class="price-label"$2 style="color: #ff9f43 !important; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 600;">'
    );
    
    // price-value 색상 강화
    emailHtml = emailHtml.replace(
        /<div([^>]*)class="price-value"([^>]*)>/gi,
        '<div$1class="price-value"$2 style="color: #ffffff !important; font-size: 32px; font-weight: 700; margin-bottom: 5px;">'
    );
    
    // news-date 색상 강화
    emailHtml = emailHtml.replace(
        /<p([^>]*)class="news-date"([^>]*)>/gi,
        '<p$1class="news-date"$2 style="color: #ff9f43 !important; font-size: 13px; font-weight: 600; margin-bottom: 8px;">'
    );
    
    // news-title 색상 강화
    emailHtml = emailHtml.replace(
        /<p([^>]*)class="news-title"([^>]*)>/gi,
        '<p$1class="news-title"$2 style="color: #ffffff !important; font-size: 18px; font-weight: 600; margin-bottom: 12px;">'
    );
    
    // header 스타일 강화
    emailHtml = emailHtml.replace(
        /<header([^>]*)>/gi,
        '<header$1 bgcolor="#1f1f1f" style="background-color: #1f1f1f !important; padding: 60px 40px; margin-bottom: 50px; border: 1px solid #3d2a1a;">'
    );
    
    // header-meta 색상
    emailHtml = emailHtml.replace(
        /<div([^>]*)class="header-meta"([^>]*)>/gi,
        '<div$1class="header-meta"$2 style="color: #ff9f43 !important; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; font-weight: 600;">'
    );
    
    // subtitle 색상
    emailHtml = emailHtml.replace(
        /<p([^>]*)class="subtitle"([^>]*)>/gi,
        '<p$1class="subtitle"$2 style="color: #b0b0b0 !important; font-size: 16px; margin-bottom: 10px;">'
    );
    
    // date 스타일
    emailHtml = emailHtml.replace(
        /<p([^>]*)class="date"([^>]*)>/gi,
        '<p$1class="date"$2 style="color: #ff9f43 !important; font-size: 14px; font-weight: 500; display: inline-block; padding: 6px 16px; background-color: rgba(210, 105, 30, 0.2); border: 1px solid #D2691E;">'
    );
    
    // container 스타일 (배경색 추가)
    emailHtml = emailHtml.replace(
        /<div([^>]*)class="container"([^>]*)>/gi,
        '<div$1class="container"$2 bgcolor="#0a0a0a" style="background-color: #0a0a0a !important; max-width: 800px; margin: 0 auto; padding: 60px 40px;">'
    );
    
    // 13. 웹에서 보기 링크 추가 (상단에) - 더 눈에 띄는 디자인
    const viewOnlineLink = `
    <div style="background-color: #2d1810; padding: 15px; text-align: center; font-family: ${systemFontStack}; font-size: 14px; color: #cccccc; margin: 0; border-bottom: 2px solid #8B4513;">
        이메일이 제대로 표시되지 않나요? 
        <a href="${reportUrl}" style="color: #D2691E; text-decoration: underline; font-weight: 600;">웹브라우저에서 보기</a>
    </div>
    `;
    
    // body 태그 바로 뒤에 삽입
    emailHtml = emailHtml.replace(/<body[^>]*>/i, (match) => match + viewOnlineLink);
    
    // 14. 구독 해지 링크 추가 (하단에)
    const unsubscribeLink = `
    <div style="background-color: #1a0f0a; padding: 30px 20px; text-align: center; font-family: ${systemFontStack}; font-size: 12px; color: #999999; margin-top: 40px; border-top: 2px solid #8B4513;">
        <p style="margin: 0 0 10px 0; color: #D2691E; font-weight: 600; font-size: 14px;">Coffee Market Info | Align Commodities</p>
        <p style="margin: 0; color: #999999;">
            이 이메일은 coffeemarketinfo.com 뉴스레터 구독자에게 발송되었습니다.<br><br>
            <a href="https://buttondown.com/coffeemarketinfo/unsubscribe/{{ subscriber.id }}" style="color: #D2691E; text-decoration: underline;">구독 해지</a>
        </p>
    </div>
    `;
    
    // </body> 태그 바로 전에 삽입
    emailHtml = emailHtml.replace(/<\/body>/i, unsubscribeLink + '</body>');
    
    // 15. 이메일용 DOCTYPE 및 기본 설정 보장
    if (!emailHtml.includes('<!DOCTYPE')) {
        emailHtml = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n' + emailHtml;
    }
    
    // 16. HTML 태그에 배경색 추가 (일부 클라이언트용)
    emailHtml = emailHtml.replace(
        /<html([^>]*)>/gi,
        '<html$1 style="background-color: #0a0a0a;">'
    );
    
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
    
    // 리포트 URL 생성 (Reports -> reports 소문자로 변환)
    let relativePath = path.relative(path.join(__dirname, '..'), reportPath);
    // Windows 경로 구분자 처리 및 Reports를 reports로 변환
    relativePath = relativePath.replace(/\\/g, '/').replace(/^Reports/, 'reports');
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
