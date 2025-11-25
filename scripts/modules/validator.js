/**
 * 리포트 검증 모듈
 * 
 * 생성된 HTML 리포트의 품질을 검증합니다.
 */

// HTML 유효성 검사
function validateHTMLStructure(html) {
    const warnings = [];
    const errors = [];
    
    // 필수 태그 확인
    const requiredTags = ['<!DOCTYPE html>', '<html', '<head>', '<body>', '</html>', '</head>', '</body>'];
    requiredTags.forEach(tag => {
        if (!html.includes(tag)) {
            errors.push(`필수 태그 누락: ${tag}`);
        }
    });
    
    // 메타데이터 확인
    if (!html.includes('REPORT_META')) {
        warnings.push('REPORT_META 블록이 없습니다.');
    }
    
    // Google Analytics 확인
    if (!html.includes('G-GX9R36120J')) {
        warnings.push('Google Analytics 코드가 없습니다.');
    }
    
    // charset 확인
    if (!html.includes('charset="UTF-8"') && !html.includes("charset='UTF-8'")) {
        warnings.push('UTF-8 charset 선언이 없습니다.');
    }
    
    // viewport 확인
    if (!html.includes('viewport')) {
        warnings.push('viewport 메타 태그가 없습니다.');
    }
    
    return { errors, warnings };
}

// 콘텐츠 품질 검사
function validateContent(content) {
    const warnings = [];
    const errors = [];
    
    // 제목 확인
    if (!content.title || content.title.length < 5) {
        warnings.push('제목이 너무 짧거나 없습니다.');
    }
    
    // 요약 확인
    if (!content.summary || content.summary.length < 50) {
        warnings.push('요약이 너무 짧거나 없습니다.');
    }
    
    // 태그 확인
    if (!content.tags || content.tags.length < 3) {
        warnings.push('태그가 3개 미만입니다.');
    }
    
    // 섹션 확인
    const sections = content.sections || {};
    const requiredSections = ['marketOverview', 'priceAction', 'keyNews'];
    requiredSections.forEach(section => {
        if (!sections[section]) {
            warnings.push(`섹션 누락: ${section}`);
        }
    });
    
    // 뉴스 항목 확인
    const keyNews = sections.keyNews || {};
    if (!keyNews.items || keyNews.items.length < 3) {
        warnings.push('뉴스 항목이 3개 미만입니다.');
    }
    
    // 뉴스 출처 URL 확인
    if (keyNews.items) {
        keyNews.items.forEach((news, i) => {
            if (!news.sourceUrl || !news.sourceUrl.startsWith('http')) {
                warnings.push(`뉴스 ${i + 1}번 항목에 유효한 출처 URL이 없습니다.`);
            }
        });
    }
    
    // 출처 목록 확인
    if (!content.sources || content.sources.length < 2) {
        warnings.push('출처 목록이 2개 미만입니다.');
    }
    
    return { errors, warnings };
}

// 데이터 정확성 검사
function validateData(html, content) {
    const warnings = [];
    const errors = [];
    
    // 날짜 형식 확인
    const datePattern = /\d{4}-\d{2}-\d{2}/;
    if (!datePattern.test(html)) {
        warnings.push('ISO 날짜 형식(YYYY-MM-DD)을 찾을 수 없습니다.');
    }
    
    // 가격 데이터 확인
    const pricePattern = /\d{3}\.\d{2}[¢센트]/;
    if (!pricePattern.test(html)) {
        warnings.push('가격 데이터 형식이 올바르지 않습니다.');
    }
    
    // 링크 확인 (간단한 검사)
    const brokenLinkPattern = /href=""/g;
    const brokenLinks = html.match(brokenLinkPattern);
    if (brokenLinks && brokenLinks.length > 0) {
        warnings.push(`빈 href 속성이 ${brokenLinks.length}개 있습니다.`);
    }
    
    return { errors, warnings };
}

// 접근성 검사
function validateAccessibility(html) {
    const warnings = [];
    
    // alt 속성 확인 (이미지가 있는 경우)
    const imgWithoutAlt = html.match(/<img(?![^>]*alt=)[^>]*>/gi);
    if (imgWithoutAlt && imgWithoutAlt.length > 0) {
        warnings.push(`alt 속성이 없는 이미지가 ${imgWithoutAlt.length}개 있습니다.`);
    }
    
    // lang 속성 확인
    if (!html.includes('lang="ko"') && !html.includes("lang='ko'")) {
        warnings.push('HTML lang 속성이 없거나 ko가 아닙니다.');
    }
    
    return { warnings };
}

// 파일 크기 검사
function validateFileSize(html) {
    const warnings = [];
    const sizeKB = Buffer.byteLength(html, 'utf8') / 1024;
    
    if (sizeKB > 500) {
        warnings.push(`파일 크기가 ${Math.round(sizeKB)}KB로 큽니다. 500KB 이하를 권장합니다.`);
    }
    
    if (sizeKB < 10) {
        warnings.push(`파일 크기가 ${Math.round(sizeKB)}KB로 작습니다. 콘텐츠가 충분한지 확인하세요.`);
    }
    
    return { warnings };
}

// 메인 검증 함수
function validateReport(html, content) {
    const allErrors = [];
    const allWarnings = [];
    
    // HTML 구조 검증
    const htmlValidation = validateHTMLStructure(html);
    allErrors.push(...htmlValidation.errors);
    allWarnings.push(...htmlValidation.warnings);
    
    // 콘텐츠 품질 검증
    const contentValidation = validateContent(content);
    allErrors.push(...contentValidation.errors);
    allWarnings.push(...contentValidation.warnings);
    
    // 데이터 정확성 검증
    const dataValidation = validateData(html, content);
    allErrors.push(...dataValidation.errors);
    allWarnings.push(...dataValidation.warnings);
    
    // 접근성 검증
    const accessibilityValidation = validateAccessibility(html);
    allWarnings.push(...accessibilityValidation.warnings);
    
    // 파일 크기 검증
    const sizeValidation = validateFileSize(html);
    allWarnings.push(...sizeValidation.warnings);
    
    // 결과 반환
    const valid = allErrors.length === 0;
    
    return {
        valid,
        errors: allErrors,
        warnings: allWarnings,
        summary: {
            errorCount: allErrors.length,
            warningCount: allWarnings.length
        }
    };
}

// 품질 점수 계산
function calculateQualityScore(validation) {
    let score = 100;
    
    // 에러당 -20점
    score -= validation.errors.length * 20;
    
    // 경고당 -5점
    score -= validation.warnings.length * 5;
    
    return Math.max(0, Math.min(100, score));
}

module.exports = {
    validateReport,
    validateHTMLStructure,
    validateContent,
    validateData,
    validateAccessibility,
    validateFileSize,
    calculateQualityScore
};
