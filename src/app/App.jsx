// App Shell - Main Application Component
// Orchestrates the modular system with header, sidebar, and main content

class ModularApp {
  constructor() {
    this.header = null;
    this.sidebar = null;
    this.router = null;
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    console.log('ModularApp: Initializing...');
    this.render();
    this.initializeComponents();
    this.loadModules();
    this.isInitialized = true;
    console.log('ModularApp: Ready');
  }

  render() {
    // Create the modular app container
    const existingContainer = document.getElementById('modular-app-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    const appContainer = document.createElement('div');
    appContainer.id = 'modular-app-container';
    appContainer.innerHTML = `
      <div class="modular-app h-100">
        <!-- Header -->
        <div id="modular-header"></div>
        
        <!-- Main Layout -->
        <div class="d-flex h-100">
          <!-- Sidebar -->
          <div class="sidebar-wrapper" style="width: 280px; flex-shrink: 0;">
            <div id="modular-sidebar" class="h-100"></div>
          </div>
          
          <!-- Main Content -->
          <div class="main-content-wrapper flex-grow-1">
            <div id="main-content" class="p-4 h-100 overflow-auto">
              <!-- Dynamic content will be loaded here -->
            </div>
          </div>
        </div>
      </div>

      <style>
        .modular-app {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f8f9fa;
        }
        
        .main-content-wrapper {
          background: white;
          border-left: 1px solid #dee2e6;
          display: flex;
          flex-direction: column;
        }
        
        #main-content {
          background: #f8f9fa;
        }
        
        @media (max-width: 768px) {
          .sidebar-wrapper {
            width: 240px !important;
          }
        }
        
        @media (max-width: 576px) {
          .d-flex {
            flex-direction: column;
          }
          
          .sidebar-wrapper {
            width: 100% !important;
            height: auto;
          }
        }
      </style>
    `;

    // Insert the modular app before the original container
    const originalContainer = document.querySelector('.container-fluid[style*="margin-top"]');
    if (originalContainer) {
      document.body.insertBefore(appContainer, originalContainer);
      // Hide the original container initially
      originalContainer.style.display = 'none';
    } else {
      document.body.appendChild(appContainer);
    }
  }

  initializeComponents() {
    // Initialize header
    if (window.Header) {
      this.header = new window.Header('modular-header');
    }

    // Initialize sidebar
    if (window.Sidebar) {
      this.sidebar = new window.Sidebar('modular-sidebar');
    }

    // Initialize router
    this.router = window.router;
  }

  async loadModules() {
    try {
      // Load customer module components
      await this.loadCustomerModule();
      
      console.log('ModularApp: All modules loaded successfully');
    } catch (error) {
      console.error('ModularApp: Failed to load modules:', error);
    }
  }

  async loadCustomerModule() {
    return new Promise((resolve) => {
      // Check if module scripts are already loaded
      if (window.CustomersIndex && window.CustomerDetails) {
        console.log('ModularApp: Customer module already loaded');
        resolve();
        return;
      }

      // Load customer module scripts dynamically
      const scripts = [
        'src/modules/customers/index.jsx',
        'src/modules/customers/Details.jsx'
      ];

      let loadedCount = 0;
      const totalScripts = scripts.length;

      scripts.forEach(scriptPath => {
        const script = document.createElement('script');
        script.src = scriptPath;
        script.onload = () => {
          loadedCount++;
          if (loadedCount === totalScripts) {
            console.log('ModularApp: Customer module loaded');
            resolve();
          }
        };
        script.onerror = () => {
          console.warn(`Failed to load script: ${scriptPath}`);
          loadedCount++;
          if (loadedCount === totalScripts) {
            resolve();
          }
        };
        document.head.appendChild(script);
      });
    });
  }

  show() {
    const container = document.getElementById('modular-app-container');
    if (container) {
      container.style.display = 'block';
    }
    
    // Hide original system
    const originalContainer = document.querySelector('.container-fluid[style*="margin-top"]');
    if (originalContainer) {
      originalContainer.style.display = 'none';
    }
  }

  hide() {
    const container = document.getElementById('modular-app-container');
    if (container) {
      container.style.display = 'none';
    }
    
    // Show original system
    const originalContainer = document.querySelector('.container-fluid[style*="margin-top"]');
    if (originalContainer) {
      originalContainer.style.display = 'block';
    }
  }
}

// Initialize the modular app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (!window.modularApp) {
    window.modularApp = new ModularApp();
  }
});

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
  // DOM still loading, use DOMContentLoaded
} else {
  // DOM already loaded
  if (!window.modularApp) {
    window.modularApp = new ModularApp();
  }
}

// App V2 - Modern layout with HeaderBar and CommandRegistry
class AppV2 {
  constructor() {
    this.appShell = null;
    this.router = null;
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    console.log('AppV2: Initializing modern app with HeaderBar...');
    this.initializeAppShell();
    this.initializeRouter();
    this.isInitialized = true;
    console.log('AppV2: Ready');
  }

  initializeAppShell() {
    // Initialize the modern app shell with HeaderBar
    this.appShell = new AppShellV2('app');
  }

  initializeRouter() {
    // Initialize router with V2 routing
    if (window.Router) {
      this.router = new Router();
      
      // Override router content rendering to use AppShell
      const originalRenderContent = this.router.renderContent;
      this.router.renderContent = (content, route) => {
        if (this.appShell) {
          this.appShell.setRoute(route);
          this.appShell.renderContent(content);
        } else {
          // Fallback to original rendering
          originalRenderContent.call(this.router, content, route);
        }
      };
    }
  }

  // Method to get command provider for modules
  getCommandProvider(moduleId) {
    return new CommandProvider(moduleId);
  }

  // Method for modules to register actions
  setModuleActions(moduleId, actions) {
    const commands = useCommands(moduleId);
    commands.set(actions);
  }

  // Cleanup method
  destroy() {
    if (this.appShell) {
      this.appShell.destroy();
    }
  }
}

// Make globally accessible
window.ModularApp = ModularApp;
window.AppV2 = AppV2;

export default ModularApp;