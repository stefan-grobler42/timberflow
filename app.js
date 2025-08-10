// Main Application Controller for Modular ERP System
class MillenniumERP {
    constructor() {
        this.currentUser = null;
        this.activeTab = 'my-dashboard';
        this.settingsOpen = false;
        
        // Components
        this.globalSearch = null;
        this.projectManager = null;
        this.pamirImport = null;
        this.quoteBuilder = null;
        this.stockSelector = null;
        this.formulaEngine = null;
        
        // API Configuration
        this.apiBaseUrl = 'https://cloud-mroofing.co.za/api';
        
        // Recent activity tracking
        this.recentItems = [];
        this.pinnedItems = [];
        
        this.init();
    }

    async init() {
        try {
            await this.loadCurrentUser();
            this.setupEventListeners();
            this.initializeGlobalSearch();
            this.loadDashboardData();
            this.loadRecentActivity();
            this.initializeComponents();
        } catch (error) {
            console.error('Application initialization failed:', error);
            this.showAlert('Failed to initialize application. Please refresh the page.', 'danger');
        }
    }

    async loadCurrentUser() {
        try {
            // For development environment, use fallback data
            this.currentUser = {
                id: 'dev-user-1',
                name: 'Development User',
                role: 'Administrator'
            };
            
            const userElement = document.getElementById('current-user');
            if (userElement) {
                userElement.textContent = this.currentUser.name;
            }
            
            // Note: In production, this would connect to cloud-mroofing.co.za API
            console.log('Using development user data');
            
        } catch (error) {
            console.warn('Could not load user info:', error);
            const userElement = document.getElementById('current-user');
            if (userElement) {
                userElement.textContent = 'Guest User';
            }
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

        // Business Central collapsible headers
        this.setupCollapsibleHeaders();

        // Settings panel toggle
        const settingsBtn = document.getElementById('settings-btn');
        const settingsPanel = document.getElementById('settings-panel');
        const closeSettingsBtn = document.getElementById('close-settings');

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.toggleSettings();
            });
        }

        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                this.closeSettings();
            });
        }

        // Global error handler - suppress API connection errors in development
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason?.message?.includes('Failed to fetch') || 
                event.reason?.message?.includes('cloud-mroofing.co.za')) {
                // Suppress API connection errors in development mode
                console.warn('API connection unavailable - using development mode:', event.reason.message);
                event.preventDefault();
                return;
            }
            console.error('Unhandled promise rejection:', event.reason);
            this.showAlert('An unexpected error occurred. Please try again.', 'danger');
        });

        // Pin/unpin functionality
        this.setupPinningEvents();
    }

    initializeGlobalSearch() {
        this.globalSearch = new GlobalSearch();
    }

    setupPinningEvents() {
        // Add pin buttons to navigation items (will be added dynamically)
        document.querySelectorAll('[data-tab]').forEach(item => {
            if (!item.querySelector('.pin-btn')) {
                const pinBtn = document.createElement('button');
                pinBtn.className = 'btn btn-sm btn-link pin-btn ms-auto';
                pinBtn.innerHTML = '<i class="fas fa-thumbtack"></i>';
                pinBtn.style.cssText = 'opacity: 0; transition: opacity 0.2s;';
                pinBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.togglePin(item.getAttribute('data-tab'));
                });
                
                item.style.position = 'relative';
                item.appendChild(pinBtn);
                
                // Show pin button on hover
                item.addEventListener('mouseenter', () => {
                    pinBtn.style.opacity = '0.6';
                });
                item.addEventListener('mouseleave', () => {
                    pinBtn.style.opacity = '0';
                });
            }
        });
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from all nav items
        document.querySelectorAll('[data-tab]').forEach(item => {
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
        
        // Track recent activity
        this.addToRecentActivity(tabName);
        
        this.loadTabContent(tabName);
    }

    toggleSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        const mainContent = settingsPanel.previousElementSibling;
        
        if (this.settingsOpen) {
            this.closeSettings();
        } else {
            this.openSettings();
        }
    }

    openSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        const mainContent = settingsPanel.previousElementSibling;
        
        settingsPanel.style.display = 'block';
        mainContent.classList.remove('col-md-6', 'col-lg-7', 'col-xl-8');
        mainContent.classList.add('col-md-6', 'col-lg-6', 'col-xl-7');
        
        this.settingsOpen = true;
    }

    closeSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        const mainContent = settingsPanel.previousElementSibling;
        
        settingsPanel.style.display = 'none';
        mainContent.classList.remove('col-md-6', 'col-lg-6', 'col-xl-7');
        mainContent.classList.add('col-md-6', 'col-lg-7', 'col-xl-8');
        
        this.settingsOpen = false;
    }

    setupCollapsibleHeaders() {
        // Handle collapsible header click events for Business Central styling
        document.querySelectorAll('.bc-collapsible-header').forEach(header => {
            header.addEventListener('click', (e) => {
                // Bootstrap handles the collapse, we just need to update the icon
                setTimeout(() => {
                    const isExpanded = header.getAttribute('aria-expanded') === 'true';
                    const icon = header.querySelector('.bc-collapse-icon');
                    if (icon) {
                        if (isExpanded) {
                            icon.style.transform = 'rotate(0deg)';
                        } else {
                            icon.style.transform = 'rotate(-90deg)';
                        }
                    }
                }, 150); // Small delay to let Bootstrap update aria-expanded
            });
        });
    }

    togglePin(tabName) {
        const index = this.pinnedItems.findIndex(item => item.tab === tabName);
        
        if (index > -1) {
            this.pinnedItems.splice(index, 1);
        } else {
            const navItem = document.querySelector(`[data-tab="${tabName}"]`);
            if (navItem) {
                const icon = navItem.querySelector('i').className;
                const text = navItem.textContent.trim();
                
                this.pinnedItems.push({
                    tab: tabName,
                    icon: icon,
                    text: text,
                    timestamp: new Date()
                });
            }
        }
        
        this.updatePinnedItems();
        this.savePinnedItems();
    }

    updatePinnedItems() {
        const pinnedContainer = document.getElementById('pinned-items');
        
        if (this.pinnedItems.length === 0) {
            pinnedContainer.innerHTML = '<div class="text-center text-muted p-2 small">No pinned items</div>';
            return;
        }

        const html = this.pinnedItems.map(item => `
            <a href="#${item.tab}" class="list-group-item list-group-item-action border-0 py-2" data-tab="${item.tab}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="${item.icon} me-2"></i>
                        <span class="small">${item.text}</span>
                    </div>
                    <button class="btn btn-sm btn-link text-muted unpin-btn" data-tab="${item.tab}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </a>
        `).join('');

        pinnedContainer.innerHTML = html;

        // Add event listeners for pinned items
        pinnedContainer.querySelectorAll('[data-tab]').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.unpin-btn')) {
                    e.preventDefault();
                    this.switchTab(item.getAttribute('data-tab'));
                }
            });
        });

        pinnedContainer.querySelectorAll('.unpin-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.togglePin(btn.getAttribute('data-tab'));
            });
        });
    }

    addToRecentActivity(tabName) {
        this.recentItems = this.recentItems.filter(item => item.tab !== tabName);
        
        const navItem = document.querySelector(`[data-tab="${tabName}"]`);
        if (navItem) {
            const icon = navItem.querySelector('i').className;
            const text = navItem.textContent.trim();
            
            this.recentItems.unshift({
                tab: tabName,
                icon: icon,
                text: text,
                timestamp: new Date()
            });
        }
        
        // Limit recent items to 3 for Business Central style
        this.recentItems = this.recentItems.slice(0, 3);
        this.updateRecentItems();
        this.saveRecentItems();
    }

    updateRecentItems() {
        const recentContainer = document.getElementById('recent-items');
        
        if (this.recentItems.length === 0) {
            recentContainer.innerHTML = '<div class="text-center text-muted p-2 small">No recent activity</div>';
            return;
        }

        const html = this.recentItems.map(item => `
            <a href="#${item.tab}" class="list-group-item list-group-item-action border-0 py-2" data-tab="${item.tab}">
                <div class="d-flex align-items-center">
                    <i class="${item.icon} me-2"></i>
                    <span class="small">${item.text}</span>
                </div>
            </a>
        `).join('');

        recentContainer.innerHTML = html;

        recentContainer.querySelectorAll('[data-tab]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(item.getAttribute('data-tab'));
            });
        });
    }

    loadRecentActivity() {
        try {
            const saved = localStorage.getItem('millennium-recent-items');
            if (saved) {
                this.recentItems = JSON.parse(saved);
                this.updateRecentItems();
            }
        } catch (error) {
            console.error('Failed to load recent activity:', error);
        }

        try {
            const savedPinned = localStorage.getItem('millennium-pinned-items');
            if (savedPinned) {
                this.pinnedItems = JSON.parse(savedPinned);
                this.updatePinnedItems();
            }
        } catch (error) {
            console.error('Failed to load pinned items:', error);
        }
    }

    saveRecentItems() {
        try {
            localStorage.setItem('millennium-recent-items', JSON.stringify(this.recentItems));
        } catch (error) {
            console.error('Failed to save recent items:', error);
        }
    }

    savePinnedItems() {
        try {
            localStorage.setItem('millennium-pinned-items', JSON.stringify(this.pinnedItems));
        } catch (error) {
            console.error('Failed to save pinned items:', error);
        }
    }

    async loadTabContent(tabName) {
        switch (tabName) {
            case 'my-dashboard':
                await this.loadDashboardData();
                break;
            case 'my-activities':
                await this.loadMyActivities();
                break;
            case 'projects':
                if (!this.projectManager) {
                    this.projectManager = new ProjectManager();
                }
                break;
            case 'pamir-import':
                if (!this.pamirImport) {
                    this.pamirImport = new PamirImport('pamir-import-content');
                }
                break;
            case 'quotes':
            case 'quote-builder':
                if (!this.quoteBuilder) {
                    this.quoteBuilder = new QuoteBuilder('quote-builder-content');
                }
                this.loadQuoteBuilderContext();
                break;
            case 'stock-items':
                if (!this.stockPlaceholder) {
                    this.stockPlaceholder = new StockPlaceholder('stock-items-content');
                }
                break;
            case 'customers':
                // LEGACY: Archived CustomerManager - now using modular system
                // Original code moved to archive/monolith/components/customer-manager.js
                if (!this.customerManager) {
                    console.warn('Legacy CustomerManager accessed - consider using modular system');
                    this.customerManager = new CustomerManager('customers-content');
                }
                break;
            case 'formula-engine':
                if (!this.formulaEngine) {
                    this.formulaEngine = new FormulaEngine('formula-engine-content');
                }
                break;
            case 'customers':
                this.loadCustomerModule();
                break;
            case 'contacts':
                this.loadContactModule();
                break;
            case 'employees':
                this.loadEmployeeModule();
                break;
            case 'tasks':
                this.loadTaskModule();
                break;
            case 'calls':
                this.loadCallModule();
                break;
            case 'emails':
                this.loadEmailModule();
                break;
            case 'meetings':
                this.loadMeetingModule();
                break;
        }
    }

    // Module loading methods for new CRM and employee features
    async loadMyActivities() {
        // Load user's personal activities, tasks, and calendar items
        console.log('Loading My Activities module...');
    }

    loadCustomerModule() {
        console.log('Loading Customer Management module...');
    }

    loadContactModule() {
        console.log('Loading Contact Management module...');
    }

    loadEmployeeModule() {
        console.log('Loading Employee Management module...');
    }

    loadTaskModule() {
        console.log('Loading Task Management module...');
    }

    loadCallModule() {
        console.log('Loading Phone Call Log module...');
    }

    loadEmailModule() {
        console.log('Loading Email Management module...');
    }

    loadMeetingModule() {
        console.log('Loading Meeting Management module...');
    }

    async loadDashboardData() {
        try {
            // Use development data for dashboard - will be replaced with API calls in production
            const dashboardData = {
                activeProjects: 12,
                activeQuotes: 8,
                pendingOrders: 3,
                pamirImportsToday: 2
            };
            
            // Update dashboard cards with safe element access
            this.updateElementText('active-projects', dashboardData.activeProjects);
            this.updateElementText('my-quotes', dashboardData.activeQuotes);
            this.updateElementText('my-tasks', 5); // User-specific tasks
            this.updateElementText('pamir-imports', dashboardData.pamirImportsToday);
            
        } catch (error) {
            console.warn('Dashboard data loading issue:', error);
        }
    }

    updateElementText(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value || 0;
        }
    }

    initializeComponents() {
        // Initialize components that might be needed immediately
        try {
            if (typeof PamirImport !== 'undefined') {
                this.pamirImport = new PamirImport('pamir-import-content');
            }
        } catch (error) {
            console.warn('Some components not available in development mode:', error.message);
        }
    }

    loadQuoteBuilderContext() {
        // Check if we have project context from session storage
        const currentProject = sessionStorage.getItem('currentProject');
        const quoteNumber = sessionStorage.getItem('quoteNumber');
        
        if (currentProject && quoteNumber && this.quoteBuilder) {
            try {
                const project = JSON.parse(currentProject);
                this.quoteBuilder.setProjectContext(project, quoteNumber);
                
                // Clear session storage after use
                sessionStorage.removeItem('currentProject');
                sessionStorage.removeItem('quoteNumber');
            } catch (error) {
                console.error('Failed to load quote builder context:', error);
            }
        }
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
    
    // Initialize systems that load based on defaults
    window.systemDefaults = new SystemDefaults();
    
    // Add modular system entry point
    addModularSystemButton();
});

