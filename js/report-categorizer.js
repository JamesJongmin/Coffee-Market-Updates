// Report Categorization System for Coffee Market Updates
class ReportCategorizer {
    constructor() {
        this.categoryRules = {
            // 주간 보고서 (Weekly Report) 판별 규칙
            weekly: {
                titleKeywords: [
                    '주간 동향',
                    'weekly update',
                    'weekly trend',
                    '주간 분석',
                    'weekly analysis'
                ],
                tags: [
                    '주간동향',
                    'weekly',
                    '시장분석'
                ],
                patterns: [
                    /주간.*동향/i,
                    /weekly.*update/i,
                    /weekly.*trend/i
                ]
            },

            // 심층 분석 (In-depth Analysis) 판별 규칙
            analysis: {
                titleKeywords: [
                    '심층 분석',
                    'in-depth analysis',
                    '전망',
                    'outlook',
                    '방향성 점검',
                    'direction analysis',
                    '기술적 분석',
                    'technical analysis',
                    '특별 분석',
                    'special analysis'
                ],
                tags: [
                    '기술적분석',
                    '가격전망',
                    '단기전망',
                    '심층분석',
                    'technical',
                    'forecast',
                    'outlook'
                ],
                patterns: [
                    /심층.*분석/i,
                    /in-depth.*analysis/i,
                    /.*전망.*점검/i,
                    /기술적.*분석/i,
                    /.*방향성.*점검/i
                ]
            },

            // 펀더멘털 (Fundamentals) 판별 규칙
            fundamentals: {
                titleKeywords: [
                    '펀더멘털',
                    'fundamental',
                    '공급',
                    'supply',
                    '수요',
                    'demand',
                    '생산',
                    'production',
                    '수출입',
                    'export',
                    'import'
                ],
                tags: [
                    '펀더멘털',
                    '공급분석',
                    '수요분석',
                    '생산현황',
                    'fundamental',
                    'supply',
                    'demand'
                ],
                patterns: [
                    /펀더멘털/i,
                    /fundamental/i,
                    /공급.*분석/i,
                    /수요.*분석/i
                ]
            },

            // 특별 보고서 (Special Report) 판별 규칙
            special: {
                titleKeywords: [
                    '특별',
                    'special',
                    '긴급',
                    'urgent',
                    '속보',
                    'breaking',
                    '이벤트',
                    'event'
                ],
                tags: [
                    '특별보고서',
                    '긴급분석',
                    'special',
                    'urgent',
                    'breaking'
                ],
                patterns: [
                    /특별.*보고서/i,
                    /special.*report/i,
                    /긴급.*분석/i,
                    /urgent.*analysis/i
                ]
            }
        };
    }

    // 리포트 카테고리 자동 판별
    categorizeReport(report) {
        const title = report.title?.toLowerCase() || '';
        const tags = report.tags || [];
        const summary = report.summary?.toLowerCase() || '';

        // 각 카테고리별 점수 계산
        const scores = {};
        
        Object.entries(this.categoryRules).forEach(([category, rules]) => {
            let score = 0;

            // 제목 키워드 매칭
            rules.titleKeywords.forEach(keyword => {
                if (title.includes(keyword.toLowerCase())) {
                    score += 3; // 제목 매칭은 높은 점수
                }
            });

            // 태그 매칭
            rules.tags.forEach(ruleTag => {
                if (tags.some(tag => tag.toLowerCase().includes(ruleTag.toLowerCase()))) {
                    score += 2; // 태그 매칭은 중간 점수
                }
            });

            // 패턴 매칭
            rules.patterns.forEach(pattern => {
                if (pattern.test(title) || pattern.test(summary)) {
                    score += 2; // 패턴 매칭은 중간 점수
                }
            });

            scores[category] = score;
        });

        // 가장 높은 점수의 카테고리 반환
        const maxScore = Math.max(...Object.values(scores));
        
        if (maxScore === 0) {
            // 기본값: 제목에 "주간"이 포함되면 weekly, 아니면 analysis
            if (title.includes('주간') || title.includes('weekly')) {
                return 'weekly';
            }
            return 'analysis'; // 기본값
        }

        const bestCategory = Object.entries(scores)
            .find(([category, score]) => score === maxScore)?.[0];

        return bestCategory || 'analysis';
    }

    // 리포트 배열에 카테고리 정보 추가
    categorizeReports(reports) {
        return reports.map(report => ({
            ...report,
            category: this.categorizeReport(report)
        }));
    }

    // 카테고리별 리포트 필터링
    filterByCategory(reports, category) {
        const categorizedReports = this.categorizeReports(reports);
        return categorizedReports.filter(report => report.category === category);
    }

    // 카테고리별 리포트 개수 반환
    getCategoryCounts(reports) {
        const categorizedReports = this.categorizeReports(reports);
        const counts = {
            weekly: 0,
            analysis: 0,
            fundamentals: 0,
            special: 0
        };

        categorizedReports.forEach(report => {
            if (counts.hasOwnProperty(report.category)) {
                counts[report.category]++;
            }
        });

        return counts;
    }

    // 리포트가 특정 페이지로 이동해야 하는지 판별
    getTargetPage(report) {
        const category = this.categorizeReport(report);
        
        const pageMapping = {
            'weekly': 'weekly-report.html',
            'analysis': 'in-depth-analysis.html',
            'fundamentals': 'fundamentals/fundamentals.html',
            'special': 'in-depth-analysis.html' // 특별 보고서도 심층 분석으로
        };

        return pageMapping[category] || 'in-depth-analysis.html';
    }

    // 메뉴 클릭 시 해당 카테고리 리포트가 있는지 확인
    hasReportsInCategory(reports, category) {
        const categorizedReports = this.categorizeReports(reports);
        return categorizedReports.some(report => report.category === category);
    }

    // 카테고리별 최신 리포트 반환
    getLatestByCategory(reports, category) {
        const categoryReports = this.filterByCategory(reports, category);
        if (categoryReports.length === 0) return null;

        return categoryReports.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    }

    // 디버깅용: 리포트 분류 결과 출력
    debugCategorization(reports) {
        const categorizedReports = this.categorizeReports(reports);
        const counts = this.getCategoryCounts(reports);
        
        console.log('📊 Report Categorization Results:');
        console.log('Counts by category:', counts);
        
        categorizedReports.forEach(report => {
            console.log(`${report.title} → ${report.category}`);
        });

        return categorizedReports;
    }
}

// 전역 인스턴스 생성
const reportCategorizer = new ReportCategorizer();

// 기존 시스템과 통합
if (typeof window !== 'undefined') {
    window.reportCategorizer = reportCategorizer;
}