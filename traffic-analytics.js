// 웹 트래픽 분석 시스템
class TrafficAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.pageViews = [];
        this.clicks = [];
        this.referrers = [];
        this.userAgent = navigator.userAgent;
        this.screenResolution = `${screen.width}x${screen.height}`;
        this.viewport = `${window.innerWidth}x${window.innerHeight}`;
        
        this.init();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 유입 소스 분석
    analyzeTrafficSource() {
        const referrer = document.referrer;
        const utmParams = this.getUtmParameters();
        const currentUrl = window.location.href;
        
        let trafficSource = {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            referrer: referrer || 'direct',
            currentUrl: currentUrl,
            utm: utmParams,
            source: this.categorizeTrafficSource(referrer, utmParams),
            userAgent: this.userAgent,
            screenResolution: this.screenResolution,
            viewport: this.viewport
        };

        this.logTrafficSource(trafficSource);
        return trafficSource;
    }

    // UTM 파라미터 추출
    getUtmParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            source: urlParams.get('utm_source') || null,
            medium: urlParams.get('utm_medium') || null,
            campaign: urlParams.get('utm_campaign') || null,
            term: urlParams.get('utm_term') || null,
            content: urlParams.get('utm_content') || null
        };
    }

    // 트래픽 소스 분류
    categorizeTrafficSource(referrer, utmParams) {
        // UTM 파라미터가 있으면 우선 사용
        if (utmParams.source) {
            return {
                type: 'campaign',
                source: utmParams.source,
                medium: utmParams.medium,
                campaign: utmParams.campaign
            };
        }

        // 레퍼러 기반 분류
        if (!referrer) {
            return { type: 'direct', source: 'direct', medium: 'none' };
        }

        const domain = this.extractDomain(referrer);
        
        // 검색 엔진 감지
        const searchEngines = {
            'google.com': 'Google',
            'bing.com': 'Bing',
            'yahoo.com': 'Yahoo',
            'duckduckgo.com': 'DuckDuckGo',
            'naver.com': 'Naver',
            'daum.net': 'Daum'
        };

        for (const [engine, name] of Object.entries(searchEngines)) {
            if (domain.includes(engine)) {
                return { type: 'search', source: name, medium: 'organic' };
            }
        }

        // 소셜 미디어 감지
        const socialMedia = {
            'facebook.com': 'Facebook',
            'twitter.com': 'Twitter',
            'instagram.com': 'Instagram',
            'linkedin.com': 'LinkedIn',
            'youtube.com': 'YouTube',
            'tiktok.com': 'TikTok',
            'kakaotalk.com': 'KakaoTalk',
            't.me': 'Telegram'
        };

        for (const [platform, name] of Object.entries(socialMedia)) {
            if (domain.includes(platform)) {
                return { type: 'social', source: name, medium: 'social' };
            }
        }

        // 기타 외부 사이트
        return { type: 'referral', source: domain, medium: 'referral' };
    }

    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch (e) {
            return url;
        }
    }

    // 클릭 이벤트 추적
    trackClicks() {
        document.addEventListener('click', (event) => {
            const target = event.target;
            const clickData = {
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId,
                element: target.tagName,
                className: target.className,
                id: target.id,
                text: target.textContent?.substring(0, 100) || '',
                href: target.href || null,
                x: event.clientX,
                y: event.clientY,
                page: window.location.pathname
            };

            this.clicks.push(clickData);
            this.logClick(clickData);
        });
    }

    // 페이지 뷰 추적
    trackPageViews() {
        const pageView = {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            url: window.location.href,
            title: document.title,
            referrer: document.referrer,
            loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart
        };

        this.pageViews.push(pageView);
        this.logPageView(pageView);
    }

    // 세션 지속 시간 추적
    trackSessionDuration() {
        const duration = Date.now() - this.startTime;
        return Math.floor(duration / 1000); // 초 단위
    }

    // 실시간 방문자 수 추적 (로컬 스토리지 사용)
    trackActiveUsers() {
        const now = Date.now();
        const activeUsers = JSON.parse(localStorage.getItem('activeUsers') || '[]');
        
        // 5분 이내의 활성 사용자만 유지
        const recentUsers = activeUsers.filter(user => now - user.lastActive < 5 * 60 * 1000);
        
        // 현재 사용자 추가/업데이트
        const currentUserIndex = recentUsers.findIndex(user => user.sessionId === this.sessionId);
        if (currentUserIndex >= 0) {
            recentUsers[currentUserIndex].lastActive = now;
        } else {
            recentUsers.push({
                sessionId: this.sessionId,
                lastActive: now,
                startTime: this.startTime
            });
        }

        localStorage.setItem('activeUsers', JSON.stringify(recentUsers));
        return recentUsers.length;
    }

    // 트래픽 데이터 로깅
    logTrafficSource(data) {
        const trafficLogs = JSON.parse(localStorage.getItem('trafficLogs') || '[]');
        trafficLogs.push(data);
        
        // 최근 1000개 로그만 유지
        if (trafficLogs.length > 1000) {
            trafficLogs.splice(0, trafficLogs.length - 1000);
        }
        
        localStorage.setItem('trafficLogs', JSON.stringify(trafficLogs));
        console.log('🔍 Traffic Source:', data);
    }

    logClick(data) {
        const clickLogs = JSON.parse(localStorage.getItem('clickLogs') || '[]');
        clickLogs.push(data);
        
        if (clickLogs.length > 500) {
            clickLogs.splice(0, clickLogs.length - 500);
        }
        
        localStorage.setItem('clickLogs', JSON.stringify(clickLogs));
    }

    logPageView(data) {
        const pageViewLogs = JSON.parse(localStorage.getItem('pageViewLogs') || '[]');
        pageViewLogs.push(data);
        
        if (pageViewLogs.length > 500) {
            pageViewLogs.splice(0, pageViewLogs.length - 500);
        }
        
        localStorage.setItem('pageViewLogs', JSON.stringify(pageViewLogs));
    }

    // 통계 데이터 생성
    generateTrafficStats() {
        const trafficLogs = JSON.parse(localStorage.getItem('trafficLogs') || '[]');
        const clickLogs = JSON.parse(localStorage.getItem('clickLogs') || '[]');
        const pageViewLogs = JSON.parse(localStorage.getItem('pageViewLogs') || '[]');
        
        // 최근 24시간 데이터 필터
        const yesterday = Date.now() - 24 * 60 * 60 * 1000;
        const recentTraffic = trafficLogs.filter(log => new Date(log.timestamp).getTime() > yesterday);
        const recentClicks = clickLogs.filter(log => new Date(log.timestamp).getTime() > yesterday);
        const recentPageViews = pageViewLogs.filter(log => new Date(log.timestamp).getTime() > yesterday);

        // 유입 소스별 통계
        const sourceStats = {};
        recentTraffic.forEach(log => {
            const source = log.source.source;
            if (!sourceStats[source]) {
                sourceStats[source] = {
                    count: 0,
                    type: log.source.type,
                    medium: log.source.medium
                };
            }
            sourceStats[source].count++;
        });

        // 시간대별 통계
        const hourlyStats = {};
        for (let i = 0; i < 24; i++) {
            hourlyStats[i] = 0;
        }
        
        recentPageViews.forEach(log => {
            const hour = new Date(log.timestamp).getHours();
            hourlyStats[hour]++;
        });

        return {
            summary: {
                totalVisitors: recentTraffic.length,
                totalPageViews: recentPageViews.length,
                totalClicks: recentClicks.length,
                activeUsers: this.trackActiveUsers(),
                sessionDuration: this.trackSessionDuration()
            },
            sourceStats,
            hourlyStats,
            topPages: this.getTopPages(recentPageViews),
            topReferrers: this.getTopReferrers(recentTraffic)
        };
    }

    getTopPages(pageViews) {
        const pageStats = {};
        pageViews.forEach(log => {
            const page = log.url;
            pageStats[page] = (pageStats[page] || 0) + 1;
        });

        return Object.entries(pageStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([page, count]) => ({ page, count }));
    }

    getTopReferrers(trafficLogs) {
        const referrerStats = {};
        trafficLogs.forEach(log => {
            const referrer = log.referrer;
            if (referrer !== 'direct') {
                referrerStats[referrer] = (referrerStats[referrer] || 0) + 1;
            }
        });

        return Object.entries(referrerStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([referrer, count]) => ({ referrer, count }));
    }

    // 실시간 대시보드 생성
    createTrafficDashboard() {
        const stats = this.generateTrafficStats();
        
        // 대시보드 HTML 생성
        const dashboardHTML = `
            <div id="traffic-dashboard" style="position: fixed; top: 10px; right: 10px; width: 300px; 
                 background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; 
                 box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000; font-family: Arial, sans-serif; font-size: 12px;">
                
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                    <h3 style="margin: 0; color: #333;">📊 실시간 트래픽</h3>
                    <button onclick="document.getElementById('traffic-dashboard').style.display='none'" 
                            style="background: none; border: none; font-size: 16px; cursor: pointer;">✕</button>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <div style="text-align: center; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                        <div style="font-size: 18px; font-weight: bold; color: #28a745;">${stats.summary.totalVisitors}</div>
                        <div style="color: #666;">방문자 (24h)</div>
                    </div>
                    <div style="text-align: center; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                        <div style="font-size: 18px; font-weight: bold; color: #007bff;">${stats.summary.activeUsers}</div>
                        <div style="color: #666;">현재 접속자</div>
                    </div>
                    <div style="text-align: center; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                        <div style="font-size: 18px; font-weight: bold; color: #ffc107;">${stats.summary.totalPageViews}</div>
                        <div style="color: #666;">페이지뷰</div>
                    </div>
                    <div style="text-align: center; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                        <div style="font-size: 18px; font-weight: bold; color: #dc3545;">${stats.summary.totalClicks}</div>
                        <div style="color: #666;">클릭수</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <h4 style="margin: 0 0 8px 0; color: #333;">🔗 주요 유입 소스</h4>
                    <div style="max-height: 120px; overflow-y: auto;">
                        ${Object.entries(stats.sourceStats)
                            .sort(([,a], [,b]) => b.count - a.count)
                            .slice(0, 5)
                            .map(([source, data]) => `
                                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #eee;">
                                    <span style="color: #666;">${source}</span>
                                    <span style="font-weight: bold;">${data.count}</span>
                                </div>
                            `).join('')}
                    </div>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <h4 style="margin: 0 0 8px 0; color: #333;">📈 시간대별 접속</h4>
                    <div style="display: flex; height: 30px; align-items: end; gap: 1px;">
                        ${Object.entries(stats.hourlyStats).map(([hour, count]) => {
                            const maxCount = Math.max(...Object.values(stats.hourlyStats));
                            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                            return `<div style="flex: 1; background: #007bff; height: ${height}%; min-height: 2px; opacity: 0.7;" title="${hour}시: ${count}명"></div>`;
                        }).join('')}
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 10px;">
                    <button onclick="window.trafficAnalytics.exportData()" 
                            style="background: #007bff; color: white; border: none; padding: 6px 12px; 
                                   border-radius: 4px; cursor: pointer; font-size: 11px;">
                        📊 데이터 내보내기
                    </button>
                </div>
            </div>
        `;

        // 기존 대시보드 제거 후 새로 생성
        const existingDashboard = document.getElementById('traffic-dashboard');
        if (existingDashboard) {
            existingDashboard.remove();
        }

        document.body.insertAdjacentHTML('beforeend', dashboardHTML);
    }

    // 데이터 내보내기
    exportData() {
        const stats = this.generateTrafficStats();
        const trafficLogs = JSON.parse(localStorage.getItem('trafficLogs') || '[]');
        
        const exportData = {
            summary: stats.summary,
            sourceStats: stats.sourceStats,
            hourlyStats: stats.hourlyStats,
            topPages: stats.topPages,
            topReferrers: stats.topReferrers,
            rawData: trafficLogs
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `traffic-analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // 주기적 업데이트
    startRealTimeUpdates() {
        // 30초마다 활성 사용자 업데이트
        setInterval(() => {
            this.trackActiveUsers();
        }, 30000);

        // 5분마다 대시보드 업데이트
        setInterval(() => {
            if (document.getElementById('traffic-dashboard')) {
                this.createTrafficDashboard();
            }
        }, 5 * 60 * 1000);
    }

    // 초기화
    init() {
        console.log('🚀 Traffic Analytics initialized');
        
        // 유입 소스 분석
        this.analyzeTrafficSource();
        
        // 페이지 뷰 추적
        this.trackPageViews();
        
        // 클릭 추적
        this.trackClicks();
        
        // 실시간 업데이트 시작
        this.startRealTimeUpdates();
        
        // 페이지 종료 시 세션 종료 로깅
        window.addEventListener('beforeunload', () => {
            const sessionEnd = {
                sessionId: this.sessionId,
                endTime: new Date().toISOString(),
                duration: this.trackSessionDuration()
            };
            localStorage.setItem('lastSession', JSON.stringify(sessionEnd));
        });
    }
}

// 전역 인스턴스 생성
if (typeof window !== 'undefined') {
    window.trafficAnalytics = new TrafficAnalytics();
    
    // 대시보드 토글 함수
    window.toggleTrafficDashboard = function() {
        const dashboard = document.getElementById('traffic-dashboard');
        if (dashboard) {
            dashboard.style.display = dashboard.style.display === 'none' ? 'block' : 'none';
        } else {
            window.trafficAnalytics.createTrafficDashboard();
        }
    };
    
    console.log('🎯 Traffic Analytics loaded!');
    console.log('   - Use toggleTrafficDashboard() to show/hide dashboard');
    console.log('   - Use window.trafficAnalytics.generateTrafficStats() for detailed stats');
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrafficAnalytics;
}