// Add entry point for modular system
function addModularSystemButton() {
    // Add button to top navigation
    const headerActions = document.querySelector('.d-flex.align-items-center.ms-auto');
    if (headerActions) {
        const modularBtn = document.createElement('button');
        modularBtn.className = 'btn btn-outline-primary me-2';
        modularBtn.innerHTML = '<i class="fas fa-rocket"></i> Modular System';
        modularBtn.onclick = launchModularSystem;
        headerActions.insertBefore(modularBtn, headerActions.firstChild);
    }
    
    // Also add to dashboard
    const dashboardContent = document.getElementById('my-dashboard');
    if (dashboardContent) {
        const existingModularCard = dashboardContent.querySelector('.modular-system-card');
        if (!existingModularCard) {
            const cardContainer = dashboardContent.querySelector('.row .col-md-3:last-child');
            if (cardContainer) {
                cardContainer.insertAdjacentHTML('afterend', `
                    <div class="col-md-3">
                        <div class="card bg-gradient text-white modular-system-card" style="background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);">
                            <div class="card-body">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <h4>NEW</h4>
                                        <p>Modular System</p>
                                    </div>
                                    <i class="fas fa-rocket fa-2x"></i>
                                </div>
                                <button class="btn btn-light btn-sm mt-2" onclick="launchModularSystem()">
                                    <i class="fas fa-play"></i> Launch
                                </button>
                            </div>
                        </div>
                    </div>
                `);
            }
        }
    }
}

