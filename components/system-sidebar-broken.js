// System Sidebar - Centralized Navigation Component
class SystemSidebar {
    constructor() {
        this.isCollapsed = false;
        this.pinnedItems = [];
        this.recentItems = [];
        this.currentModule = null;
        this.init();
    }

    init() {
        this.loadSidebarState();
        this.setupEventListeners();
        this.render();
    }

    loadSidebarState() {
        // Load sidebar preferences from localStorage
        const sidebarState = localStorage.getItem('millennium-sidebar-state');
        if (sidebarState) {
            const state = JSON.parse(sidebarState);
            this.isCollapsed = state.isCollapsed || false;
            this.pinnedItems = state.pinnedItems || [];
            this.recentItems = state.recentItems || [];
        }
    }

    saveSidebarState() {
        const state = {
            isCollapsed: this.isCollapsed,
            pinnedItems: this.pinnedItems,
            recentItems: this.recentItems
        };
        localStorage.setItem('millennium-sidebar-state', JSON.stringify(state));
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <nav class="sidebar ${this.isCollapsed ? 'collapsed' : ''}" id="sidebar">
                <div class="sidebar-header">
                    <div class="d-flex align-items-center">
                        <div class="sidebar-logo me-2">
                            <svg width="32" height="32" viewBox="0 0 100 100" class="millennium-logo">
                                <rect x="10" y="20" width="15" height="60" fill="#59AAD5" rx="2"/>
                                <rect x="30" y="35" width="15" height="45" fill="#54C3D6" rx="2"/>
                                <rect x="50" y="25" width="15" height="55" fill="#464746" rx="2"/>
                                <rect x="70" y="40" width="15" height="40" fill="#231f20" rx="2"/>
                                <path d="M15 15 L85 15 L50 5 Z" fill="#59AAD5" opacity="0.8"/>
                            </svg>
                        </div>
                        <span class="sidebar-title ${this.isCollapsed ? 'd-none' : ''}">Millennium ERP</span>
                        <button class="btn btn-link p-0 ms-auto sidebar-toggle" id="sidebar-toggle">
                            <i class="fas fa-bars text-white"></i>
                        </button>
                    </div>
                </div>

                <div class="sidebar-content">
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
                                </div>
                            </div>
                        </div>

                    <!-- Pinned Items -->
                    </div>
                </div>
            </div>
        `;

        this.setupSidebarEventListeners();
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
        // Listen for module navigation events
        document.addEventListener('millennium-navigate', (event) => {
            this.handleModuleNavigation(event.detail);
        });
    }

    setupSidebarEventListeners() {
        // Toggle sidebar
        const toggleBtn = document.getElementById('sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Handle sidebar navigation
        document.querySelectorAll('[data-module]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const module = e.currentTarget.getAttribute('data-module');
                if (module) {
                    this.navigateToModule(module);
                }
            });
        });
    }

    toggleSidebar() {
        this.isCollapsed = !this.isCollapsed;
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed', this.isCollapsed);
        }

        // Update text visibility
        document.querySelectorAll('.sidebar span:not(.sidebar-title)').forEach(span => {
            span.classList.toggle('d-none', this.isCollapsed);
        });
        
        const title = document.querySelector('.sidebar-title');
        if (title) {
            title.classList.toggle('d-none', this.isCollapsed);
        }

        this.saveSidebarState();
    }

    navigateToModule(moduleName) {
        // Update active state
        document.querySelectorAll('[data-module]').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-module="${moduleName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Add to recent items
        this.addToRecent(moduleName);

        // Dispatch navigation event
        document.dispatchEvent(new CustomEvent('millennium-module-navigate', {
            detail: { module: moduleName }
        }));

        this.currentModule = moduleName;
        this.saveSidebarState();
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
    }

    getModuleInfo(moduleName) {
        const moduleMap = {
            'my-dashboard': { name: 'My Dashboard', icon: 'fas fa-tachometer-alt' },
            'my-activities': { name: 'My Activities', icon: 'fas fa-tasks' },
            'customers': { name: 'Customers', icon: 'fas fa-user-friends' },
            'contacts': { name: 'Contacts', icon: 'fas fa-address-book' },
            'projects': { name: 'Projects', icon: 'fas fa-project-diagram' },
            'quotes': { name: 'Quotes', icon: 'fas fa-file-invoice-dollar' },
            'orders': { name: 'Orders', icon: 'fas fa-shopping-cart' },
            'stock-items': { name: 'Stock Items', icon: 'fas fa-box' }
        };

        return moduleMap[moduleName] ? { 
            module: moduleName, 
            ...moduleMap[moduleName] 
        } : null;
    }

    handleModuleNavigation(details) {
        // Handle external navigation requests
        if (details.module) {
            this.navigateToModule(details.module);
        }
    }
}

// Initialize sidebar when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!window.millenniumSidebar) {
        window.millenniumSidebar = new SystemSidebar();
    }
});

// Make globally accessible
window.SystemSidebar = SystemSidebar;