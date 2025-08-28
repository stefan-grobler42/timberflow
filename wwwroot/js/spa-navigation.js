// SPA Navigation System
class SPANavigator {
    constructor() {
        this.currentModule = null;
        this.moduleCache = {};
        this.sidebarMode = localStorage.getItem('sidebarMode') || 'always';
        this.init();
    }

    init() {
        this.setupSidebarMode();
        this.attachEventListeners();
        this.loadInitialModule();
    }

    setupSidebarMode() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        const modeText = document.getElementById('sidebar-mode-text');
        
        // Apply saved mode
        this.applySidebarMode(this.sidebarMode);
    }

    applySidebarMode(mode) {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        const modeText = document.getElementById('sidebar-mode-text');
        
        // Remove all mode classes
        sidebar.classList.remove('minimized', 'hidden', 'hover-mode', 'show');
        mainContent.classList.remove('sidebar-hidden', 'sidebar-hover');
        
        switch(mode) {
            case 'minimized':
                sidebar.classList.add('minimized');
                modeText.textContent = 'Minimized';
                break;
            case 'hover':
                sidebar.classList.add('hover-mode');
                mainContent.classList.add('sidebar-hover');
                modeText.textContent = 'View on Hover';
                this.setupHoverBehavior();
                break;
            case 'always':
            default:
                modeText.textContent = 'Always Show';
                break;
        }
        
        this.sidebarMode = mode;
        localStorage.setItem('sidebarMode', mode);
    }

    setupHoverBehavior() {
        const sidebar = document.getElementById('sidebar');
        const hoverZone = document.getElementById('sidebar-hover-zone');
        let hoverTimeout;
        
        const showSidebar = () => {
            clearTimeout(hoverTimeout);
            sidebar.classList.add('show');
        };
        
        const hideSidebar = () => {
            hoverTimeout = setTimeout(() => {
                sidebar.classList.remove('show');
            }, 300);
        };
        
        // Show on hover zone
        hoverZone.addEventListener('mouseenter', showSidebar);
        
        // Keep showing while hovering sidebar
        sidebar.addEventListener('mouseenter', showSidebar);
        sidebar.addEventListener('mouseleave', hideSidebar);
    }

    attachEventListeners() {
        // Sidebar toggle button
        document.getElementById('sidebar-toggle').addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        // Sidebar mode options
        document.querySelectorAll('.sidebar-mode-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                const mode = e.target.dataset.mode;
                this.applySidebarMode(mode);
            });
        });
        
        // Module links
        document.querySelectorAll('.module-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const module = e.target.closest('.module-link').dataset.module;
                this.loadModule(module);
                
                // Update active state
                document.querySelectorAll('.module-link').forEach(l => l.classList.remove('active'));
                e.target.closest('.module-link').classList.add('active');
            });
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        
        if (this.sidebarMode === 'always') {
            sidebar.classList.toggle('hidden');
            mainContent.classList.toggle('sidebar-hidden');
        } else if (this.sidebarMode === 'minimized') {
            sidebar.classList.toggle('minimized');
        }
    }

    async loadModule(moduleName) {
        const container = document.getElementById('app-container');
        
        // Show loading
        container.innerHTML = `
            <div id="module-content" class="h-100 d-flex align-items-center justify-content-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
        
        try {
            // Check cache first
            let content;
            if (this.moduleCache[moduleName]) {
                content = this.moduleCache[moduleName];
            } else {
                // Fetch module content
                const response = await fetch(`/${moduleName}`);
                const html = await response.text();
                
                // Extract body content
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Look for the main content container
                let moduleContent = doc.querySelector('.customer-management-container');
                if (moduleContent) {
                    content = moduleContent.outerHTML;
                } else {
                    // If no container found, get the entire body content
                    const bodyContent = doc.querySelector('body');
                    if (bodyContent) {
                        // Remove script tags to avoid re-execution
                        const scripts = bodyContent.querySelectorAll('script');
                        scripts.forEach(script => script.remove());
                        content = bodyContent.innerHTML;
                    } else {
                        content = html;
                    }
                }
                this.moduleCache[moduleName] = content;
            }
            
            // Load content
            container.innerHTML = `<div id="module-content">${content}</div>`;
            
            // Initialize module-specific scripts
            this.initializeModule(moduleName);
            
            this.currentModule = moduleName;
            
        } catch (error) {
            console.error('Error loading module:', error);
            container.innerHTML = `
                <div id="module-content" class="h-100 d-flex align-items-center justify-content-center">
                    <div class="alert alert-danger">
                        <h4>Module Not Available</h4>
                        <p>The ${moduleName} module is currently under development.</p>
                    </div>
                </div>
            `;
        }
    }

    initializeModule(moduleName) {
        // Re-initialize module-specific JavaScript
        switch(moduleName) {
            case 'Customer':
                // Re-initialize customer manager if needed
                if (typeof CustomerManager !== 'undefined') {
                    new CustomerManager();
                }
                if (typeof LocationManager !== 'undefined') {
                    const locationManager = new LocationManager();
                    // Re-attach modal event listener
                    const modal = document.getElementById('customerModal');
                    if (modal) {
                        modal.addEventListener('shown.bs.modal', () => {
                            setTimeout(() => locationManager.initAddressAutocomplete(), 100);
                        });
                    }
                }
                break;
            // Add other module initializations here
        }
    }

    loadInitialModule() {
        // Check URL for module parameter
        const urlParams = new URLSearchParams(window.location.search);
        const module = urlParams.get('module');
        
        if (module) {
            this.loadModule(module);
            // Mark as active
            const link = document.querySelector(`[data-module="${module}"]`);
            if (link) link.classList.add('active');
        }
    }

    // Auto-save functionality for forms
    enableAutoSave(formId, saveCallback) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        let saveTimeout;
        const autoSave = () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveCallback();
                this.showNotification('Changes saved automatically', 'success');
            }, 2000);
        };
        
        form.addEventListener('input', autoSave);
        form.addEventListener('change', autoSave);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} position-fixed bottom-0 end-0 m-3`;
        notification.style.zIndex = '9999';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize SPA Navigator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.spaNavigator = new SPANavigator();
});