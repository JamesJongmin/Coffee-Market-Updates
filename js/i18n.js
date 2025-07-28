// Internationalization (i18n) system for Coffee Market Updates
class I18n {
    constructor() {
        this.currentLanguage = localStorage.getItem('language') || 'ko';
        this.translations = {};
        this.loadTranslations();
    }

    loadTranslations() {
        this.translations = {
            ko: {
                // Navigation and Menu
                'menu.title': 'Coffee Market',
                'menu.subtitle': 'Information Menu',
                'menu.weeklyReport': 'Weekly Report',
                'menu.analysis': 'In-depth Analysis',
                'menu.fundamentals': 'Fundamentals',
                'menu.dashboards': 'Dashboards',
                'menu.footer': 'Align Commodities & <br>Yellowknife',

                // Main Header
                'header.title': 'Coffee Market Updates',
                'header.live': 'Live',
                'header.subtitle': 'Coffee Futures Market Analysis & Dashboard',
                'header.description': '커피 선물 시장 분석 보고서 아카이브 및 실시간 시장 대시보드입니다. <br/>주간 시장 동향, 가격 변동 및 글로벌 수급 현황을 정기적으로 업데이트합니다.',

                // Search and Filters
                'search.placeholder': '보고서 제목이나 내용으로 검색하세요...',
                'filter.allYears': '전체 년도',
                'filter.allMonths': '전체 월',
                'filter.year': '년',
                'filter.month.05': '5월',
                'filter.month.06': '6월',

                // Reports
                'reports.moreReports': 'More Reports',
                'reports.readMore': '보고서 읽기',
                'reports.noResults.title': '검색 결과가 없습니다',
                'reports.noResults.description': '다른 검색어나 필터를 시도해보세요.',

                // Dashboard
                'dashboard.title': '📊 Market Dashboard',
                'dashboard.loading': '데이터 로딩 중...',
                
                // Charts
                'chart.coffeeFutures': 'Coffee Futures',
                'chart.usdBrl': '미국달러-브라질헤알 환율',
                'chart.cftcPositions': 'CFTC 투기 포지션 (순매수)',
                'chart.nvdi': '브라질 남동부 NVDI (식물활력도)',
                'chart.source': '출처',
                'chart.analysis': '📊 차트 분석',
                'chart.analysis.currency': '💱 차트 분석',
                'chart.analysis.cftc': '📈 차트 분석',
                'chart.analysis.nvdi': '🌱 차트 분석',

                // Chart Analysis Content
                'analysis.coffee': '<strong>커피 선물 가격</strong>은 글로벌 커피 시장의 미래 가격 기대치를 반영합니다. 브라질/베트남 등 주요 생산국의 작황, 기후 변화, 글로벌 수요 변화가 주요 변동 요인입니다. 현재 추세는 시장의 공급/수요 균형과 투기적 포지션 변화를 나타냅니다.',
                'analysis.usdBrl': '<strong>USD/BRL 환율</strong>은 커피 시장에 중요한 영향을 미칩니다. 헤알화 약세(USD/BRL 상승) 시 브라질 농민들의 달러 수취액이 증가해 수출 경쟁력이 강화되고, 반대로 헤알화 강세 시에는 브라질 커피의 국제 경쟁력이 약화됩니다. 브라질이 세계 최대 커피 생산국이므로 환율 변동은 글로벌 커피 가격에 직접적 영향을 줍니다.',
                'analysis.cftc': '<strong>CFTC 머니매니저 순매수 포지션</strong>은 대형 펀드들의 커피 시장 심리를 보여줍니다. 양수는 강세 베팅(매수 우세), 음수는 약세 베팅(매도 우세)을 의미합니다. 극단적 포지션은 종종 시장 전환점의 신호가 되며, 현재 포지션 수준은 투기 자금의 방향성과 시장 과열/과매도 상태를 판단하는 중요한 지표입니다.',
                'analysis.nvdi': '<strong>NVDI (정규식생지수)</strong>는 위성 데이터로 측정한 식물의 건강도와 활력도를 나타냅니다. 브라질 남동부는 세계 최대 아라비카 커피 생산지역으로, NVDI 수치가 높을수록 커피나무가 건강하고 수확량 증가가 예상됩니다. 역사적 범위 대비 현재 수치를 통해 올해 작황 상태와 향후 공급량 전망을 예측할 수 있는 핵심 지표입니다.',

                // Dashboard page specific
                'page.dashboards.title': '📊 Market Dashboards',
                'page.dashboards.subtitle': '커피 시장 실시간 차트 대시보드',
                'page.backToHome': '← 홈으로 돌아가기',

                // In-depth Analysis page
                'page.analysis.title': '🔍 In-depth Analysis',
                'page.analysis.subtitle': '커피 시장 심층 분석 보고서',
                'page.analysis.description': '커피 시장의 특별 이슈와 심층 분석을 다루는 보고서들입니다. 주간 동향 외에 특정 주제에 대한 깊이 있는 분석을 제공합니다.',
                'page.analysis.features.1': '단기 가격 전망 및 방향성 분석',
                'page.analysis.features.2': '기술적 분석과 차트 패턴',
                'page.analysis.features.3': '특별 이벤트 및 시장 충격 분석',
                'page.analysis.noReports.title': '심층 분석 리포트가 없습니다',
                'page.analysis.noReports.description': '아직 심층 분석 리포트가 등록되지 않았습니다.',

                // Weekly Report page
                'page.weeklyReport.title': '📈 Weekly Report',
                'page.weeklyReport.subtitle': '주간 커피 시장 동향 보고서',

                // Fundamentals page
                'page.fundamentals.title': 'Coffee Market Fundamentals',
                'page.fundamentals.subtitle': '커피 시장의 기초 데이터와 핵심 지표를 실시간으로 확인하세요'
            },
            en: {
                // Navigation and Menu
                'menu.title': 'Coffee Market',
                'menu.subtitle': 'Information Menu',
                'menu.weeklyReport': 'Weekly Report',
                'menu.analysis': 'In-depth Analysis',
                'menu.fundamentals': 'Fundamentals',
                'menu.dashboards': 'Dashboards',
                'menu.footer': 'Align Commodities & <br>Yellowknife',

                // Main Header
                'header.title': 'Coffee Market Updates',
                'header.live': 'Live',
                'header.subtitle': 'Coffee Futures Market Analysis & Dashboard',
                'header.description': 'Archive of coffee futures market analysis reports and real-time market dashboard. <br/>Regular updates on weekly market trends, price movements, and global supply-demand conditions.',

                // Search and Filters
                'search.placeholder': 'Search by report title or content...',
                'filter.allYears': 'All Years',
                'filter.allMonths': 'All Months',
                'filter.year': '',
                'filter.month.05': 'May',
                'filter.month.06': 'June',

                // Reports
                'reports.moreReports': 'More Reports',
                'reports.readMore': 'Read Report',
                'reports.noResults.title': 'No search results found',
                'reports.noResults.description': 'Try different search terms or filters.',

                // Dashboard
                'dashboard.title': '📊 Market Dashboard',
                'dashboard.loading': 'Loading data...',
                
                // Charts
                'chart.coffeeFutures': 'Coffee Futures',
                'chart.usdBrl': 'USD/BRL Exchange Rate',
                'chart.cftcPositions': 'CFTC Speculative Positions (Net Long)',
                'chart.nvdi': 'Brazil Southeast NVDI (Vegetation Health)',
                'chart.source': 'Source',
                'chart.analysis': '📊 Chart Analysis',
                'chart.analysis.currency': '💱 Chart Analysis',
                'chart.analysis.cftc': '📈 Chart Analysis',
                'chart.analysis.nvdi': '🌱 Chart Analysis',

                // Chart Analysis Content
                'analysis.coffee': '<strong>Coffee futures prices</strong> reflect global coffee market future price expectations. Major factors include crop conditions in key producing countries like Brazil/Vietnam, climate change, and global demand shifts. Current trends indicate market supply/demand balance and changes in speculative positions.',
                'analysis.usdBrl': '<strong>USD/BRL exchange rate</strong> significantly impacts the coffee market. When the Real weakens (USD/BRL rises), Brazilian farmers receive more dollars, enhancing export competitiveness. Conversely, a strong Real weakens Brazilian coffee\'s international competitiveness. As Brazil is the world\'s largest coffee producer, exchange rate fluctuations directly affect global coffee prices.',
                'analysis.cftc': '<strong>CFTC Money Manager net long positions</strong> show large funds\' sentiment in the coffee market. Positive values indicate bullish bets (buying dominance), while negative values indicate bearish bets (selling dominance). Extreme positions often signal market turning points, and current position levels are key indicators for assessing speculative money direction and market overheating/oversold conditions.',
                'analysis.nvdi': '<strong>NVDI (Normalized Difference Vegetation Index)</strong> measures plant health and vitality using satellite data. Brazil\'s Southeast region is the world\'s largest Arabica coffee production area. Higher NVDI values indicate healthier coffee trees and expected yield increases. Comparing current values to historical ranges helps predict this year\'s crop conditions and future supply outlook - a key indicator.',

                // Dashboard page specific
                'page.dashboards.title': '📊 Market Dashboards',
                'page.dashboards.subtitle': 'Real-time Coffee Market Chart Dashboard',
                'page.backToHome': '← Back to Home',

                // In-depth Analysis page
                'page.analysis.title': '🔍 In-depth Analysis',
                'page.analysis.subtitle': 'Coffee Market In-depth Analysis Reports',
                'page.analysis.description': 'Reports covering special issues and in-depth analysis of the coffee market. Provides detailed analysis on specific topics beyond weekly trends.',
                'page.analysis.features.1': 'Short-term price forecasts and directional analysis',
                'page.analysis.features.2': 'Technical analysis and chart patterns',
                'page.analysis.features.3': 'Special events and market shock analysis',
                'page.analysis.noReports.title': 'No in-depth analysis reports available',
                'page.analysis.noReports.description': 'No in-depth analysis reports have been registered yet.',

                // Weekly Report page
                'page.weeklyReport.title': '📈 Weekly Report',
                'page.weeklyReport.subtitle': 'Weekly Coffee Market Trend Reports',

                // Fundamentals page
                'page.fundamentals.title': 'Coffee Market Fundamentals',
                'page.fundamentals.subtitle': 'Check fundamental data and key indicators of the coffee market in real-time'
            }
        };
    }

    setLanguage(language) {
        this.currentLanguage = language;
        localStorage.setItem('language', language);
        this.updatePageContent();
        document.documentElement.lang = language;
    }

    t(key) {
        return this.translations[this.currentLanguage][key] || this.translations['ko'][key] || key;
    }

    updatePageContent() {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = translation;
            } else {
                element.innerHTML = translation;
            }
        });

        // Update date format based on language
        this.updateDateFormat();
        
        // Trigger custom event for other components to update
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: this.currentLanguage } 
        }));
    }

    updateDateFormat() {
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            const now = new Date();
            if (this.currentLanguage === 'ko') {
                dateElement.textContent = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
            } else {
                dateElement.textContent = now.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            }
        }
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getAvailableLanguages() {
        return Object.keys(this.translations);
    }
}

// Initialize i18n system
const i18n = new I18n();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18n;
}