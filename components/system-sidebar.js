// System Sidebar - Restores Original Business Central Layout
class SystemSidebar {
    constructor() {
        this.pinnedItems = [];
        this.recentItems = [];
        this.currentModule = 'my-dashboard';
        this.init();
    }

    init() {
        this.loadSidebarState();
        this.render();
        this.setupEventListeners();
    }

    loadSidebarState() {
        const sidebarState = localStorage.getItem('millennium-sidebar-state');
        if (sidebarState) {
            const state = JSON.parse(sidebarState);
            this.pinnedItems = state.pinnedItems || [];
            this.recentItems = state.recentItems || [];
        }
    }

    saveSidebarState() {
        const state = {
            pinnedItems: this.pinnedItems,
            recentItems: this.recentItems
        };
        localStorage.setItem('millennium-sidebar-state', JSON.stringify(state));
    }

    render() {
        const container = document.getElementById('sidebar-container');
        if (!container) return;

        container.innerHTML = `
            <div class="sidebar-container">
                <!-- Pinned Section -->
                <div class="card mb-3 bc-card">
                    <div class="card-header bg-light bc-collapsible-header" data-bs-toggle="collapse" data-bs-target="#pinnedCollapse" role="button" style="background: linear-gradient(135deg, #E6E6E6 0%, #b3b3b3 100%) !important; color: #231f20 !important; font-weight: 500 !important;">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-thumbtack me-2 text-primary"></i>
                            <h6 class="mb-0 flex-grow-1">Pinned</h6>
                            <i class="fas fa-chevron-down bc-collapse-icon"></i>
                        </div>
                    </div>
                    <div class="collapse show" id="pinnedCollapse">
                        <div class="list-group list-group-flush" id="pinned-items">
                            ${this.renderPinnedItems()}
                        </div>
                    </div>
                </div>

                <!-- Recent Section -->  
                <div class="card mb-3 bc-card">
                    <div class="card-header bg-light bc-collapsible-header" data-bs-toggle="collapse" data-bs-target="#recentCollapse" role="button" style="background: linear-gradient(135deg, #E6E6E6 0%, #b3b3b3 100%) !important; color: #231f20 !important; font-weight: 500 !important;">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-clock me-2 text-success"></i>
                            <h6 class="mb-0 flex-grow-1">Recent</h6>
                            <i class="fas fa-chevron-down bc-collapse-icon"></i>
                        </div>
                    </div>
                    <div class="collapse show" id="recentCollapse">
                        <div class="list-group list-group-flush" id="recent-items">
                            ${this.renderRecentItems()}
                        </div>
                    </div>
                </div>

                <!-- Home - Main Navigation -->
                <div class="card">
                    <div class="card-header bg-primary text-white" style="background: linear-gradient(135deg, #59AAD5 0%, #54C3D6 100%) !important; color: #ffffff !important; font-weight: 600 !important;">
                        <h6 class="mb-0"><i class="fas fa-home"></i> Home</h6>
                    </div>
                    <div class="accordion accordion-flush" id="navigation-accordion">
                        <!-- Dashboard -->
                        <div class="accordion-item">
                            <div class="accordion-header">
                                <a href="#my-dashboard" class="list-group-item list-group-item-action ${this.currentModule === 'my-dashboard' ? 'active' : ''} border-0" data-module="my-dashboard">
                                    <i class="fas fa-chart-line"></i> My Dashboard
                                </a>
                            </div>
                        </div>
                        
                        <!-- Activities -->
                        <div class="accordion-item">
                            <div class="accordion-header">
                                <a href="#my-activities" class="list-group-item list-group-item-action ${this.currentModule === 'my-activities' ? 'active' : ''} border-0" data-module="my-activities">
                                    <i class="fas fa-tasks"></i> My Activities
                                </a>
                            </div>
                        </div>

                        <!-- General Module -->
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#general-module">
                                    <i class="fas fa-users me-2"></i> General
                                </button>
                            </h2>
                            <div id="general-module" class="accordion-collapse collapse" data-bs-parent="#navigation-accordion">
                                <div class="accordion-body p-0">
                                    <a href="#customers" class="list-group-item list-group-item-action ${this.currentModule === 'customers' ? 'active' : ''} border-0" data-module="customers">
                                        <i class="fas fa-user-tie"></i> Customers
                                    </a>
                                    <a href="#contacts" class="list-group-item list-group-item-action ${this.currentModule === 'contacts' ? 'active' : ''} border-0" data-module="contacts">
                                        <i class="fas fa-address-book"></i> Contacts
                                    </a>
                                    <a href="#employees" class="list-group-item list-group-item-action ${this.currentModule === 'employees' ? 'active' : ''} border-0" data-module="employees">
                                        <i class="fas fa-users-cog"></i> Employees
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- Sales Module -->
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#sales-module">
                                    <i class="fas fa-handshake me-2"></i> Sales
                                </button>
                            </h2>
                            <div id="sales-module" class="accordion-collapse collapse" data-bs-parent="#navigation-accordion">
                                <div class="accordion-body p-0">
                                    <a href="#projects" class="list-group-item list-group-item-action ${this.currentModule === 'projects' ? 'active' : ''} border-0" data-module="projects">
                                        <i class="fas fa-project-diagram"></i> Projects
                                    </a>
                                    <a href="#quotes" class="list-group-item list-group-item-action ${this.currentModule === 'quotes' ? 'active' : ''} border-0" data-module="quotes">
                                        <i class="fas fa-file-invoice"></i> Quotes
                                    </a>
                                    <a href="#tenders" class="list-group-item list-group-item-action ${this.currentModule === 'tenders' ? 'active' : ''} border-0" data-module="tenders">
                                        <i class="fas fa-file-contract"></i> Tenders
                                    </a>
                                    <a href="#orders" class="list-group-item list-group-item-action ${this.currentModule === 'orders' ? 'active' : ''} border-0" data-module="orders">
                                        <i class="fas fa-shopping-cart"></i> Orders
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- Stock Module -->
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#stock-module">
                                    <i class="fas fa-boxes me-2"></i> Stock
                                </button>
                            </h2>
                            <div id="stock-module" class="accordion-collapse collapse" data-bs-parent="#navigation-accordion">
                                <div class="accordion-body p-0">
                                    <a href="#stock-items" class="list-group-item list-group-item-action ${this.currentModule === 'stock-items' ? 'active' : ''} border-0" data-module="stock-items">
                                        <i class="fas fa-box"></i> Stock Items
                                    </a>
                                    <a href="#pamir-import" class="list-group-item list-group-item-action ${this.currentModule === 'pamir-import' ? 'active' : ''} border-0" data-module="pamir-import">
                                        <i class="fas fa-file-import"></i> Pamir Import
                                    </a>
                                    <a href="#formula-engine" class="list-group-item list-group-item-action ${this.currentModule === 'formula-engine' ? 'active' : ''} border-0" data-module="formula-engine">
                                        <i class="fas fa-calculator"></i> Formula Engine
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- CRM Module -->
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#crm-module">
                                    <i class="fas fa-user-friends me-2"></i> CRM
                                </button>
                            </h2>
                            <div id="crm-module" class="accordion-collapse collapse" data-bs-parent="#navigation-accordion">
                                <div class="accordion-body p-0">
                                    <a href="#tasks" class="list-group-item list-group-item-action ${this.currentModule === 'tasks' ? 'active' : ''} border-0" data-module="tasks">
                                        <i class="fas fa-tasks"></i> Tasks
                                    </a>
                                    <a href="#calls" class="list-group-item list-group-item-action ${this.currentModule === 'calls' ? 'active' : ''} border-0" data-module="calls">
                                        <i class="fas fa-phone"></i> Phone Calls
                                    </a>
                                    <a href="#emails" class="list-group-item list-group-item-action ${this.currentModule === 'emails' ? 'active' : ''} border-0" data-module="emails">
                                        <i class="fas fa-envelope"></i> Emails
                                    </a>
                                    <a href="#meetings" class="list-group-item list-group-item-action ${this.currentModule === 'meetings' ? 'active' : ''} border-0" data-module="meetings">
                                        <i class="fas fa-calendar-alt"></i> Meetings
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- Settings Tables Module -->
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#settings-module">
                                    <i class="fas fa-table me-2"></i> Settings Tables
                                </button>
                            </h2>
                            <div id="settings-module" class="accordion-collapse collapse" data-bs-parent="#navigation-accordion">
                                <div class="accordion-body p-0">
                                    <a href="#uom-table" class="list-group-item list-group-item-action ${this.currentModule === 'uom-table' ? 'active' : ''} border-0" data-module="uom-table">
                                        <i class="fas fa-balance-scale"></i> Units of Measure
                                    </a>
                                    <a href="#item-types-table" class="list-group-item list-group-item-action ${this.currentModule === 'item-types-table' ? 'active' : ''} border-0" data-module="item-types-table">
                                        <i class="fas fa-tags"></i> Item Types
                                    </a>
                                    <a href="#categories-table" class="list-group-item list-group-item-action ${this.currentModule === 'categories-table' ? 'active' : ''} border-0" data-module="categories-table">
                                        <i class="fas fa-folder"></i> Categories
                                    </a>
                                    <a href="#company-types-table" class="list-group-item list-group-item-action ${this.currentModule === 'company-types-table' ? 'active' : ''} border-0" data-module="company-types-table">
                                        <i class="fas fa-building"></i> Company Types
                                    </a>
                                    <a href="#account-types-table" class="list-group-item list-group-item-action ${this.currentModule === 'account-types-table' ? 'active' : ''} border-0" data-module="account-types-table">
                                        <i class="fas fa-user-tag"></i> Account Types
                                    </a>
                                    <a href="#account-relationships-table" class="list-group-item list-group-item-action ${this.currentModule === 'account-relationships-table' ? 'active' : ''} border-0" data-module="account-relationships-table">
                                        <i class="fas fa-link"></i> Account Relationships
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPinnedItems() {
        if (this.pinnedItems.length === 0) {
            return '<div class="text-center text-muted p-2 small">No pinned items</div>';
        }

        return this.pinnedItems.map(item => `
            <a href="#${item.module}" class="list-group-item list-group-item-action border-0" data-module="${item.module}">
                <i class="${item.icon}"></i> ${item.name}
            </a>
        `).join('');
    }

    renderRecentItems() {
        if (this.recentItems.length === 0) {
            return '<div class="text-center text-muted p-2 small">No recent activity</div>';
        }

        const limitedRecent = this.recentItems.slice(0, 3);

        return limitedRecent.map(item => `
            <a href="#${item.module}" class="list-group-item list-group-item-action border-0" data-module="${item.module}">
                <i class="${item.icon}"></i> ${item.name}
            </a>
        `).join('');
    }

    setupEventListeners() {
        // Handle sidebar navigation
        document.addEventListener('click', (e) => {
            const moduleLink = e.target.closest('[data-module]');
            if (moduleLink) {
                e.preventDefault();
                const module = moduleLink.getAttribute('data-module');
                if (module) {
                    this.navigateToModule(module);
                }
            }
        });

        // Listen for external navigation events - only for sidebar updates, not navigation
        document.addEventListener('sidebar-update-active', (event) => {
            if (event.detail.module) {
                this.updateActiveState(event.detail.module);
            }
        });
    }

    navigateToModule(moduleName) {
        // Update active state
        this.updateActiveState(moduleName);

        // Add to recent items
        this.addToRecent(moduleName);

        // Update current module
        this.currentModule = moduleName;
        this.saveSidebarState();

        // Dispatch navigation event for module manager
        document.dispatchEvent(new CustomEvent('millennium-module-navigate', {
            detail: { module: moduleName }
        }));
    }

    updateActiveState(moduleName) {
        // Update active state only
        document.querySelectorAll('[data-module]').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-module="${moduleName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        this.currentModule = moduleName;
    }

    addToRecent(moduleName) {
        const moduleInfo = this.getModuleInfo(moduleName);
        if (!moduleInfo) return;

        // Remove if already exists
        this.recentItems = this.recentItems.filter(item => item.module !== moduleName);

        // Add to beginning
        this.recentItems.unshift(moduleInfo);

        // Keep only 3 items
        this.recentItems = this.recentItems.slice(0, 3);

        // Update recent section
        const recentContainer = document.getElementById('recent-items');
        if (recentContainer) {
            recentContainer.innerHTML = this.renderRecentItems();
        }
    }

    getModuleInfo(moduleName) {
        const moduleMap = {
            'my-dashboard': { name: 'My Dashboard', icon: 'fas fa-chart-line' },
            'my-activities': { name: 'My Activities', icon: 'fas fa-tasks' },
            'customers': { name: 'Customers', icon: 'fas fa-user-tie' },
            'contacts': { name: 'Contacts', icon: 'fas fa-address-book' },
            'employees': { name: 'Employees', icon: 'fas fa-users-cog' },
            'projects': { name: 'Projects', icon: 'fas fa-project-diagram' },
            'quotes': { name: 'Quotes', icon: 'fas fa-file-invoice' },
            'tenders': { name: 'Tenders', icon: 'fas fa-file-contract' },
            'orders': { name: 'Orders', icon: 'fas fa-shopping-cart' },
            'stock-items': { name: 'Stock Items', icon: 'fas fa-box' },
            'pamir-import': { name: 'Pamir Import', icon: 'fas fa-file-import' },
            'formula-engine': { name: 'Formula Engine', icon: 'fas fa-calculator' }
        };

        return moduleMap[moduleName] ? { 
            module: moduleName, 
            ...moduleMap[moduleName] 
        } : null;
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (!window.millenniumSidebar) {
        window.millenniumSidebar = new SystemSidebar();
    }
});

// Make globally accessible
window.SystemSidebar = SystemSidebar;