// Launch modular system
function launchModularSystem() {
    console.log('Launching Modular System...');
    
    // Health check for platform components
    performPlatformHealthCheck();
    
    // Initialize modular app if not already done
    if (!window.modularApp) {
        if (window.ModularApp) {
            window.modularApp = new window.ModularApp();
        } else {
            console.error('ModularApp not loaded');
            return;
        }
    }
    
    // Show modular system and hide original
    window.modularApp.show();
    
    // Navigate to customers by default
    window.location.hash = '/customers';
}

// Health check for platform components
function performPlatformHealthCheck() {
    const platformComponents = [
        'DataGrid',
        'Form', 
        'Lookup',
        'LocationField',
        'SearchBox'
    ];
    
    const platformServices = [
        'api',
        'db', 
        'defaults'
    ];
    
    let platformOK = true;
    
    // Check platform components
    platformComponents.forEach(component => {
        if (!window[component] && !window.src?.platform?.components?.[component]) {
            console.warn(`Platform component missing: ${component}`);
            platformOK = false;
        }
    });
    
    // Check if modular system files loaded
    const requiredClasses = ['ModularApp', 'Header', 'Sidebar', 'Router'];
    requiredClasses.forEach(cls => {
        if (!window[cls]) {
            console.warn(`Modular system class missing: ${cls}`);
            platformOK = false;
        }
    });
    
    if (platformOK) {
        console.log('✅ Platform OK - All required components available');
    } else {
        console.warn('⚠️ Platform health check failed - Some components missing');
    }
    
    return platformOK;
}

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.app) {
        window.app.showAlert('A system error occurred. Please refresh the page if problems persist.', 'danger');
    }
});
