// Performance Testing Script for Coffee Market Dashboard
// Run this script in the browser console to measure performance

class PerformanceTester {
    constructor() {
        this.metrics = {};
        this.startTime = Date.now();
        this.observer = null;
    }

    // Test Core Web Vitals
    measureCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.LCP = lastEntry.startTime;
            console.log('🎯 LCP:', this.metrics.LCP.toFixed(2) + 'ms');
        }).observe({entryTypes: ['largest-contentful-paint']});

        // First Input Delay (FID)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                this.metrics.FID = entry.processingStart - entry.startTime;
                console.log('⚡ FID:', this.metrics.FID.toFixed(2) + 'ms');
            });
        }).observe({entryTypes: ['first-input']});

        // Cumulative Layout Shift (CLS)
        let clsScore = 0;
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsScore += entry.value;
                }
            });
            this.metrics.CLS = clsScore;
            console.log('📐 CLS:', this.metrics.CLS.toFixed(4));
        }).observe({entryTypes: ['layout-shift']});
    }

    // Test Loading Performance
    measureLoadingPerformance() {
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            
            // Time to First Byte
            this.metrics.TTFB = timing.responseStart - timing.navigationStart;
            
            // DOM Content Loaded
            this.metrics.DCL = timing.domContentLoadedEventEnd - timing.navigationStart;
            
            // Page Load Complete
            this.metrics.LoadComplete = timing.loadEventEnd - timing.navigationStart;
            
            // First Contentful Paint
            if (window.performance.getEntriesByType) {
                const paintEntries = window.performance.getEntriesByType('paint');
                paintEntries.forEach(entry => {
                    if (entry.name === 'first-contentful-paint') {
                        this.metrics.FCP = entry.startTime;
                    }
                });
            }

            console.log('🚀 Loading Performance:');
            console.log('  - TTFB:', this.metrics.TTFB + 'ms');
            console.log('  - FCP:', (this.metrics.FCP || 'N/A'));
            console.log('  - DCL:', this.metrics.DCL + 'ms');
            console.log('  - Load Complete:', this.metrics.LoadComplete + 'ms');
        }
    }

    // Test Resource Sizes
    measureResourceSizes() {
        const resources = window.performance.getEntriesByType('resource');
        const resourceSizes = {
            total: 0,
            html: 0,
            css: 0,
            js: 0,
            images: 0,
            other: 0
        };

        resources.forEach(resource => {
            const size = resource.transferSize || resource.decodedBodySize || 0;
            resourceSizes.total += size;

            if (resource.name.includes('.html')) {
                resourceSizes.html += size;
            } else if (resource.name.includes('.css')) {
                resourceSizes.css += size;
            } else if (resource.name.includes('.js')) {
                resourceSizes.js += size;
            } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
                resourceSizes.images += size;
            } else {
                resourceSizes.other += size;
            }
        });

        this.metrics.resourceSizes = resourceSizes;

        console.log('📦 Resource Sizes:');
        console.log('  - Total:', this.formatBytes(resourceSizes.total));
        console.log('  - HTML:', this.formatBytes(resourceSizes.html));
        console.log('  - CSS:', this.formatBytes(resourceSizes.css));
        console.log('  - JavaScript:', this.formatBytes(resourceSizes.js));
        console.log('  - Images:', this.formatBytes(resourceSizes.images));
        console.log('  - Other:', this.formatBytes(resourceSizes.other));
    }

    // Test Chart Loading Performance
    measureChartPerformance() {
        const chartContainers = document.querySelectorAll('.chart-container');
        let chartsLoaded = 0;
        const chartLoadTimes = [];

        chartContainers.forEach((container, index) => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const startTime = Date.now();
                        
                        // Wait for chart to load
                        const checkChart = () => {
                            const canvas = container.querySelector('canvas');
                            const loading = container.querySelector('.loading-spinner');
                            
                            if (canvas && canvas.style.display !== 'none') {
                                const loadTime = Date.now() - startTime;
                                chartLoadTimes.push(loadTime);
                                chartsLoaded++;
                                
                                console.log(`📊 Chart ${index + 1} loaded in ${loadTime}ms`);
                                
                                if (chartsLoaded === chartContainers.length) {
                                    const avgLoadTime = chartLoadTimes.reduce((a, b) => a + b, 0) / chartLoadTimes.length;
                                    console.log(`📈 Average chart load time: ${avgLoadTime.toFixed(2)}ms`);
                                }
                                
                                observer.unobserve(entry.target);
                            } else {
                                setTimeout(checkChart, 100);
                            }
                        };
                        
                        checkChart();
                    }
                });
            });
            
            observer.observe(container);
        });
    }

    // Test Search Performance
    measureSearchPerformance() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimes = [];
            
            const originalSearch = searchInput.oninput;
            searchInput.oninput = (event) => {
                const startTime = performance.now();
                
                if (originalSearch) {
                    originalSearch.call(searchInput, event);
                }
                
                // Measure search completion time
                setTimeout(() => {
                    const endTime = performance.now();
                    const searchTime = endTime - startTime;
                    searchTimes.push(searchTime);
                    
                    if (searchTimes.length === 1) {
                        console.log('🔍 First search time:', searchTime.toFixed(2) + 'ms');
                    }
                    
                    if (searchTimes.length >= 5) {
                        const avgSearchTime = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
                        console.log('🔍 Average search time:', avgSearchTime.toFixed(2) + 'ms');
                    }
                }, 0);
            };
        }
    }

    // Test Memory Usage
    measureMemoryUsage() {
        if (window.performance && window.performance.memory) {
            const memory = window.performance.memory;
            
            this.metrics.memory = {
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit
            };

            console.log('🧠 Memory Usage:');
            console.log('  - Used:', this.formatBytes(memory.usedJSHeapSize));
            console.log('  - Total:', this.formatBytes(memory.totalJSHeapSize));
            console.log('  - Limit:', this.formatBytes(memory.jsHeapSizeLimit));
        }
    }

    // Test Cache Performance
    measureCachePerformance() {
        const resources = window.performance.getEntriesByType('resource');
        let cached = 0;
        let total = 0;

        resources.forEach(resource => {
            total++;
            // Resources served from cache will have very small transferSize
            if (resource.transferSize === 0 || resource.transferSize < 100) {
                cached++;
            }
        });

        const cacheHitRate = (cached / total * 100).toFixed(1);
        console.log(`💾 Cache Hit Rate: ${cacheHitRate}% (${cached}/${total} resources)`);
    }

    // Utility function to format bytes
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Generate performance report
    generateReport() {
        console.log('📊 PERFORMANCE REPORT');
        console.log('====================');
        
        // Core Web Vitals Assessment
        console.log('🎯 Core Web Vitals Assessment:');
        if (this.metrics.LCP) {
            const lcpGrade = this.metrics.LCP < 2500 ? '✅ Good' : this.metrics.LCP < 4000 ? '⚠️ Needs Improvement' : '❌ Poor';
            console.log(`  - LCP: ${this.metrics.LCP.toFixed(2)}ms (${lcpGrade})`);
        }
        
        if (this.metrics.FID) {
            const fidGrade = this.metrics.FID < 100 ? '✅ Good' : this.metrics.FID < 300 ? '⚠️ Needs Improvement' : '❌ Poor';
            console.log(`  - FID: ${this.metrics.FID.toFixed(2)}ms (${fidGrade})`);
        }
        
        if (this.metrics.CLS) {
            const clsGrade = this.metrics.CLS < 0.1 ? '✅ Good' : this.metrics.CLS < 0.25 ? '⚠️ Needs Improvement' : '❌ Poor';
            console.log(`  - CLS: ${this.metrics.CLS.toFixed(4)} (${clsGrade})`);
        }

        // Loading Performance Assessment
        console.log('\n🚀 Loading Performance:');
        if (this.metrics.TTFB) {
            const ttfbGrade = this.metrics.TTFB < 600 ? '✅ Good' : this.metrics.TTFB < 1000 ? '⚠️ Needs Improvement' : '❌ Poor';
            console.log(`  - TTFB: ${this.metrics.TTFB}ms (${ttfbGrade})`);
        }
        
        if (this.metrics.FCP) {
            const fcpGrade = this.metrics.FCP < 1800 ? '✅ Good' : this.metrics.FCP < 3000 ? '⚠️ Needs Improvement' : '❌ Poor';
            console.log(`  - FCP: ${this.metrics.FCP.toFixed(2)}ms (${fcpGrade})`);
        }

        // Bundle Size Assessment
        if (this.metrics.resourceSizes) {
            console.log('\n📦 Bundle Size Analysis:');
            const totalSize = this.metrics.resourceSizes.total;
            const grade = totalSize < 500000 ? '✅ Good' : totalSize < 1000000 ? '⚠️ Needs Improvement' : '❌ Poor';
            console.log(`  - Total Size: ${this.formatBytes(totalSize)} (${grade})`);
        }

        console.log('\n📈 Recommendations:');
        if (this.metrics.LCP && this.metrics.LCP > 2500) {
            console.log('  - Optimize images and critical rendering path');
        }
        if (this.metrics.resourceSizes && this.metrics.resourceSizes.total > 1000000) {
            console.log('  - Consider code splitting and lazy loading');
        }
        if (this.metrics.resourceSizes && this.metrics.resourceSizes.images > 500000) {
            console.log('  - Compress images and use modern formats (WebP)');
        }
    }

    // Run all tests
    runAllTests() {
        console.log('🧪 Starting Performance Tests...');
        console.log('================================');
        
        // Immediate measurements
        this.measureLoadingPerformance();
        this.measureResourceSizes();
        this.measureMemoryUsage();
        this.measureCachePerformance();
        
        // Async measurements
        this.measureCoreWebVitals();
        this.measureChartPerformance();
        this.measureSearchPerformance();
        
        // Generate report after a delay to allow async measurements
        setTimeout(() => {
            this.generateReport();
        }, 5000);
    }
}

// Auto-run tests when script is loaded
if (typeof window !== 'undefined' && window.document) {
    const tester = new PerformanceTester();
    
    // Run tests when page is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => tester.runAllTests(), 1000);
        });
    } else {
        setTimeout(() => tester.runAllTests(), 1000);
    }
    
    // Expose tester for manual testing
    window.performanceTester = tester;
    
    console.log('🔧 Performance Tester loaded!');
    console.log('   - Tests will run automatically');
    console.log('   - Use window.performanceTester.runAllTests() to run manually');
    console.log('   - Use window.performanceTester.generateReport() for a summary');
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceTester;
}