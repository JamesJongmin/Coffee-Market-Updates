// Simplified Coffee Market Dashboard
class CoffeeMarketDashboard {
    constructor() {
        this.charts = {};
        this.allReports = [];
        this.searchTimer = null;
        this.intersectionObserver = null;
        this.loadedCharts = new Set();
        
        // Simple DOM cache
        this.dom = {
            searchInput: document.getElementById('searchInput'),
            yearFilter: document.getElementById('yearFilter'),
            monthFilter: document.getElementById('monthFilter'),
            reportsGrid: document.getElementById('reportsGrid'),
            noResults: document.getElementById('noResults'),
            totalReports: document.getElementById('totalReports'),
            latestDate: document.getElementById('latestDate'),
            currentDate: document.getElementById('currentDate')
        };
        
        this.init();
    }

    async init() {
        try {
            // Wait for Chart.js to load
            await this.waitForDependencies();
            
            // Setup intersection observer for lazy chart loading
            this.setupIntersectionObserver();
            
            // Load data and setup UI
            await this.loadReports();
            this.setupEventListeners();
            this.updateStats();
            this.renderReports();
            
            console.log('Dashboard initialized');
        } catch (error) {
            console.error('Initialization failed:', error);
        }
    }

    waitForDependencies() {
        return new Promise(resolve => {
            const checkDeps = () => {
                if (window.Chart && window.XLSX) {
                    resolve();
                } else {
                    setTimeout(checkDeps, 100);
                }
            };
            checkDeps();
        });
    }

    setupIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const chartId = entry.target.dataset.chartId;
                        if (chartId && !this.loadedCharts.has(chartId)) {
                            this.loadChart(chartId);
                            this.loadedCharts.add(chartId);
                        }
                    }
                });
            },
            { threshold: 0.1 }
        );

        // Observe all chart containers
        document.querySelectorAll('.chart-wrapper').forEach(container => {
            this.intersectionObserver.observe(container);
        });
    }

    async loadReports() {
        try {
            const response = await fetch('reports.json');
            const data = await response.json();
            this.allReports = data.reports || [];
        } catch (error) {
            console.warn('Could not load reports.json, using fallback data');
            this.allReports = this.getFallbackReports();
        }
    }

    getFallbackReports() {
        return [
            {
                date: "2024-01-15",
                title: "Coffee Market Weekly Analysis",
                description: "Weekly coffee market trends and price analysis",
                tags: ["market", "analysis", "weekly"]
            },
            {
                date: "2024-01-10",
                title: "Brazil Weather Impact Report",
                description: "Analysis of weather conditions affecting Brazilian coffee production",
                tags: ["brazil", "weather", "production"]
            },
            {
                date: "2024-01-05",
                title: "Global Coffee Demand Forecast",
                description: "Forecast for global coffee demand in 2024",
                tags: ["global", "demand", "forecast"]
            }
        ];
    }

    setupEventListeners() {
        // Debounced search
        this.dom.searchInput?.addEventListener('input', () => {
            clearTimeout(this.searchTimer);
            this.searchTimer = setTimeout(() => this.filterReports(), 300);
        });

        // Filter changes
        this.dom.yearFilter?.addEventListener('change', () => this.filterReports());
        this.dom.monthFilter?.addEventListener('change', () => this.filterReports());
    }

    updateStats() {
        if (this.dom.totalReports) {
            this.dom.totalReports.textContent = this.allReports.length;
        }

        if (this.dom.latestDate && this.allReports.length > 0) {
            const latestDate = new Date(Math.max(...this.allReports.map(r => new Date(r.date))));
            this.dom.latestDate.textContent = latestDate.toLocaleDateString('ko-KR');
        }

        if (this.dom.currentDate) {
            this.dom.currentDate.textContent = new Date().toLocaleDateString('ko-KR');
        }

        // Update year filter options
        if (this.dom.yearFilter) {
            const years = [...new Set(this.allReports.map(r => new Date(r.date).getFullYear()))].sort((a, b) => b - a);
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year + '년';
                this.dom.yearFilter.appendChild(option);
            });
        }
    }

    filterReports() {
        const searchTerm = this.dom.searchInput?.value.toLowerCase() || '';
        const yearFilter = this.dom.yearFilter?.value || '';
        const monthFilter = this.dom.monthFilter?.value || '';

        const filtered = this.allReports.filter(report => {
            const matchesSearch = !searchTerm || 
                report.title.toLowerCase().includes(searchTerm) ||
                report.description.toLowerCase().includes(searchTerm) ||
                (report.tags && report.tags.some(tag => tag.toLowerCase().includes(searchTerm)));

            const reportDate = new Date(report.date);
            const matchesYear = !yearFilter || reportDate.getFullYear() == yearFilter;
            const matchesMonth = !monthFilter || (reportDate.getMonth() + 1).toString().padStart(2, '0') === monthFilter;

            return matchesSearch && matchesYear && matchesMonth;
        });

        this.renderReports(filtered);
    }

    renderReports(reports = this.allReports) {
        if (!this.dom.reportsGrid) return;

        if (reports.length === 0) {
            this.dom.reportsGrid.style.display = 'none';
            if (this.dom.noResults) this.dom.noResults.style.display = 'block';
            return;
        }

        this.dom.reportsGrid.style.display = 'grid';
        if (this.dom.noResults) this.dom.noResults.style.display = 'none';

        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        
        reports.forEach(report => {
            const card = this.createReportCard(report);
            fragment.appendChild(card);
        });

        this.dom.reportsGrid.innerHTML = '';
        this.dom.reportsGrid.appendChild(fragment);
    }

    createReportCard(report) {
        const card = document.createElement('div');
        card.className = 'report-card';
        
        const date = new Date(report.date).toLocaleDateString('ko-KR');
        const tags = (report.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');
        
        card.innerHTML = `
            <div class="report-date">${date}</div>
            <div class="report-title">${report.title}</div>
            <div class="report-description">${report.description}</div>
            <div class="report-tags">${tags}</div>
        `;

        return card;
    }

    async loadChart(chartId) {
        try {
            switch (chartId) {
                case 'coffee-futures':
                    await this.createCoffeeFuturesChart();
                    break;
                case 'usd-brl':
                    await this.createUsdBrlChart();
                    break;
                case 'cftc':
                    await this.createCftcChart();
                    break;
                case 'nvdi':
                    await this.createNvdiChart();
                    break;
            }
        } catch (error) {
            console.error(`Failed to load chart ${chartId}:`, error);
        }
    }

    async createCoffeeFuturesChart() {
        const data = await this.loadExcelData('coffeefutures.xlsx');
        if (!data || data.length === 0) return;

        const ctx = document.getElementById('coffeeFuturesChart');
        if (!ctx) return;

        const chartData = data.slice(1).map(row => ({
            x: new Date(row[0]),
            y: parseFloat(row[1]) || 0
        })).filter(item => !isNaN(item.y));

        this.charts['coffee-futures'] = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Coffee Price (cents/lb)',
                    data: chartData,
                    borderColor: '#8B4513',
                    backgroundColor: 'rgba(139, 69, 19, 0.1)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: this.getChartOptions('Coffee Futures Price')
        });

        this.hideChartLoading('coffeeFuturesChart');
    }

    async createUsdBrlChart() {
        const data = await this.loadExcelData('usdbrl.xlsx');
        if (!data || data.length === 0) return;

        const ctx = document.getElementById('usdBrlChart');
        if (!ctx) return;

        const chartData = data.slice(1).map(row => ({
            x: new Date(row[0]),
            y: parseFloat(row[1]) || 0
        })).filter(item => !isNaN(item.y));

        this.charts['usd-brl'] = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'USD/BRL Rate',
                    data: chartData,
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: this.getChartOptions('USD/BRL Exchange Rate')
        });

        this.hideChartLoading('usdBrlChart');
    }

    async createCftcChart() {
        const data = await this.loadExcelData('cftcpositions.xlsx');
        if (!data || data.length === 0) return;

        const ctx = document.getElementById('cftcChart');
        if (!ctx) return;

        const chartData = data.slice(1).map(row => ({
            x: new Date(row[0]),
            y: parseFloat(row[1]) || 0
        })).filter(item => !isNaN(item.y));

        this.charts['cftc'] = new Chart(ctx, {
            type: 'bar',
            data: {
                datasets: [{
                    label: 'Net Long Positions',
                    data: chartData,
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderColor: '#3498db',
                    borderWidth: 1
                }]
            },
            options: this.getChartOptions('CFTC Positions')
        });

        this.hideChartLoading('cftcChart');
    }

    async createNvdiChart() {
        const data = await this.loadExcelData('nvdi.xls');
        if (!data || data.length === 0) return;

        const ctx = document.getElementById('nvdiChart');
        if (!ctx) return;

        const chartData = data.slice(1).map(row => ({
            x: new Date(row[0]),
            y: parseFloat(row[1]) || 0
        })).filter(item => !isNaN(item.y));

        this.charts['nvdi'] = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'NVDI Index',
                    data: chartData,
                    borderColor: '#e67e22',
                    backgroundColor: 'rgba(230, 126, 34, 0.1)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: this.getChartOptions('NVDI Index')
        });

        this.hideChartLoading('nvdiChart');
    }

    async loadExcelData(filename) {
        try {
            const response = await fetch(filename);
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        } catch (error) {
            console.warn(`Could not load ${filename}:`, error);
            return this.generateSampleData();
        }
    }

    generateSampleData() {
        const data = [['Date', 'Value']];
        const startDate = new Date('2024-01-01');
        
        for (let i = 0; i < 30; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const value = 100 + Math.random() * 50 - 25; // Random value between 75-125
            data.push([date.toISOString().split('T')[0], value]);
        }
        
        return data;
    }

    getChartOptions(title) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        };
    }

    hideChartLoading(chartId) {
        const loading = document.querySelector(`#${chartId}`).parentElement.querySelector('.chart-loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new CoffeeMarketDashboard();
    });
} else {
    new CoffeeMarketDashboard();
}