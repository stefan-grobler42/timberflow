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
        const sidebarContainer = document.getElementById('sidebar-container');
        if (!sidebarContainer) return;

        sidebarContainer.innerHTML = `
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
                    <!-- Dashboard Section -->
                    <div class="sidebar-section">
                        <div class="sidebar-section-header ${this.isCollapsed ? 'd-none' : ''}">
                            <i class="fas fa-home"></i>
                            <span>Dashboard</span>
                        </div>
                        <ul class="sidebar-menu">
                            <li><a href="#" class="sidebar-link" data-module="my-dashboard">
                                <i class="fas fa-tachometer-alt"></i>
                                <span class="${this.isCollapsed ? 'd-none' : ''}">My Dashboard</span>
                            </a></li>
                            <li><a href="#" class="sidebar-link" data-module="my-activities">
                                <i class="fas fa-tasks"></i>
                                <span class="${this.isCollapsed ? 'd-none' : ''}">My Activities</span>
                            </a></li>
                        </ul>
                    </div>

                    <!-- General Section -->
                    <div class="sidebar-section">
                        <div class="sidebar-section-header ${this.isCollapsed ? 'd-none' : ''}">
                            <i class="fas fa-users"></i>
                            <span>General</span>
                        </div>
                        <ul class="sidebar-menu">
                            <li><a href="#" class="sidebar-link" data-module="customers">
                                <i class="fas fa-user-friends"></i>
                                <span class="${this.isCollapsed ? 'd-none' : ''}">Customers</span>
                            </a></li>
                            <li><a href="#" class="sidebar-link" data-module="contacts">
                                <i class="fas fa-address-book"></i>
                                <span class="${this.isCollapsed ? 'd-none' : ''}">Contacts</span>
                            </a></li>
                        </ul>
                    </div>

                    <!-- Sales Section -->
                    <div class="sidebar-section">
                        <div class="sidebar-section-header ${this.isCollapsed ? 'd-none' : ''}">
                            <i class="fas fa-chart-line"></i>
                            <span>Sales</span>
                        </div>
                        <ul class="sidebar-menu">
                            <li><a href="#" class="sidebar-link" data-module="projects">
                                <i class="fas fa-project-diagram"></i>
                                <span class="${this.isCollapsed ? 'd-none' : ''}">Projects</span>
                            </a></li>
                            <li><a href="#" class="sidebar-link" data-module="quotes">
                                <i class="fas fa-file-invoice-dollar"></i>
                                <span class="${this.isCollapsed ? 'd-none' : ''}">Quotes</span>
                            </a></li>
                            <li><a href="#" class="sidebar-link" data-module="orders">
                                <i class="fas fa-shopping-cart"></i>
                                <span class="${this.isCollapsed ? 'd-none' : ''}">Orders</span>
                            </a></li>
                        </ul>
                    </div>

                    <!-- Stock Section -->
                    <div class="sidebar-section">
                        <div class="sidebar-section-header ${this.isCollapsed ? 'd-none' : ''}">
                            <i class="fas fa-boxes"></i>
                            <span>Stock</span>
                        </div>
                        <ul class="sidebar-menu">
                            <li><a href="#" class="sidebar-link" data-module="stock-items">
                                <i class="fas fa-box"></i>
                                <span class="${this.isCollapsed ? 'd-none' : ''}">Stock Items</span>
                            </a></li>
                        </ul>
                    </div>

                    <!-- Pinned Items -->
                    ${this.renderPinnedItems()}

                    <!-- Recent Items -->
                    ${this.renderRecentItems()}
                </div>
            </nav>
        `;

        this.setupSidebarEventListeners();
    }

    renderPinnedItems() {
        if (this.pinnedItems.length === 0) return '';

        return `
            <div class="sidebar-section">
                <div class="sidebar-section-header collapsible ${this.isCollapsed ? 'd-none' : ''}" data-bs-toggle="collapse" data-bs-target="#pinned-items">
                    <i class="fas fa-thumbtack"></i>
                    <span>Pinned</span>
                    <i class="fas fa-chevron-down ms-auto"></i>
                </div>
                <div class="collapse show" id="pinned-items">
                    <ul class="sidebar-menu">
                        ${this.pinnedItems.map(item => `
                            <li><a href="#" class="sidebar-link" data-module="${item.module}">
                                <i class="${item.icon}"></i>
                                <span class="${this.isCollapsed ? 'd-none' : ''}">${item.name}</span>
                            </a></li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    renderRecentItems() {
        if (this.recentItems.length === 0) return '';

        const limitedRecent = this.recentItems.slice(0, 3);

        return `
            <div class="sidebar-section">
                <div class="sidebar-section-header collapsible ${this.isCollapsed ? 'd-none' : ''}" data-bs-toggle="collapse" data-bs-target="#recent-items">
                    <i class="fas fa-clock"></i>
                    <span>Recent</span>
                    <i class="fas fa-chevron-down ms-auto"></i>
                </div>
                <div class="collapse show" id="recent-items">
                    <ul class="sidebar-menu">
                        ${limitedRecent.map(item => `
                            <li><a href="#" class="sidebar-link" data-module="${item.module}">
                                <i class="${item.icon}"></i>
                                <span class="${this.isCollapsed ? 'd-none' : ''}">${item.name}</span>
                            </a></li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
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
        document.querySelectorAll('.sidebar-link').forEach(link => {
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
        document.querySelectorAll('.sidebar-link').forEach(link => {
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