// Performance optimized coffee market dashboard
class CoffeeMarketDashboard {
    constructor() {
        this.charts = {};
        this.allReports = [];
        this.debounceTimer = null;
        this.intersectionObserver = null;
        this.loadedCharts = new Set();
        
        // Cache DOM elements
        this.domElements = {};
        this.initializeDOMCache();
        
        // Initialize intersection observer for lazy loading
        this.initializeIntersectionObserver();
    }

    initializeDOMCache() {
        const selectors = {
            searchInput: '#searchInput',
            yearFilter: '#yearFilter',
            monthFilter: '#monthFilter',
            reportsGrid: '#reportsGrid',
            noResults: '#noResults',
            totalReports: '#totalReports',
            latestDate: '#latestDate',
            currentDate: '#currentDate'
        };

        for (const [key, selector] of Object.entries(selectors)) {
            this.domElements[key] = document.querySelector(selector);
        }
    }

    // Removed IntersectionObserver for simpler implementation
    initializeIntersectionObserver() {
        // Load all charts immediately instead of lazy loading
        setTimeout(() => {
            this.loadChart('coffee');
            this.loadChart('usd');
            this.loadChart('nvdi');
        }, 100);
    }

    async loadChart(chartId) {
        const chartMethods = {
            'coffee': () => this.createCoffeeChart(),
            'usd': () => this.createUSDChart(),
            'nvdi': () => this.createNVDIChart()
        };

        if (chartMethods[chartId]) {
            try {
                await chartMethods[chartId]();
            } catch (error) {
                console.error(`Error loading ${chartId} chart:`, error);
            }
        }
    }

    // Google Sheets configuration
    get GOOGLE_SHEETS_URLS() {
        return {
            coffee: 'https://docs.google.com/spreadsheets/d/1lnRrdQynfk-XrgYsKmf1_XFCBDa9jLr2XVRib-2lpTk/export?format=csv&gid=442491515',
            usd: 'https://docs.google.com/spreadsheets/d/1FvqTjVTw_iCtZ9pQOHc1UBN7ghYvrdp_MOLTxsSLTyM/export?format=csv&gid=88171284',
            nvdi: 'https://docs.google.com/spreadsheets/d/1oxXXeBQDZmiq9te6fNkKTs9D1X8ruwUI0_yy8UOj7gI/export?format=csv&gid=0'
        };
    }

