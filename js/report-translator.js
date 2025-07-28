// Report Translation System for Coffee Market Updates
class ReportTranslator {
    constructor() {
        this.reportTranslations = {
            // 카테고리 번역
            categories: {
                ko: {
                    'weekly': '주간 보고서',
                    'analysis': '심층 분석',
                    'fundamentals': '펀더멘털',
                    'special': '특별 보고서'
                },
                en: {
                    'weekly': 'Weekly Report',
                    'analysis': 'In-depth Analysis', 
                    'fundamentals': 'Fundamentals',
                    'special': 'Special Report'
                }
            },
            
            // 공통 태그 번역
            tags: {
                ko: {
                    '가격전망': '가격전망',
                    '기술적분석': '기술적분석',
                    '지지선': '지지선',
                    '브라질수확': '브라질수확',
                    '투기포지션': '투기포지션',
                    '시장분석': '시장분석',
                    '단기전망': '단기전망',
                    '아라비카적자': '아라비카적자'
                },
                en: {
                    '가격전망': 'Price Forecast',
                    '기술적분석': 'Technical Analysis',
                    '지지선': 'Support Level',
                    '브라질수확': 'Brazil Harvest',
                    '투기포지션': 'Speculative Position',
                    '시장분석': 'Market Analysis', 
                    '단기전망': 'Short-term Outlook',
                    '아라비카적자': 'Arabica Deficit'
                }
            },

            // 리포트 제목 번역 (주요 리포트들)
            titles: {
                ko: {
                    '단기 커피 선물 가격 전망 및 방향성 점검': '단기 커피 선물 가격 전망 및 방향성 점검',
                    '커피 가격, 폭풍 전야 - 아라비카 시장 인포그래픽': '커피 가격, 폭풍 전야 - 아라비카 시장 인포그래픽',
                    '커피 선물 시장 주간 동향': '커피 선물 시장 주간 동향'
                },
                en: {
                    '단기 커피 선물 가격 전망 및 방향성 점검': 'Short-term Coffee Futures Price Outlook and Direction Analysis',
                    '커피 가격, 폭풍 전야 - 아라비카 시장 인포그래픽': 'Coffee Prices: Before the Storm - Arabica Market Infographic',
                    '커피 선물 시장 주간 동향': 'Weekly Coffee Futures Market Trends'
                }
            },

            // 일반적인 요약문 패턴 번역
            summaryPatterns: {
                ko: {
                    '브라질': '브라질',
                    '아라비카': '아라비카',
                    '커피 시장': '커피 시장',
                    '가격 전망': '가격 전망',
                    '기술적 분석': '기술적 분석'
                },
                en: {
                    '브라질': 'Brazil',
                    '아라비카': 'Arabica', 
                    '커피 시장': 'coffee market',
                    '가격 전망': 'price outlook',
                    '기술적 분석': 'technical analysis'
                }
            }
        };
    }

    // 리포트 카테고리 번역
    translateCategory(category, targetLang) {
        return this.reportTranslations.categories[targetLang]?.[category] || category;
    }

    // 태그 번역
    translateTag(tag, targetLang) {
        return this.reportTranslations.tags[targetLang]?.[tag] || tag;
    }

    // 리포트 제목 번역
    translateTitle(title, targetLang) {
        // 정확한 매칭이 있는 경우
        if (this.reportTranslations.titles[targetLang]?.[title]) {
            return this.reportTranslations.titles[targetLang][title];
        }

        // 영어로 번역할 때 기본 패턴 적용
        if (targetLang === 'en') {
            return this.generateEnglishTitle(title);
        }

        return title;
    }

    // 영어 제목 자동 생성 (기본 패턴)
    generateEnglishTitle(koreanTitle) {
        // 기본적인 패턴 기반 번역
        let englishTitle = koreanTitle;
        
        // 공통 패턴 치환
        const patterns = {
            '커피 선물 시장': 'Coffee Futures Market',
            '주간 동향': 'Weekly Trends',
            '시장 분석': 'Market Analysis',
            '가격 전망': 'Price Outlook',
            '기술적 분석': 'Technical Analysis',
            '심층 분석': 'In-depth Analysis'
        };

        Object.entries(patterns).forEach(([korean, english]) => {
            englishTitle = englishTitle.replace(new RegExp(korean, 'g'), english);
        });

        return englishTitle;
    }

    // 요약문 기본 번역
    translateSummary(summary, targetLang) {
        if (targetLang === 'ko' || !summary) return summary;

        // 영어 요약이 없는 경우 기본 메시지 제공
        if (targetLang === 'en') {
            return 'This report provides detailed analysis of coffee market trends and insights. Please refer to the original Korean report for complete content.';
        }

        return summary;
    }

    // 리포트 객체 전체 번역
    translateReport(report, targetLang) {
        if (targetLang === 'ko') return report;

        return {
            ...report,
            title: this.translateTitle(report.title, targetLang),
            summary: this.translateSummary(report.summary, targetLang),
            tags: report.tags?.map(tag => this.translateTag(tag, targetLang)) || [],
            category: report.category,
            // 원본 한국어 데이터 보존
            original: {
                title: report.title,
                summary: report.summary,
                tags: report.tags
            }
        };
    }

    // 리포트 배열 번역
    translateReports(reports, targetLang) {
        return reports.map(report => this.translateReport(report, targetLang));
    }

    // 새 리포트 번역 추가 (관리자용)
    addReportTranslation(koreanTitle, englishTitle, koreanSummary, englishSummary) {
        this.reportTranslations.titles.ko[koreanTitle] = koreanTitle;
        this.reportTranslations.titles.en[koreanTitle] = englishTitle;
        
        // 로컬 스토리지에 저장 (선택적)
        const customTranslations = JSON.parse(localStorage.getItem('customReportTranslations') || '{}');
        customTranslations[koreanTitle] = {
            en: { title: englishTitle, summary: englishSummary }
        };
        localStorage.setItem('customReportTranslations', JSON.stringify(customTranslations));
    }

    // 커스텀 번역 로드
    loadCustomTranslations() {
        const customTranslations = JSON.parse(localStorage.getItem('customReportTranslations') || '{}');
        
        Object.entries(customTranslations).forEach(([koreanTitle, translations]) => {
            if (translations.en) {
                this.reportTranslations.titles.en[koreanTitle] = translations.en.title;
            }
        });
    }
}

// 전역 인스턴스 생성
const reportTranslator = new ReportTranslator();

// 페이지 로드 시 커스텀 번역 로드
document.addEventListener('DOMContentLoaded', () => {
    reportTranslator.loadCustomTranslations();
});

// 기존 리포트 시스템과 통합
if (typeof window !== 'undefined') {
    window.reportTranslator = reportTranslator;
}