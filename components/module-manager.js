// Module Manager - Centralized Module Loading and Navigation
class ModuleManager {
    constructor() {
        this.modules = new Map();
        this.currentModule = null;
        this.moduleInstances = new Map();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeSystemComponents();
        
        // Default to customers module
        setTimeout(() => {
            this.navigateToModule('customers');
        }, 100);
    }

    initializeSystemComponents() {
        // Initialize system defaults first
        if (window.SystemDefaults) {
            window.SystemDefaults.initialize();
        }

        // Initialize sidebar
        if (window.SystemSidebar && !window.millenniumSidebar) {
            window.millenniumSidebar = new window.SystemSidebar();
        }
    }

    setupEventListeners() {
        // Listen for sidebar navigation events
        document.addEventListener('millennium-module-navigate', (event) => {
            const moduleName = event.detail.module;
            this.navigateToModule(moduleName);
        });

        // Listen for legacy tab navigation (backwards compatibility)
        document.addEventListener('click', (event) => {
            const tabElement = event.target.closest('[data-tab]');
            if (tabElement) {
                event.preventDefault();
                const moduleName = tabElement.getAttribute('data-tab');
                this.navigateToModule(moduleName);
            }
        });
    }

    navigateToModule(moduleName) {
        console.log(`ModuleManager: Navigating to ${moduleName}`);
        
        // Hide all content areas
        this.hideAllContent();
        
        // Update current module
        this.currentModule = moduleName;
        
        // Handle different module types
        switch (moduleName) {
            case 'customers':
                this.loadCustomersModule();
                break;
            case 'my-dashboard':
                this.showContent('my-dashboard');
                break;
            case 'my-activities':
                this.showContent('my-activities');
                break;
            case 'stock-items':
                this.loadStockModule();
                break;
            default:
                this.showContent(moduleName);
                break;
        }
        
        // Update sidebar active state (if sidebar is available) - but don't trigger navigation event
        if (window.millenniumSidebar) {
            window.millenniumSidebar.updateActiveState(moduleName);
        }
    }

    hideAllContent() {
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
    }

    showContent(contentId) {
        const content = document.getElementById(contentId);
        if (content) {
            content.classList.add('active');
        } else {
            console.warn(`Content area not found: ${contentId}`);
        }
    }

    loadCustomersModule() {
        this.showContent('customers');
        
        // Initialize customer manager if not already done
        if (!this.moduleInstances.has('customers')) {
            try {
                const customerManager = new CustomerManager();
                this.moduleInstances.set('customers', customerManager);
                console.log('CustomerManager initialized');
            } catch (error) {
                console.error('Failed to initialize CustomerManager:', error);
            }
        }
    }

    loadStockModule() {
        this.showContent('stock-items');
        
        // Initialize stock placeholder if not already done  
        if (!this.moduleInstances.has('stock-items')) {
            try {
                if (window.StockPlaceholder) {
                    const stockPlaceholder = new window.StockPlaceholder();
                    this.moduleInstances.set('stock-items', stockPlaceholder);
                    console.log('Stock Placeholder initialized');
                }
            } catch (error) {
                console.error('Failed to initialize Stock Placeholder:', error);
            }
        }
    }

    registerModule(name, moduleClass) {
        this.modules.set(name, moduleClass);
    }

    getModuleInstance(name) {
        return this.moduleInstances.get(name);
    }

    refreshCurrentModule() {
        if (this.currentModule) {
            const instance = this.moduleInstances.get(this.currentModule);
            if (instance && typeof instance.refresh === 'function') {
                instance.refresh();
            }
        }
    }

    unloadModule(name) {
        const instance = this.moduleInstances.get(name);
        if (instance && typeof instance.destroy === 'function') {
            instance.destroy();
        }
        this.moduleInstances.delete(name);
    }
}

// Initialize module manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!window.moduleManager) {
        window.moduleManager = new ModuleManager();
        console.log('ModuleManager initialized');
    }
});

// Make globally accessible
window.ModuleManager = ModuleManager;