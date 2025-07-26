// Traffic Analytics Configuration and Management
// Coffee Market Updates 웹사이트를 위한 트래픽 분석 도구

class TrafficAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = new Date();
        this.pageViews = 0;
        this.events = [];
        this.visitorCount = 0;
        
        this.init();
    }

    init() {
        this.setupGoogleAnalytics();
        this.setupCloudflareAnalytics();
        this.setupPageViewTracking();
        this.setupSessionTracking();
        this.setupPerformanceTracking();
        this.displayRealTimeStats();
        
        console.log('🔍 Traffic Analytics initialized successfully');
    }

    // Google Analytics 4 설정
    setupGoogleAnalytics() {
        // GA4 스크립트 동적 로드
        const gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
        document.head.appendChild(gaScript);

        // gtag 함수 초기화
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        
        // GA4 설정 - 실제 Measurement ID로 교체 필요
        gtag('config', 'G-XXXXXXXXXX', {
            page_title: document.title,
            page_location: window.location.href,
            custom_map: {
                'custom_parameter_1': 'coffee_report_type',
                'custom_parameter_2': 'report_date'
            }
        });

        window.gtag = gtag;
    }

    // Cloudflare Web Analytics 설정 (무료, 프라이버시 친화적)
    setupCloudflareAnalytics() {
        const cfScript = document.createElement('script');
        cfScript.defer = true;
        cfScript.src = 'https://static.cloudflareinsights.com/beacon.min.js';
        cfScript.setAttribute('data-cf-beacon', '{"token": "YOUR_CLOUDFLARE_TOKEN"}');
        document.head.appendChild(cfScript);
    }

    // 페이지뷰 추적
    setupPageViewTracking() {
        this.trackPageView();
        
        // SPA처럼 동작하는 페이지 전환 감지
        window.addEventListener('popstate', () => {
            this.trackPageView();
        });
    }

    trackPageView() {
        this.pageViews++;
        const pageData = {
            page: window.location.pathname,
            title: document.title,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`
        };

        this.events.push({
            type: 'pageview',
            data: pageData
        });

        // Google Analytics로 페이지뷰 전송
        if (window.gtag) {
            gtag('event', 'page_view', {
                page_title: pageData.title,
                page_location: window.location.href,
                page_path: pageData.page
            });
        }

        this.updateLocalStats();
    }

    // 세션 추적
    setupSessionTracking() {
        // 페이지 언로드 시 세션 데이터 저장
        window.addEventListener('beforeunload', () => {
            this.endSession();
        });

        // 비활성 상태 감지
        let inactive = false;
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                inactive = true;
                this.trackEvent('session_pause');
            } else {
                if (inactive) {
                    this.trackEvent('session_resume');
                    inactive = false;
                }
            }
        });
    }

    // 성능 추적
    setupPerformanceTracking() {
        window.addEventListener('load', () => {
            // 페이지 로드 시간 측정
            const perfData = performance.getEntriesByType('navigation')[0];
            const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
            
            this.trackEvent('performance', {
                load_time: loadTime,
                dom_content_loaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                first_paint: performance.getEntriesByType('paint')[0]?.startTime || 0
            });
        });
    }

    // 커스텀 이벤트 추적
    trackEvent(eventName, eventData = {}) {
        const event = {
            type: 'event',
            name: eventName,
            data: {
                ...eventData,
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId,
                page: window.location.pathname
            }
        };

        this.events.push(event);

        // Google Analytics로 이벤트 전송
        if (window.gtag) {
            gtag('event', eventName, eventData);
        }

        console.log('📊 Event tracked:', eventName, eventData);
    }

    // 실시간 통계 표시
    displayRealTimeStats() {
        const statsContainer = document.createElement('div');
        statsContainer.id = 'traffic-stats';
        statsContainer.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 8px;
            font-size: 12px;
            z-index: 1000;
            font-family: monospace;
            min-width: 200px;
            display: none;
        `;

        // 토글 버튼 추가
        const toggleButton = document.createElement('button');
        toggleButton.innerHTML = '📊';
        toggleButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 40px;
            height: 40px;
            border: none;
            background: #8B4513;
            color: white;
            border-radius: 50%;
            cursor: pointer;
            z-index: 1001;
            font-size: 16px;
        `;

        toggleButton.addEventListener('click', () => {
            const isVisible = statsContainer.style.display !== 'none';
            statsContainer.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) {
                this.updateStatsDisplay();
            }
        });

        document.body.appendChild(statsContainer);
        document.body.appendChild(toggleButton);

        // 실시간 업데이트
        setInterval(() => {
            if (statsContainer.style.display !== 'none') {
                this.updateStatsDisplay();
            }
        }, 5000);
    }

    updateStatsDisplay() {
        const stats = this.getSessionStats();
        const container = document.getElementById('traffic-stats');
        
        if (container) {
            container.innerHTML = `
                <strong>🔍 실시간 트래픽</strong><br>
                📄 페이지뷰: ${stats.pageViews}<br>
                ⏱️ 세션 시간: ${stats.sessionDuration}<br>
                📱 화면: ${stats.screenResolution}<br>
                🌐 브라우저: ${stats.browser}<br>
                📍 페이지: ${stats.currentPage}<br>
                👥 오늘 방문자: ${stats.todayVisitors}<br>
                📈 총 이벤트: ${stats.totalEvents}
            `;
        }
    }

    getSessionStats() {
        const now = new Date();
        const duration = Math.floor((now - this.startTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        return {
            pageViews: this.pageViews,
            sessionDuration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
            screenResolution: `${screen.width}x${screen.height}`,
            browser: this.getBrowserName(),
            currentPage: window.location.pathname,
            todayVisitors: this.getTodayVisitors(),
            totalEvents: this.events.length
        };
    }

    getBrowserName() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Other';
    }

    getTodayVisitors() {
        const today = new Date().toDateString();
        const stored = localStorage.getItem('daily_visitors');
        const data = stored ? JSON.parse(stored) : {};
        
        if (!data[today]) {
            data[today] = 0;
        }
        
        return data[today] || 0;
    }

    updateLocalStats() {
        // 일일 방문자 수 업데이트
        const today = new Date().toDateString();
        const stored = localStorage.getItem('daily_visitors');
        const data = stored ? JSON.parse(stored) : {};
        
        if (!data[today]) {
            data[today] = 0;
        }
        data[today]++;
        
        localStorage.setItem('daily_visitors', JSON.stringify(data));

        // 세션 데이터 저장
        localStorage.setItem('current_session', JSON.stringify({
            id: this.sessionId,
            startTime: this.startTime.toISOString(),
            pageViews: this.pageViews,
            events: this.events.slice(-10) // 최근 10개 이벤트만 저장
        }));
    }

    endSession() {
        const sessionData = {
            id: this.sessionId,
            startTime: this.startTime.toISOString(),
            endTime: new Date().toISOString(),
            duration: new Date() - this.startTime,
            pageViews: this.pageViews,
            events: this.events
        };

        // 세션 종료 이벤트 추적
        this.trackEvent('session_end', {
            duration: sessionData.duration,
            page_views: sessionData.pageViews
        });

        console.log('📊 Session ended:', sessionData);
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 보고서별 트래픽 분석을 위한 메서드
    trackReportView(reportDate, reportType = 'weekly') {
        this.trackEvent('report_view', {
            report_date: reportDate,
            report_type: reportType,
            coffee_report_type: reportType
        });
    }

    // 차트 상호작용 추적
    trackChartInteraction(chartType, action) {
        this.trackEvent('chart_interaction', {
            chart_type: chartType,
            action: action
        });
    }

    // 데이터 다운로드 추적
    trackDownload(fileType, fileName) {
        this.trackEvent('file_download', {
            file_type: fileType,
            file_name: fileName
        });
    }
}

// 트래픽 분석 도구 초기화
window.addEventListener('DOMContentLoaded', () => {
    window.trafficAnalytics = new TrafficAnalytics();
    
    // 전역적으로 사용할 수 있는 추적 함수들
    window.trackEvent = (name, data) => window.trafficAnalytics.trackEvent(name, data);
    window.trackReportView = (date, type) => window.trafficAnalytics.trackReportView(date, type);
    window.trackChartInteraction = (chart, action) => window.trafficAnalytics.trackChartInteraction(chart, action);
    window.trackDownload = (type, name) => window.trafficAnalytics.trackDownload(type, name);
});

// SEO 및 성능 최적화
class SEOOptimizer {
    constructor() {
        this.init();
    }

    init() {
        this.addStructuredData();
        this.optimizeImages();
        this.addMetaTags();
    }

    addStructuredData() {
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Coffee Market Updates Archive",
            "description": "주간 및 월간 커피 시장 업데이트 비즈니스 인텔리전스",
            "url": "https://jamesjongmin.github.io/Coffee-Market-Updates/",
            "author": {
                "@type": "Organization",
                "name": "Coffee Market Analysis Team"
            },
            "dateModified": new Date().toISOString(),
            "inLanguage": "ko-KR"
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData);
        document.head.appendChild(script);
    }

    optimizeImages() {
        // 이미지 lazy loading 및 최적화
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
        });
    }

    addMetaTags() {
        const metaTags = [
            { name: 'description', content: '커피 선물 시장의 주간 동향과 분석을 제공하는 비즈니스 인텔리전스 플랫폼' },
            { name: 'keywords', content: '커피, 선물, 시장분석, 아라비카, 로부스타, 트레이딩' },
            { name: 'author', content: 'Coffee Market Analysis Team' },
            { property: 'og:title', content: 'Coffee Market Updates Archive' },
            { property: 'og:description', content: '커피 시장의 최신 동향과 분석 보고서' },
            { property: 'og:type', content: 'website' },
            { property: 'og:url', content: window.location.href },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: 'Coffee Market Updates Archive' },
            { name: 'twitter:description', content: '커피 시장의 최신 동향과 분석 보고서' }
        ];

        metaTags.forEach(tag => {
            const existing = document.querySelector(`meta[name="${tag.name}"], meta[property="${tag.property}"]`);
            if (!existing) {
                const meta = document.createElement('meta');
                if (tag.name) meta.name = tag.name;
                if (tag.property) meta.property = tag.property;
                meta.content = tag.content;
                document.head.appendChild(meta);
            }
        });
    }
}

// SEO 최적화 초기화
new SEOOptimizer();