// Main Application Controller
class MillenniumERP {
    constructor() {
        this.currentUser = null;
        this.activeTab = 'dashboard';
        this.pamirImport = null;
        this.quoteBuilder = null;
        this.stockSelector = null;
        this.formulaEngine = null;
        this.apiBaseUrl = 'https://cloud-mroofing.co.za/api';
        
        this.init();
    }

    async init() {
        try {
            await this.loadCurrentUser();
            this.setupEventListeners();
            this.loadDashboardData();
            this.initializeComponents();
        } catch (error) {
            console.error('Application initialization failed:', error);
            this.showAlert('Failed to initialize application. Please refresh the page.', 'danger');
        }
    }

    async loadCurrentUser() {
        try {
            // In a real implementation, this would call the existing .NET API
            const response = await fetch(`${this.apiBaseUrl}/user/current`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const user = await response.json();
                this.currentUser = user;
                document.getElementById('current-user').textContent = user.name || 'Unknown User';
            } else {
                // Fallback for development
                document.getElementById('current-user').textContent = 'Development User';
            }
        } catch (error) {
            console.warn('Could not load user info:', error);
            document.getElementById('current-user').textContent = 'Guest User';
        }
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Global error handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showAlert('An unexpected error occurred. Please try again.', 'danger');
        });
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from all nav items
        document.querySelectorAll('.list-group-item').forEach(item => {
            item.classList.remove('active');
        });

        // Show selected tab
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Add active class to selected nav item
        const navItem = document.querySelector(`[data-tab="${tabName}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }

        this.activeTab = tabName;
        this.loadTabContent(tabName);
    }

    async loadTabContent(tabName) {
        switch (tabName) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'pamir-import':
                if (!this.pamirImport) {
                    this.pamirImport = new PamirImport('pamir-import-content');
                }
                break;
            case 'quote-builder':
                if (!this.quoteBuilder) {
                    this.quoteBuilder = new QuoteBuilder('quote-builder-content');
                }
                break;
            case 'stock-management':
                if (!this.stockSelector) {
                    this.stockSelector = new StockSelector('stock-management-content');
                }
                break;
            case 'formula-engine':
                if (!this.formulaEngine) {
                    this.formulaEngine = new FormulaEngine('formula-engine-content');
                }
                break;
        }
    }

    async loadDashboardData() {
        try {
            // Load dashboard statistics
            const dashboardData = await this.fetchDashboardStats();
            
            document.getElementById('active-quotes').textContent = dashboardData.activeQuotes || 0;
            document.getElementById('pending-orders').textContent = dashboardData.pendingOrders || 0;
            document.getElementById('low-stock-items').textContent = dashboardData.lowStockItems || 0;
            document.getElementById('pamir-imports').textContent = dashboardData.pamirImportsToday || 0;
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            // Set default values on error
            document.getElementById('active-quotes').textContent = '-';
            document.getElementById('pending-orders').textContent = '-';
            document.getElementById('low-stock-items').textContent = '-';
            document.getElementById('pamir-imports').textContent = '-';
        }
    }

    async fetchDashboardStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/dashboard/stats`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.warn('Using fallback dashboard data:', error);
            // Return empty stats that will show as 0
            return {
                activeQuotes: 0,
                pendingOrders: 0,
                lowStockItems: 0,
                pamirImportsToday: 0
            };
        }
    }

    initializeComponents() {
        // Initialize components that might be needed immediately
        this.pamirImport = new PamirImport('pamir-import-content');
    }

    showAlert(message, type = 'info') {
        // Create bootstrap alert
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="fas fa-${this.getAlertIcon(type)}"></i> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        // Insert at top of current tab content
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            activeTab.insertAdjacentHTML('afterbegin', alertHtml);
            
            // Auto-remove after 5 seconds for non-error alerts
            if (type !== 'danger') {
                setTimeout(() => {
                    const alert = activeTab.querySelector('.alert');
                    if (alert) {
                        const bsAlert = new bootstrap.Alert(alert);
                        bsAlert.close();
                    }
                }, 5000);
            }
        }
    }

    getAlertIcon(type) {
        const icons = {
            'success': 'check-circle',
            'danger': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    showLoading(show = true) {
        const modal = document.getElementById('loadingModal');
        const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
        
        if (show) {
            bsModal.show();
        } else {
            bsModal.hide();
        }
    }

    // Utility method for making authenticated API calls
    async apiCall(endpoint, options = {}) {
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
            ...defaultOptions,
            ...options
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MillenniumERP();
});

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.app) {
        window.app.showAlert('A system error occurred. Please refresh the page if problems persist.', 'danger');
    }
});