    // Simplified CSV parser - removed complex quote handling
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        return lines.map(line => line.split(',').map(cell => cell.trim()));
    }

    // Google Sheets data reader function (2 columns: Date, Value)
    async readGoogleSheetData(sheetKey) {
        try {
            const url = this.GOOGLE_SHEETS_URLS[sheetKey];
            if (!url) {
                throw new Error(`Unknown sheet key: ${sheetKey}`);
            }

            console.log(`Fetching data from Google Sheets: ${sheetKey}`);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const csvText = await response.text();
            const data = this.parseCSV(csvText);
            
            // First row is header, so exclude and process data
            const dataRows = data.slice(1);
            
            const processedData = dataRows.map(row => ({
                date: row[0], // First column is always Date
                value: row[1] // Second column is the corresponding value
            })).filter(row => row.date && row.value !== undefined && row.value !== null && row.value !== '');
            
            // Sort by date (oldest → newest)
            processedData.sort((a, b) => {
                const dateA = this.parseDate(a.date);
                const dateB = this.parseDate(b.date);
                
                // Check if dates are valid
                if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                    console.error('Invalid dates in sorting:', a.date, b.date);
                    return 0;
                }
                
                return dateA - dateB;
            });
            
            console.log(`Successfully loaded ${processedData.length} data points from ${sheetKey}`);
            return processedData;
            
        } catch (error) {
            console.error(`Error reading Google Sheet ${sheetKey}:`, error);
            return null;
        }
    }

    // Debounced search function
    debounceSearch(func, delay = 300) {
        return (...args) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Optimized report filtering
    filterReports() {
        const searchTerm = this.domElements.searchInput?.value.toLowerCase() || '';
        const yearFilter = this.domElements.yearFilter?.value || '';
        const monthFilter = this.domElements.monthFilter?.value || '';
        
        const filtered = this.allReports.filter(report => {
            const matchesSearch = !searchTerm || (
                report.title.toLowerCase().includes(searchTerm) || 
                report.summary.toLowerCase().includes(searchTerm) ||
                report.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
            const matchesYear = !yearFilter || report.year === yearFilter;
            const matchesMonth = !monthFilter || report.month === monthFilter;
            
            return matchesSearch && matchesYear && matchesMonth;
        });
        
        this.renderReports(filtered);
    }

    // Optimized report rendering with virtual scrolling concept
    renderReports(filteredReports = this.allReports) {
        const grid = this.domElements.reportsGrid;
        const noResults = this.domElements.noResults;
        
        if (!grid || !noResults) return;

        if (filteredReports.length === 0) {
            grid.style.display = 'none';
            noResults.style.display = 'block';
            return;
        }
        
        grid.style.display = 'grid';
        noResults.style.display = 'none';
        
        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        
        // Find latest date for NEW badge
        const latestDate = Math.max(...filteredReports.map(r => new Date(r.date).getTime()));
        
        filteredReports.forEach(report => {
            const isLatest = new Date(report.date).getTime() === latestDate;
            const card = this.createReportCard(report, isLatest);
            fragment.appendChild(card);
        });
        
        // Clear and append all at once
        grid.innerHTML = '';
        grid.appendChild(fragment);
    }

    createReportCard(report, isLatest) {
        const card = document.createElement('div');
        card.className = 'report-card';
        
        // Simplified HTML structure
        card.innerHTML = `
            <div class="report-date">${report.displayDate}</div>
            <h3 class="report-title">${report.title}</h3>
            <p class="report-summary">${report.summary}</p>
            <a href="${report.link}" class="read-more">보고서 읽기</a>
        `;
        
        return card;
    }

    // Optimized chart creation methods
    async createCoffeeChart() {
        const loadingElement = document.getElementById('loading-coffee');
        const chartElement = document.getElementById('coffeeChart');
        
        if (!loadingElement || !chartElement) return;
        
        try {
            const response = await fetch('coffeefutures.xlsx');
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(worksheet);
            
            // Simplified data processing - removed complex date parsing
            const chartData = data.map(row => ({
                x: new Date(row.Date),
                y: parseFloat(row.Close)
            })).filter(item => !isNaN(item.y));
            
            if (chartData.length === 0) {
                throw new Error('No valid data found');
            }
            
            loadingElement.style.display = 'none';
            chartElement.style.display = 'block';
            
            const ctx = chartElement.getContext('2d');
            this.charts.coffee = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'Coffee Futures Price',
                        data: chartData,
                        borderColor: '#8B4513',
                        backgroundColor: 'rgba(139, 69, 19, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'day',
                                tooltipFormat: 'yyyy-MM-dd'
                            },
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        },
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: 'Price (cents/lb)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                title: function(context) {
                                    if (context[0] && context[0].parsed.x) {
                                        const date = new Date(context[0].parsed.x);
                                        return date.toLocaleDateString('ko-KR', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        });
                                    }
                                    return 'Invalid Date';
                                },
                                label: function(context) {
                                    return `Price: ${context.parsed.y.toFixed(2)} cents/lb`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Coffee chart error:', error);
            loadingElement.innerHTML = `<div style="color: #e74c3c;">데이터 로딩 실패: ${error.message}</div>`;
        }
    }

    async createUSDChart() {
        const loadingElement = document.getElementById('loading-usd');
        const chartElement = document.getElementById('usdChart');
        
        if (!loadingElement || !chartElement) return;
        
        try {
            const response = await fetch('usdbrl.xlsx');
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(worksheet);
            
            // Simplified data processing
            const chartData = data.map(row => ({
                x: new Date(row.Date),
                y: parseFloat(row.Close)
            })).filter(item => !isNaN(item.y));
            
            if (chartData.length === 0) {
                throw new Error('No valid data found');
            }
            
            loadingElement.style.display = 'none';
            chartElement.style.display = 'block';
            
            const ctx = chartElement.getContext('2d');
            this.charts.usd = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'USD/BRL Exchange Rate',
                        data: chartData,
                        borderColor: '#2E8B57',
                        backgroundColor: 'rgba(46, 139, 87, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'day',
                                tooltipFormat: 'yyyy-MM-dd'
                            },
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        },
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: 'BRL per USD'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                title: function(context) {
                                    if (context[0] && context[0].parsed.x) {
                                        const date = new Date(context[0].parsed.x);
                                        return date.toLocaleDateString('ko-KR', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        });
                                    }
                                    return 'Invalid Date';
                                },
                                label: function(context) {
                                    return `Exchange Rate: ${context.parsed.y.toFixed(4)} BRL/USD`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('USD chart error:', error);
            loadingElement.innerHTML = `<div style="color: #e74c3c;">데이터 로딩 실패: ${error.message}</div>`;
        }
    }

    // Simplified date parsing - just use native Date constructor
    parseDate(dateValue) {
        if (!dateValue) return null;
        return new Date(dateValue);
    }



    async createNVDIChart() {
        const loadingElement = document.getElementById('loading-nvdi');
        const chartElement = document.getElementById('nvdiChart');
        
        if (!loadingElement || !chartElement) return;
        
        try {
            const response = await fetch('nvdi.xls');
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(worksheet);
            
            const chartData = data.map(row => ({
                x: new Date(row.Date),
                y: parseFloat(row.NVDI)
            })).filter(item => !isNaN(item.y));
            
            loadingElement.style.display = 'none';
            chartElement.style.display = 'block';
            
            const ctx = chartElement.getContext('2d');
            this.charts.nvdi = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'NVDI Index',
                        data: chartData,
                        borderColor: '#FFD700',
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'month'
                            }
                        },
                        y: {
                            beginAtZero: false
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        } catch (error) {
            console.error('NVDI chart error:', error);
            loadingElement.innerHTML = `<div style="color: #e74c3c;">데이터 로딩 실패: ${error.message}</div>`;
        }
    }

    // Initialize reports data
    async initializeReports() {
        try {
            const response = await fetch('reports.json');
            const reports = await response.json();
            
            return reports.map(report => ({
                ...report,
                year: new Date(report.date).getFullYear().toString(),
                month: (new Date(report.date).getMonth() + 1).toString(),
                displayDate: new Date(report.date).toLocaleDateString('ko-KR')
            })).sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Error loading reports:', error);
            return [];
        }
    }

    // Update filter options
    updateFilters() {
        const years = [...new Set(this.allReports.map(r => r.year))].sort().reverse();
        const months = [...new Set(this.allReports.map(r => r.month))].sort();
        
        const yearSelect = this.domElements.yearFilter;
        const monthSelect = this.domElements.monthFilter;
        
        if (yearSelect) {
            yearSelect.innerHTML = '<option value="">전체 년도</option>';
            years.forEach(year => {
                yearSelect.innerHTML += `<option value="${year}">${year}년</option>`;
            });
        }
        
        if (monthSelect) {
            monthSelect.innerHTML = '<option value="">전체 월</option>';
            months.forEach(month => {
                const monthName = parseInt(month) + '월';
                monthSelect.innerHTML += `<option value="${month}">${monthName}</option>`;
            });
        }
    }

    // Update statistics
    updateStats() {
        const totalElement = this.domElements.totalReports;
        const latestElement = this.domElements.latestDate;
        
        if (totalElement) {
            totalElement.textContent = this.allReports.length;
        }
        
        if (latestElement && this.allReports.length > 0) {
            latestElement.textContent = this.allReports[0].displayDate.substring(0, 7);
        }
    }

    // Update current date
    updateCurrentDate() {
        const dateElement = this.domElements.currentDate;
        if (dateElement) {
            const now = new Date();
            const options = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'short'
            };
            const formattedDate = now.toLocaleDateString('ko-KR', options);
            dateElement.textContent = formattedDate;
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Use debounced search
        const debouncedFilter = this.debounceSearch(() => this.filterReports());
        
        if (this.domElements.searchInput) {
            this.domElements.searchInput.addEventListener('input', debouncedFilter);
        }
        
        if (this.domElements.yearFilter) {
            this.domElements.yearFilter.addEventListener('change', () => this.filterReports());
        }
        
        if (this.domElements.monthFilter) {
            this.domElements.monthFilter.addEventListener('change', () => this.filterReports());
        }

        // Setup intersection observer for chart containers
        const chartContainers = document.querySelectorAll('.chart-container');
        chartContainers.forEach(container => {
            const canvas = container.querySelector('canvas');
            if (canvas) {
                const chartId = canvas.id.replace('Chart', '').replace('chart', '');
                container.dataset.chartId = chartId;
                this.intersectionObserver.observe(container);
            }
        });
    }

    // Main initialization
    async init() {
        try {
            console.log('Initializing dashboard...');
            
            // Mobile debugging
            if (window.innerWidth <= 768) {
                console.log('Mobile device detected:', {
                    width: window.innerWidth,
                    height: window.innerHeight,
                    userAgent: navigator.userAgent.substring(0, 100)
                });
            }
            
            // Update current date
            this.updateCurrentDate();
            
            // Load reports data
            this.allReports = await this.initializeReports();
            this.updateFilters();
            this.updateStats();
            this.renderReports();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('Dashboard initialized successfully');
            
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new CoffeeMarketDashboard();
    dashboard.init();
});

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        const timing = performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        console.log(`Page load time: ${loadTime}ms`);
    });
}