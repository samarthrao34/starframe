// StarFrame Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.charts = {};
        this.refreshInterval = null;
        this.init();
    }

    async init() {
        // Always setup login event listeners first
        this.setupLoginEventListeners();
        
        // Check authentication status
        await this.checkAuthStatus();
        
        if (this.isAuthenticated) {
            this.showDashboard();
            this.setupEventListeners();
            await this.loadDashboardData();
            this.startAutoRefresh();
        } else {
            this.showLogin();
        }
    }

    // Authentication Methods
    async checkAuthStatus() {
        try {
            const response = await this.apiCall('/api/auth/status');
            this.isAuthenticated = response.isAuthenticated;
            
            if (this.isAuthenticated) {
                const userResponse = await this.apiCall('/api/auth/me');
                this.currentUser = userResponse.user;
            }
        } catch (error) {
            console.log('Not authenticated');
            this.isAuthenticated = false;
        }
    }

    async login(username, password, twoFactorCode = null) {
        try {
            const requestBody = { username, password, twoFactorCode };
            
            const response = await this.apiCall('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            if (response.requireTwoFactor) {
                return { requireTwoFactor: true };
            }

            if (response.success) {
                this.isAuthenticated = true;
                this.currentUser = response.user;
                return { success: true };
            }
        } catch (error) {
            throw new Error(error.message || 'Login failed');
        }
    }

    async logout() {
        try {
            await this.apiCall('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.isAuthenticated = false;
            this.currentUser = null;
            this.showLogin();
            this.stopAutoRefresh();
        }
    }

    // UI Methods
    showLogin() {
        this.hideElement('loadingScreen');
        this.hideElement('dashboard');
        this.showElement('loginScreen');
    }

    showDashboard() {
        this.hideElement('loadingScreen');
        this.hideElement('loginScreen');
        this.showElement('dashboard');
        
        if (this.currentUser) {
            document.getElementById('currentUsername').textContent = this.currentUser.username;
            document.getElementById('userMenuName').textContent = this.currentUser.username;
        }
    }

    showLoading() {
        this.showElement('loadingScreen');
    }

    hideLoading() {
        this.hideElement('loadingScreen');
    }

    showElement(id) {
        const element = document.getElementById(id);
        if (element) element.classList.remove('hidden');
    }

    hideElement(id) {
        const element = document.getElementById(id);
        if (element) element.classList.add('hidden');
    }

    // Login Event Listeners (setup immediately)
    setupLoginEventListeners() {
        console.log('Setting up login event listeners');
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            console.log('Login form found, adding event listener');
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        } else {
            console.log('Login form not found');
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Logout buttons
        document.querySelectorAll('#logoutButton, #logoutLink').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });

        // Sidebar navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.navigateToSection(section);
            });
        });

        // Sidebar toggle (mobile)
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('mobile-open');
            });
        }

        // User menu dropdown
        const userMenuToggle = document.querySelector('.user-menu-toggle');
        const userMenuDropdown = document.querySelector('.user-menu-dropdown');
        if (userMenuToggle && userMenuDropdown) {
            userMenuToggle.addEventListener('click', () => {
                userMenuDropdown.classList.toggle('hidden');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!userMenuToggle.contains(e.target)) {
                    userMenuDropdown.classList.add('hidden');
                }
            });
        }

        // Quick actions
        document.querySelectorAll('.quick-action').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop') || 
                e.target.classList.contains('modal-close') ||
                e.target.classList.contains('modal-cancel')) {
                this.closeModal();
            }
        });

        // Notification close
        const notificationClose = document.querySelector('.notification-close');
        if (notificationClose) {
            notificationClose.addEventListener('click', () => {
                this.hideElement('notification');
            });
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        const username = formData.get('username');
        const password = formData.get('password');
        const twoFactorCode = formData.get('twoFactorCode');
        
        const loginButton = document.getElementById('loginButton');
        const errorElement = document.getElementById('loginError');
        
        try {
            loginButton.disabled = true;
            loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
            this.hideElement('loginError');

            const result = await this.login(username, password, twoFactorCode);
            
            if (result.requireTwoFactor) {
                this.showElement('twoFactorGroup');
                this.showNotification('Please enter your 2FA code', 'info');
            } else if (result.success) {
                this.showDashboard();
                this.setupEventListeners();
                await this.loadDashboardData();
                this.startAutoRefresh();
                this.showNotification('Login successful!', 'success');
            }
        } catch (error) {
            this.showError(errorElement, error.message);
        } finally {
            loginButton.disabled = false;
            loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    }

    navigateToSection(section) {
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Show selected section
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(`${section}-section`).classList.add('active');

        // Update page title
        const titles = {
            overview: 'Dashboard Overview',
            analytics: 'Analytics',
            visitors: 'Visitor Management',
            security: 'Security Center',
            clients: 'Client Management',
            payments: 'Payment Tracking',
            commissions: 'Commission Requests',
            content: 'Content Management',
            system: 'System Management',
            logs: 'System Logs'
        };
        document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';

        if (section === 'commissions') {
            this.loadCommissions();
            this.setupCommissionsEventListeners();
        }
    }

    async handleQuickAction(action) {
        try {
            this.showNotification('Processing...', 'info');
            
            const response = await this.apiCall(`/api/admin/system/actions/${action}`, {
                method: 'POST'
            });
            
            if (response.success) {
                this.showNotification(response.message, 'success');
                
                // Refresh dashboard data after certain actions
                if (['backup', 'security-scan'].includes(action)) {
                    await this.loadDashboardData();
                }
            }
        } catch (error) {
            this.showNotification(error.message || 'Action failed', 'error');
        }
    }

    // Data Loading Methods
    async loadDashboardData() {
        try {
            const [dashboardData, realtimeData] = await Promise.all([
                this.apiCall('/api/admin/dashboard'),
                this.apiCall('/api/analytics/realtime')
            ]);

            this.updateDashboardStats(dashboardData.stats);
            this.updateRecentActivities(dashboardData.recentActivities);
            this.updateLiveVisitors(realtimeData.activeVisitors);
            this.createCharts(dashboardData);

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }

    updateDashboardStats(stats) {
        // Update stat cards
        const statElements = {
            totalVisitors: stats.totalVisitors || 0,
            securityAlerts: stats.securityAlerts || 0,
            newInquiries: stats.newInquiries || 0,
            systemUptime: stats.systemUptime || '99.9%'
        };

        Object.entries(statElements).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = value;
            }
        });

        // Update visitor change
        const changeElement = document.getElementById('visitorsChange');
        if (changeElement && stats.visitorsChange !== undefined) {
            changeElement.textContent = `${stats.visitorsChange}%`;
            const changeContainer = changeElement.closest('.stat-change');
            changeContainer.className = `stat-change ${parseFloat(stats.visitorsChange) >= 0 ? 'positive' : 'negative'}`;
        }
    }

    updateRecentActivities(activities) {
        const container = document.getElementById('recentActivities');
        if (!container || !activities) return;

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${this.getActivityIcon(activity.action)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${this.formatActivityText(activity)}</div>
                    <div class="activity-time">${this.formatTime(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    updateLiveVisitors(count) {
        const element = document.getElementById('liveVisitors');
        if (element) {
            element.textContent = count || 0;
        }
    }

    createCharts(data) {
        // Create visitors chart if canvas exists
        const visitorsCanvas = document.getElementById('visitorsChart');
        if (visitorsCanvas) {
            this.createVisitorsChart(visitorsCanvas, data);
        }

        // Create security chart if canvas exists
        const securityCanvas = document.getElementById('securityChart');
        if (securityCanvas) {
            this.createSecurityChart(securityCanvas, data);
        }
    }

    createVisitorsChart(canvas, data) {
        if (this.charts.visitors) {
            this.charts.visitors.destroy();
        }

        // Use real visitor trends data
        this.loadVisitorTrends().then(trendsData => {
            const labels = trendsData.trends.map(trend => trend.hour);
            const visitors = trendsData.trends.map(trend => trend.visitors);
            
            this.renderVisitorsChart(canvas, labels, visitors);
        }).catch(error => {
            console.error('Failed to load visitor trends:', error);
            // Fallback to sample data
            const labels = [];
            const visitors = [];
            
            for (let i = 23; i >= 0; i--) {
                const hour = new Date();
                hour.setHours(hour.getHours() - i);
                labels.push(hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                visitors.push(0); // Show 0 if no real data
            }
            
            this.renderVisitorsChart(canvas, labels, visitors);
        });
    }
    
    renderVisitorsChart(canvas, labels, visitors) {

        const ctx = canvas.getContext('2d');
        this.charts.visitors = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Visitors',
                    data: visitors,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e2e8f0'
                        }
                    },
                    x: {
                        grid: {
                            color: '#e2e8f0'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    createSecurityChart(canvas, data) {
        if (this.charts.security) {
            this.charts.security.destroy();
        }

        // Generate sample security data
        const ctx = canvas.getContext('2d');
        this.charts.security = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Low', 'Medium', 'High', 'Critical'],
                datasets: [{
                    data: [12, 5, 2, 0],
                    backgroundColor: [
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#7c2d12'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Load visitor trends data
    async loadVisitorTrends(hours = 24) {
        try {
            return await this.apiCall(`/api/analytics/trends?hours=${hours}`);
        } catch (error) {
            console.error('Failed to load visitor trends:', error);
            throw error;
        }
    }

    // Auto-refresh functionality
    startAutoRefresh() {
        this.refreshInterval = setInterval(async () => {
            try {
                const realtimeData = await this.apiCall('/api/analytics/realtime');
                this.updateLiveVisitors(realtimeData.activeVisitors);
            } catch (error) {
                console.error('Auto-refresh error:', error);
            }
        }, 30000); // Refresh every 30 seconds
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // Utility Methods
    async apiCall(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include'
        };

        const finalOptions = { ...defaultOptions, ...options };
        const response = await fetch(url, finalOptions);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        return await response.json();
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const icon = document.querySelector('.notification-icon');
        const text = document.querySelector('.notification-text');
        
        if (!notification || !icon || !text) return;

        const icons = {
            success: 'fas fa-check-circle text-green',
            error: 'fas fa-exclamation-circle text-error',
            warning: 'fas fa-exclamation-triangle text-warning',
            info: 'fas fa-info-circle'
        };

        icon.className = `notification-icon ${icons[type] || icons.info}`;
        text.textContent = message;
        
        notification.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 5000);
    }

    showError(element, message) {
        if (element) {
            element.textContent = message;
            element.classList.remove('hidden');
        }
    }

    showModal(title, content, onConfirm = null) {
        const modal = document.getElementById('modalContainer');
        const titleEl = document.querySelector('.modal-title');
        const bodyEl = document.querySelector('.modal-body');
        const confirmBtn = document.querySelector('.modal-confirm');
        
        if (!modal || !titleEl || !bodyEl) return;

        titleEl.textContent = title;
        bodyEl.innerHTML = content;
        modal.classList.remove('hidden');

        if (onConfirm && confirmBtn) {
            const handler = () => {
                onConfirm();
                this.closeModal();
                confirmBtn.removeEventListener('click', handler);
            };
            confirmBtn.addEventListener('click', handler);
        }
    }

    closeModal() {
        const modal = document.getElementById('modalContainer');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
        
        return date.toLocaleDateString();
    }

    getActivityIcon(action) {
        const iconMap = {
            'GET': 'eye',
            'POST': 'plus',
            'PUT': 'edit',
            'DELETE': 'trash',
            'login': 'sign-in-alt',
            'logout': 'sign-out-alt'
        };
        
        for (const [key, icon] of Object.entries(iconMap)) {
            if (action.includes(key)) return icon;
        }
        
        return 'cog';
    }

    formatActivityText(activity) {
        if (activity.username) {
            return `${activity.username}: ${activity.action}`;
        }
        return activity.action;
    }

    async loadCommissions() {
        try {
            const commissions = await this.apiCall('/api/commissions');
            this.displayCommissions(commissions);
        } catch (error) {
            console.error('Failed to load commissions:', error);
            this.showNotification('Failed to load commissions', 'error');
        }
    }

    displayCommissions(commissions) {
        const tableBody = document.getElementById('commissionsTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = commissions.map(commission => `
            <tr>
                <td>${commission.id}</td>
                <td>${commission.name}</td>
                <td>${commission.email}</td>
                <td>${commission.service}</td>
                <td>${commission.budget}</td>
                <td><span class="status status-${commission.status?.toLowerCase() || 'pending'}">${commission.status || 'Pending'}</span></td>
                <td class="actions">
                    <button class="btn-action" data-id="${commission.id}" data-action="view"><i class="fas fa-eye"></i></button>
                    <button class="btn-action" data-id="${commission.id}" data-action="approve"><i class="fas fa-check"></i></button>
                    <button class="btn-action" data-id="${commission.id}" data-action="reject"><i class="fas fa-times"></i></button>
                </td>
            </tr>
        `).join('');
    }

    setupCommissionsEventListeners() {
        const searchInput = document.getElementById('commissionSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const tableRows = document.querySelectorAll('#commissionsTableBody tr');
                tableRows.forEach(row => {
                    const commissionId = row.cells[0].textContent.toLowerCase();
                    if (commissionId.includes(searchTerm)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
        }
    }
}

// Real-time functionality extension
class RealTimeAdminExtension {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.socket = null;
        this.isConnected = false;
        this.realTimeData = {
            activeVisitors: 0,
            authenticatedUsers: 0,
            recentVisitors: [],
            userActions: []
        };
    }

    initialize() {
        if (typeof io === 'undefined') {
            console.warn('Socket.IO not loaded, real-time features disabled');
            return;
        }

        try {
            this.socket = io();
            this.setupSocketListeners();
        } catch (error) {
            console.error('Failed to initialize real-time connection:', error);
        }
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Admin real-time connection established');
            this.isConnected = true;
            
            // Join admin room
            this.socket.emit('admin-connect', {
                timestamp: new Date().toISOString()
            });
            
            this.updateConnectionStatus(true);
        });

        this.socket.on('disconnect', () => {
            console.log('Admin real-time connection lost');
            this.isConnected = false;
            this.updateConnectionStatus(false);
        });

        // Listen for visitor activity
        this.socket.on('visitor-activity', (data) => {
            this.handleVisitorActivity(data);
        });

        // Listen for user activity
        this.socket.on('user-activity', (data) => {
            this.handleUserActivity(data);
        });

        // Listen for user login/logout events
        this.socket.on('user-login', (data) => {
            this.handleUserLogin(data);
        });

        this.socket.on('user-logout', (data) => {
            this.handleUserLogout(data);
        });

        this.socket.on('user-authenticated', (data) => {
            this.realTimeData.authenticatedUsers++;
            this.updateLiveStats();
        });

        this.socket.on('user-disconnected', (data) => {
            this.realTimeData.authenticatedUsers = Math.max(0, this.realTimeData.authenticatedUsers - 1);
            this.updateLiveStats();
        });
    }

    handleVisitorActivity(data) {
        this.realTimeData.activeVisitors++;
        
        // Add to recent visitors
        const visitor = {
            id: data.visitor.socketId,
            page: data.visitor.page,
            timestamp: data.timestamp,
            userId: data.visitor.userId,
            ipAddress: this.maskIP(data.visitor.ipAddress),
            userAgent: data.visitor.userAgent
        };
        
        this.realTimeData.recentVisitors.unshift(visitor);
        if (this.realTimeData.recentVisitors.length > 100) {
            this.realTimeData.recentVisitors.pop();
        }
        
        this.updateLiveStats();
        this.updateVisitorFeed();
        
        // Show notification
        this.dashboard.showNotification(
            `New visitor on ${data.visitor.page}`,
            'info'
        );
    }

    handleUserActivity(data) {
        const action = {
            action: data.action.action,
            target: data.action.target,
            value: data.action.value,
            page: data.action.page,
            userId: data.action.userId,
            timestamp: data.timestamp
        };
        
        this.realTimeData.userActions.unshift(action);
        if (this.realTimeData.userActions.length > 100) {
            this.realTimeData.userActions.pop();
        }
        
        this.updateUserActionsFeed();
    }

    handleUserLogin(data) {
        this.realTimeData.authenticatedUsers++;
        this.updateLiveStats();
        
        this.dashboard.showNotification(
            `User ${data.user.name} logged in`,
            'success'
        );
    }

    handleUserLogout(data) {
        this.realTimeData.authenticatedUsers = Math.max(0, this.realTimeData.authenticatedUsers - 1);
        this.updateLiveStats();
    }

    updateLiveStats() {
        // Update live visitor count
        const liveVisitorsElement = document.getElementById('liveVisitors');
        if (liveVisitorsElement) {
            liveVisitorsElement.textContent = this.realTimeData.activeVisitors;
        }

        // Update authenticated users count
        const authUsersElement = document.getElementById('authenticatedUsers');
        if (authUsersElement) {
            authUsersElement.textContent = this.realTimeData.authenticatedUsers;
        }
    }

    updateVisitorFeed() {
        const feedElement = document.getElementById('recentActivity');
        if (!feedElement) return;

        const recentVisitors = this.realTimeData.recentVisitors.slice(0, 10);
        
        feedElement.innerHTML = recentVisitors.map(visitor => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-eye"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">
                        Visitor on ${visitor.page}
                        ${visitor.userId ? '<i class="fas fa-user-check" title="Authenticated"></i>' : ''}
                    </div>
                    <div class="activity-time">${this.formatTimeAgo(visitor.timestamp)}</div>
                    <div class="activity-details">
                        <small>${visitor.ipAddress} - ${this.getBrowserInfo(visitor.userAgent)}</small>
                    </div>
                </div>
            </div>
        `).join('');

        if (recentVisitors.length === 0) {
            feedElement.innerHTML = `
                <div class="activity-item">
                    <div class="activity-content">
                        <div class="activity-text">Waiting for visitor activity...</div>
                    </div>
                </div>
            `;
        }
    }

    updateUserActionsFeed() {
        // This could be displayed in a separate section if needed
        console.log('Recent user actions:', this.realTimeData.userActions.slice(0, 5));
    }

    updateConnectionStatus(connected) {
        const statusElements = document.querySelectorAll('.connection-status');
        statusElements.forEach(element => {
            element.textContent = connected ? 'Connected' : 'Disconnected';
            element.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
        });
    }

    // Utility methods
    maskIP(ip) {
        if (!ip) return 'Unknown';
        const parts = ip.split('.');
        if (parts.length === 4) {
            return `${parts[0]}.${parts[1]}.***.**`;
        }
        return ip.substring(0, 8) + '***';
    }

    getBrowserInfo(userAgent) {
        if (!userAgent) return 'Unknown';
        
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        if (userAgent.includes('Opera')) return 'Opera';
        
        return 'Other';
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        
        if (diffSecs < 60) {
            return diffSecs <= 5 ? 'Just now' : `${diffSecs}s ago`;
        } else if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else {
            return time.toLocaleDateString();
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
    
    // Initialize real-time features after dashboard is ready
    setTimeout(() => {
        if (window.adminDashboard.isAuthenticated) {
            const realTimeExtension = new RealTimeAdminExtension(window.adminDashboard);
            realTimeExtension.initialize();
            window.realTimeExtension = realTimeExtension;
        }
    }, 2000);
});

// Back to top button
const backToTopButton = document.getElementById("back-to-top-btn");

window.onscroll = function() {
    scrollFunction();
};

function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backToTopButton.style.display = "block";
    } else {
        backToTopButton.style.display = "none";
    }
}

backToTopButton.addEventListener("click", backToTop);

function backToTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}
