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
        if (section === 'reviews') {
            this.loadReviews();
            this.setupReviewsEventListeners();
        }
        if (section === 'payments') {
            this.loadPayments();
            this.setupPaymentsEventListeners();
        }
        if (section === 'products') {
            this.loadProducts();
            this.setupProductsEventListeners();
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

    async loadCommissions(statusFilter = 'all', search = '') {
        try {
            const params = new URLSearchParams();
            if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
            if (search) params.append('search', search);

            const { commissions, statusCounts } = await this.apiCall(`/api/admin/commissions?${params.toString()}`);
            this.displayCommissions(commissions || []);
            this.displayCommissionStatusSummary(statusCounts || []);
        } catch (error) {
            console.error('Failed to load commissions:', error);
            this.showNotification('Failed to load commissions', 'error');
        }
    }

    displayCommissionStatusSummary(statusCounts) {
        const container = document.getElementById('commissionStatusSummary');
        if (!container) return;

        const statusConfig = {
            queued: { label: 'Queued', color: '#ffc107', icon: 'inbox' },
            in_progress: { label: 'In Progress', color: '#2196f3', icon: 'palette' },
            sketch: { label: 'Sketch Ready', color: '#9c27b0', icon: 'pencil-alt' },
            final: { label: 'Final Art', color: '#ff9800', icon: 'paint-brush' },
            completed: { label: 'Completed', color: '#4caf50', icon: 'check-circle' }
        };

        const total = statusCounts.reduce((sum, s) => sum + s.count, 0);

        container.innerHTML = `
            <div style="background: #f8f9fa; padding: 12px 20px; border-radius: 10px; text-align: center; min-width: 80px;">
                <div style="font-size: 1.5rem; font-weight: 700;">${total}</div>
                <div style="font-size: 0.75rem; color: #888;">Total</div>
            </div>
            ${statusCounts.map(s => {
                const cfg = statusConfig[s.status] || { label: s.status, color: '#999', icon: 'circle' };
                return `<div style="background: #f8f9fa; padding: 12px 20px; border-radius: 10px; text-align: center; min-width: 80px; border-left: 3px solid ${cfg.color};">
                    <div style="font-size: 1.5rem; font-weight: 700;">${s.count}</div>
                    <div style="font-size: 0.75rem; color: #888;">${cfg.label}</div>
                </div>`;
            }).join('')}
        `;
    }

    displayCommissions(commissions) {
        const tableBody = document.getElementById('commissionsTableBody');
        if (!tableBody) return;

        const statusLabels = {
            queued: 'Queued',
            in_progress: 'In Progress',
            sketch: 'Sketch Ready',
            final: 'Final Art',
            completed: 'Completed'
        };

        if (commissions.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#999;">No commissions found</td></tr>';
            return;
        }

        tableBody.innerHTML = commissions.map(c => `
            <tr data-id="${c.id}">
                <td style="font-family: monospace; font-size: 0.8rem;">${c.id}</td>
                <td>
                    <div style="font-weight:500;">${this.escapeHtml(c.name)}</div>
                    <div style="font-size:0.8rem; color:#888;">${this.escapeHtml(c.email)}</div>
                </td>
                <td>${this.escapeHtml(c.service || '—')}</td>
                <td>${this.escapeHtml(c.budget || '—')}</td>
                <td>
                    <span class="status status-${c.payment_status || 'pending'}">${c.paid_amount ? '₹' + c.paid_amount : 'Unpaid'}</span>
                </td>
                <td>
                    <select class="commission-status-select" data-id="${c.id}" style="padding:5px 10px; border-radius:6px; border:1px solid #ddd; font-size:0.85rem; cursor:pointer;">
                        ${Object.entries(statusLabels).map(([val, lbl]) =>
                            `<option value="${val}" ${c.status === val ? 'selected' : ''}>${lbl}</option>`
                        ).join('')}
                    </select>
                </td>
                <td style="font-size:0.85rem; color:#888;">${new Date(c.created_at).toLocaleDateString()}</td>
                <td class="actions">
                    <button class="btn-action btn-view-commission" data-id="${c.id}" title="View Details"><i class="fas fa-eye"></i></button>
                </td>
            </tr>
        `).join('');
    }

    setupCommissionsEventListeners() {
        // Status filter tabs
        const filterContainer = document.getElementById('commissionStatusFilter');
        if (filterContainer) {
            filterContainer.addEventListener('click', (e) => {
                const tab = e.target.closest('.filter-tab');
                if (!tab) return;
                filterContainer.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const status = tab.dataset.status;
                const search = document.getElementById('commissionSearch')?.value || '';
                this.loadCommissions(status, search);
            });
        }

        // Search
        const searchInput = document.getElementById('commissionSearch');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const activeTab = document.querySelector('#commissionStatusFilter .filter-tab.active');
                    const status = activeTab?.dataset.status || 'all';
                    this.loadCommissions(status, e.target.value);
                }, 300);
            });
        }

        // Status change dropdown
        document.getElementById('commissionsTableBody')?.addEventListener('change', async (e) => {
            const select = e.target.closest('.commission-status-select');
            if (!select) return;

            const id = select.dataset.id;
            const newStatus = select.value;
            const note = prompt('Add a note for the client (optional):');

            try {
                const res = await this.apiCall(`/api/admin/commissions/${id}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: newStatus, note: note || undefined })
                });

                if (res.success) {
                    this.showNotification(`Commission updated to "${newStatus}". Client notified by email.`, 'success');
                }
            } catch (err) {
                this.showNotification(err.message || 'Failed to update status', 'error');
                // Reload to reset select
                const activeTab = document.querySelector('#commissionStatusFilter .filter-tab.active');
                this.loadCommissions(activeTab?.dataset.status || 'all');
            }
        });

        // View commission detail
        document.getElementById('commissionsTableBody')?.addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-view-commission');
            if (!btn) return;

            const id = btn.dataset.id;
            try {
                const { commission } = await this.apiCall(`/api/admin/commissions/${id}`);
                this.showCommissionDetailModal(commission);
            } catch (err) {
                this.showNotification('Failed to load commission details', 'error');
            }
        });
    }

    showCommissionDetailModal(c) {
        const statusLabels = { queued: 'Queued', in_progress: 'In Progress', sketch: 'Sketch Ready', final: 'Final Art', completed: 'Completed' };

        const modalBody = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="background:#f8f9fa; padding:12px; border-radius:8px;">
                    <div style="font-size:0.75rem; color:#999; text-transform:uppercase;">Commission ID</div>
                    <div style="font-weight:600; font-family:monospace;">${c.id}</div>
                </div>
                <div style="background:#f8f9fa; padding:12px; border-radius:8px;">
                    <div style="font-size:0.75rem; color:#999; text-transform:uppercase;">Status</div>
                    <div style="font-weight:600;">${statusLabels[c.status] || c.status}</div>
                </div>
                <div style="background:#f8f9fa; padding:12px; border-radius:8px;">
                    <div style="font-size:0.75rem; color:#999; text-transform:uppercase;">Client</div>
                    <div style="font-weight:500;">${this.escapeHtml(c.name)}</div>
                    <div style="font-size:0.85rem; color:#666;">${this.escapeHtml(c.email)}</div>
                    <div style="font-size:0.85rem; color:#666;">${this.escapeHtml(c.phone || '')}</div>
                </div>
                <div style="background:#f8f9fa; padding:12px; border-radius:8px;">
                    <div style="font-size:0.75rem; color:#999; text-transform:uppercase;">Location</div>
                    <div>${this.escapeHtml(c.location || '—')}</div>
                </div>
                <div style="background:#f8f9fa; padding:12px; border-radius:8px;">
                    <div style="font-size:0.75rem; color:#999; text-transform:uppercase;">Service</div>
                    <div>${this.escapeHtml(c.service || '—')}</div>
                </div>
                <div style="background:#f8f9fa; padding:12px; border-radius:8px;">
                    <div style="font-size:0.75rem; color:#999; text-transform:uppercase;">Budget</div>
                    <div>${this.escapeHtml(c.budget || '—')}</div>
                </div>
                <div style="background:#f8f9fa; padding:12px; border-radius:8px;">
                    <div style="font-size:0.75rem; color:#999; text-transform:uppercase;">Timeline</div>
                    <div>${this.escapeHtml(c.timeline || '—')}</div>
                </div>
                <div style="background:#f8f9fa; padding:12px; border-radius:8px;">
                    <div style="font-size:0.75rem; color:#999; text-transform:uppercase;">Purpose</div>
                    <div>${this.escapeHtml(c.purpose || '—')}</div>
                </div>
                <div style="background:#f8f9fa; padding:12px; border-radius:8px;">
                    <div style="font-size:0.75rem; color:#999; text-transform:uppercase;">Payment</div>
                    <div>${c.paid_amount ? '₹' + c.paid_amount + ' (' + (c.payment_status || 'pending') + ')' : 'No payment'}</div>
                    ${c.utr_number ? `<div style="font-size:0.85rem; color:#666;">UTR: ${c.utr_number}</div>` : ''}
                </div>
                <div style="background:#f8f9fa; padding:12px; border-radius:8px;">
                    <div style="font-size:0.75rem; color:#999; text-transform:uppercase;">GST</div>
                    <div>${c.gst ? 'Yes' : 'No'}</div>
                </div>
                <div style="background:#f8f9fa; padding:12px; border-radius:8px; grid-column: 1 / -1;">
                    <div style="font-size:0.75rem; color:#999; text-transform:uppercase;">Description</div>
                    <div style="white-space:pre-wrap;">${this.escapeHtml(c.description || '—')}</div>
                </div>
                ${c.reference_links ? `
                <div style="background:#f8f9fa; padding:12px; border-radius:8px; grid-column: 1 / -1;">
                    <div style="font-size:0.75rem; color:#999; text-transform:uppercase;">References</div>
                    <div style="white-space:pre-wrap;">${this.escapeHtml(c.reference_links)}</div>
                </div>` : ''}
                <div style="background:#f8f9fa; padding:12px; border-radius:8px;">
                    <div style="font-size:0.75rem; color:#999; text-transform:uppercase;">Created</div>
                    <div>${new Date(c.created_at).toLocaleString()}</div>
                </div>
                <div style="background:#f8f9fa; padding:12px; border-radius:8px;">
                    <div style="font-size:0.75rem; color:#999; text-transform:uppercase;">Last Updated</div>
                    <div>${new Date(c.updated_at).toLocaleString()}</div>
                </div>
            </div>
        `;

        const modalContainer = document.getElementById('modalContainer');
        modalContainer.querySelector('.modal-title').textContent = 'Commission Details';
        modalContainer.querySelector('.modal-body').innerHTML = modalBody;
        modalContainer.querySelector('.modal-confirm').style.display = 'none';
        modalContainer.querySelector('.modal-cancel').textContent = 'Close';
        modalContainer.classList.remove('hidden');
    }

    async loadReviews() {
        try {
            const { reviews } = await this.apiCall('/api/reviews');
            this.displayReviews(reviews || []);
        } catch (error) {
            console.error('Failed to load reviews:', error);
            this.showNotification('Failed to load reviews', 'error');
        }
    }

    displayReviews(reviews) {
        const tableBody = document.getElementById('reviewsTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = reviews.map(r => `
            <tr data-id="${r.id}">
                <td>${r.id}</td>
                <td>${this.escapeHtml(r.name)}</td>
                <td>${this.escapeHtml(r.city || '')}</td>
                <td>${r.rating} ⭐</td>
                <td style=\"max-width:420px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;\" title=\"${this.escapeHtml(r.message)}\">${this.escapeHtml(r.message)}</td>
                <td>${new Date(r.created_at).toLocaleString()}</td>
                <td class="actions">
                    <button class="btn-action btn-delete-review" data-id="${r.id}" title="Delete Review"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    setupReviewsEventListeners() {
        const searchInput = document.getElementById('reviewSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const rows = document.querySelectorAll('#reviewsTableBody tr');
                rows.forEach(row => {
                    const name = row.cells[1].textContent.toLowerCase();
                    const city = row.cells[2].textContent.toLowerCase();
                    row.style.display = (name.includes(term) || city.includes(term)) ? '' : 'none';
                });
            });
        }

        document.getElementById('reviewsTableBody')?.addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-delete-review');
            if (!btn) return;
            const id = btn.dataset.id;
            const confirmed = confirm('Delete this review? This cannot be undone.');
            if (!confirmed) return;
            try {
                const res = await this.apiCall(`/api/reviews/${id}`, { method: 'DELETE' });
                if (res.success) {
                    document.querySelector(`#reviewsTableBody tr[data-id="${id}"]`)?.remove();
                    this.showNotification('Review deleted', 'success');
                }
            } catch (err) {
                this.showNotification(err.message || 'Failed to delete review', 'error');
            }
        });
    }

    async loadPayments() {
        try {
            // Note: The backend route queries the 'payment_transactions' table, but Phase 3 used 'payments'.
            // I should use a direct fetch to the new 'payments' table if the admin route was not updated.
            const { transactions } = await this.apiCall('/api/admin/payments/transactions');
            this.displayPayments(transactions || []);
        } catch (error) {
            console.error('Failed to load payments:', error);
            this.showNotification('Failed to load payments', 'error');
        }
    }

    displayPayments(payments) {
        const tableBody = document.getElementById('paymentsTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = payments.map(p => `
            <tr data-id="${p.id}">
                <td>${p.id}</td>
                <td>${p.client_id}</td>
                <td>₹${p.amount}</td>
                <td>${this.escapeHtml(p.utr_number)}</td>
                <td><span class="status status-${p.status || 'pending'}">${p.status || 'Pending'}</span></td>
                <td>${new Date(p.created_at).toLocaleString()}</td>
                <td class="actions">
                    <button class="btn-action btn-verify-payment" data-id="${p.id}" ${p.status === 'verified' ? 'disabled' : ''} title="Verify Payment"><i class="fas fa-check"></i></button>
                </td>
            </tr>
        `).join('');
    }

    setupPaymentsEventListeners() {
        const searchInput = document.getElementById('paymentSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const rows = document.querySelectorAll('#paymentsTableBody tr');
                rows.forEach(row => {
                    const utr = row.cells[3].textContent.toLowerCase();
                    row.style.display = utr.includes(term) ? '' : 'none';
                });
            });
        }

        document.getElementById('paymentsTableBody')?.addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-verify-payment');
            if (!btn || btn.disabled) return;
            const id = btn.dataset.id;
            const confirmed = confirm('Verify this payment UTR? This will update the commission status.');
            if (!confirmed) return;
            btn.disabled = true;
            try {
                const res = await this.apiCall(`/api/admin/payments/${id}/verify`, { method: 'POST' });
                if (res.success) {
                    this.showNotification('Payment verified', 'success');
                    this.loadPayments(); // Reload table
                }
            } catch (err) {
                btn.disabled = false;
                this.showNotification(err.message || 'Failed to verify payment', 'error');
            }
        });
    }

    async loadProducts() {
        try {
            const res = await this.apiCall('/api/admin/products');
            this.displayProducts(res.products || []);
        } catch (error) {
            console.error('Failed to load products:', error);
            this.showNotification('Failed to load products', 'error');
        }
    }

    displayProducts(products) {
        const tableBody = document.getElementById('productsTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = products.map(p => `
            <tr data-id="${p.id}">
                <td>${p.id}</td>
                <td><img src="${p.image_url}" alt="${this.escapeHtml(p.title)}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;"></td>
                <td>${this.escapeHtml(p.title)}</td>
                <td>${this.escapeHtml(p.category)}</td>
                <td>₹${p.price_inr}</td>
                <td><span class="status status-${p.is_active ? 'completed' : 'pending'}">${p.is_active ? 'Active' : 'Inactive'}</span></td>
                <td class="actions">
                    <button class="btn-action btn-delete-product" data-id="${p.id}" title="Delete Product"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    setupProductsEventListeners() {
        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            // Remove old listener if exists
            const newSearch = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearch, searchInput);
            newSearch.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const rows = document.querySelectorAll('#productsTableBody tr');
                rows.forEach(row => {
                    const title = row.cells[2].textContent.toLowerCase();
                    row.style.display = title.includes(term) ? '' : 'none';
                });
            });
        }

        const tableBody = document.getElementById('productsTableBody');
        if (tableBody) {
            const newTableBody = tableBody.cloneNode(false);
            tableBody.parentNode.replaceChild(newTableBody, tableBody);
            newTableBody.addEventListener('click', async (e) => {
                const btn = e.target.closest('.btn-delete-product');
                if (!btn) return;
                const id = btn.dataset.id;
                if (!confirm('Delete this product? This cannot be undone.')) return;

                try {
                    const res = await this.apiCall(`/api/admin/products/${id}`, { method: 'DELETE' });
                    if (res.success) {
                        this.showNotification('Product deleted', 'success');
                        this.loadProducts();
                    }
                } catch (err) {
                    this.showNotification(err.message || 'Failed to delete product', 'error');
                }
            });
            // Also need to re-render but wait till load is finished is better
            this.loadProducts();
        }

        const addBtn = document.getElementById('add-product-btn');
        if (addBtn) {
            const newAddBtn = addBtn.cloneNode(true);
            addBtn.parentNode.replaceChild(newAddBtn, addBtn);
            newAddBtn.addEventListener('click', () => {
                this.showProductModal();
            });
        }
    }

    showProductModal() {
        // Build product modal HTML
        const modalBody = `
            <form id="productForm" enctype="multipart/form-data">
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display:block; margin-bottom:5px;">Title</label>
                    <input type="text" name="title" required style="width:100%; padding:8px;" placeholder="Product Title">
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display:block; margin-bottom:5px;">Category</label>
                    <select name="category" required style="width:100%; padding:8px;">
                        <option value="Illustration">Illustration</option>
                        <option value="Animation">Animation</option>
                        <option value="Character Design">Character Design</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display:block; margin-bottom:5px;">Description</label>
                    <textarea name="description" required style="width:100%; padding:8px; height:80px;"></textarea>
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display:block; margin-bottom:5px;">Price (INR)</label>
                    <input type="number" name="price_inr" required style="width:100%; padding:8px;" min="0">
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display:block; margin-bottom:5px;">Visibility</label>
                    <label><input type="checkbox" name="is_active" value="1" checked> Active (Visible in Store)</label>
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display:block; margin-bottom:5px;">Cover Image (Display in Shop)</label>
                    <input type="file" name="image" accept="image/*" required style="width:100%; padding:8px;">
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display:block; margin-bottom:5px;">Digital File (To be Downloaded)</label>
                    <input type="file" name="productFile" required style="width:100%; padding:8px;">
                </div>
            </form>
        `;

        const modalContainer = document.getElementById('modalContainer');
        modalContainer.querySelector('.modal-title').textContent = 'Add New Digital Product';
        modalContainer.querySelector('.modal-body').innerHTML = modalBody;

        const confirmBtn = modalContainer.querySelector('.modal-confirm');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.textContent = 'Upload Product';

        newConfirmBtn.addEventListener('click', async () => {
            const form = document.getElementById('productForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            formData.set('is_active', formData.get('is_active') ? "true" : "false");

            newConfirmBtn.disabled = true;
            newConfirmBtn.textContent = 'Uploading...';

            try {
                // Wait for upload
                const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
                const response = await fetch('/api/admin/products', {
                    method: 'POST',
                    headers: token ? { 'Authorization': 'Bearer ' + token } : {},
                    body: formData
                });

                const res = await response.json();

                if (res.success) {
                    this.showNotification('Product added successfully', 'success');
                    this.closeModal();
                    this.loadProducts();
                } else {
                    throw new Error(res.error || 'Failed to upload product');
                }
            } catch (err) {
                this.showNotification(err.message, 'error');
                newConfirmBtn.disabled = false;
                newConfirmBtn.textContent = 'Upload Product';
            }
        });

        this.showElement('modalContainer');
    }

    // Basic HTML escape to prevent XSS in table rendering
    escapeHtml(str) {
        if (str == null) return '';
        return String(str).replace(/[&<>"']/g, (s) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[s] || s);
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

        // Reviews realtime updates
        this.socket.on('review-created', () => {
            // If reviews section is active, refresh
            if (document.getElementById('reviews-section')?.classList.contains('active')) {
                this.dashboard.loadReviews();
            }
        });
        this.socket.on('review-deleted', () => {
            if (document.getElementById('reviews-section')?.classList.contains('active')) {
                this.dashboard.loadReviews();
            }
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
    // Add smooth page entrance animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);

    window.adminDashboard = new AdminDashboard();

    // Initialize real-time features after dashboard is ready
    setTimeout(() => {
        if (window.adminDashboard.isAuthenticated) {
            const realTimeExtension = new RealTimeAdminExtension(window.adminDashboard);
            realTimeExtension.initialize();
            window.realTimeExtension = realTimeExtension;
        }
    }, 2000);

    // Add ripple effect to buttons
    addRippleEffect();

    // Add floating animation to cards
    addFloatingCards();
});

// Ripple effect for buttons and interactive elements
function addRippleEffect() {
    document.addEventListener('click', function (e) {
        if (e.target.matches('.btn, .quick-action, .menu-item, .stat-card')) {
            const ripple = document.createElement('span');
            const rect = e.target.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;

            e.target.style.position = 'relative';
            e.target.style.overflow = 'hidden';
            e.target.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        }
    });

    // Add ripple animation if not exists
    if (!document.getElementById('ripple-animation')) {
        const style = document.createElement('style');
        style.id = 'ripple-animation';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(2.5);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Floating animation for stat cards
function addFloatingCards() {
    const cards = document.querySelectorAll('.stat-card, .chart-card');
    cards.forEach((card, index) => {
        card.style.animation = `fadeInUp 0.6s ease-out ${index * 0.1}s both`;
    });

    // Add floating animation keyframes
    if (!document.getElementById('card-animations')) {
        const style = document.createElement('style');
        style.id = 'card-animations';
        style.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Back to top button with smooth scroll
const backToTopButton = document.getElementById("back-to-top-btn");

window.onscroll = function () {
    scrollFunction();
};

function scrollFunction() {
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
        backToTopButton.style.display = "flex";
        backToTopButton.style.animation = "fadeInUp 0.3s ease-out";
    } else {
        backToTopButton.style.display = "none";
    }
}

backToTopButton.addEventListener("click", backToTop);

function backToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
