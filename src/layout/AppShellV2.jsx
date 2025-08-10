// App Shell V2 - Modern Layout with Header Bar
// Combines HeaderBar + existing Sidebar + routed content
class AppShellV2 {
  constructor(containerId = 'app') {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.headerBar = null;
    this.sidebar = null;
    this.commandProvider = null;
    this.currentRoute = null;
    
    if (!this.container) {
      console.error('AppShellV2: Container not found:', containerId);
      return;
    }
    
    this.init();
  }

  init() {
    console.log('AppShellV2: Initializing modern layout...');
    this.render();
    this.setupComponents();
    this.setupCommandRegistry();
    console.log('AppShellV2: Ready');
  }

  render() {
    this.container.innerHTML = `
      <div class="app-shell-v2 d-flex flex-column vh-100">
        <!-- Header Bar -->
        <div id="header-bar-container"></div>
        
        <!-- Main Layout -->
        <div class="main-layout d-flex flex-grow-1">
          <!-- Sidebar -->
          <div class="sidebar-wrapper" id="sidebar-container">
            <!-- Sidebar will be rendered here -->
          </div>
          
          <!-- Content Area -->
          <div class="content-wrapper flex-grow-1 d-flex flex-column">
            <div class="content-container flex-grow-1 p-0" id="main-content">
              <!-- Routed content will be rendered here -->
            </div>
          </div>
        </div>
      </div>
      
      <style>
        .app-shell-v2 {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        
        .main-layout {
          overflow: hidden;
        }
        
        .sidebar-wrapper {
          width: 280px;
          min-width: 280px;
          background: #fff;
          border-right: 1px solid #dee2e6;
          overflow-y: auto;
        }
        
        .content-wrapper {
          background: #f8f9fa;
          overflow-y: auto;
        }
        
        .content-container {
          background: #fff;
          margin: 1rem;
          border-radius: 0.5rem;
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
          border: 1px solid #dee2e6;
          min-height: calc(100vh - 2rem - 60px); /* Account for header and margins */
        }
        
        @media (max-width: 768px) {
          .sidebar-wrapper {
            width: 0;
            min-width: 0;
            overflow: hidden;
            transition: width 0.3s ease;
          }
          
          .sidebar-wrapper.show {
            width: 280px;
            min-width: 280px;
          }
          
          .content-container {
            margin: 0.5rem;
            min-height: calc(100vh - 1rem - 60px);
          }
        }
      </style>
    `;
  }

  setupComponents() {
    // Initialize HeaderBar
    this.headerBar = new HeaderBar('header-bar-container');
    
    // Initialize Sidebar (reuse existing component)
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer && window.Sidebar) {
      this.sidebar = new Sidebar('sidebar-container');
    } else {
      console.warn('AppShellV2: Sidebar component not available');
      // Fallback minimal sidebar
      sidebarContainer.innerHTML = `
        <div class="p-3">
          <h6 class="text-muted">Navigation</h6>
          <div class="nav flex-column">
            <a href="#/" class="nav-link">Dashboard</a>
            <a href="#/customers" class="nav-link">Customers</a>
            <a href="#/products" class="nav-link">Products</a>
          </div>
        </div>
      `;
    }
  }

  setupCommandRegistry() {
    // Create command provider for the shell
    this.commandProvider = new CommandProvider('app-shell-v2');
    
    // Subscribe to command changes and update header
    if (this.headerBar && window.commandRegistry) {
      window.commandRegistry.subscribe((actions) => {
        this.headerBar.updateActions(actions);
      });
    }
    
    // Set default shell actions
    this.setDefaultActions();
  }

  setDefaultActions() {
    // Default actions available in all contexts
    const defaultActions = [
      {
        id: 'refresh',
        label: 'Refresh',
        icon: 'fas fa-sync-alt',
        variant: 'outline-secondary',
        onClick: () => {
          window.location.reload();
        }
      }
    ];
    
    this.commandProvider.set(defaultActions);
  }

  // Method to render content in the main area
  renderContent(content) {
    const contentContainer = document.getElementById('main-content');
    if (contentContainer) {
      if (typeof content === 'string') {
        contentContainer.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        contentContainer.innerHTML = '';
        contentContainer.appendChild(content);
      }
    }
  }

  // Method to update the current route context
  setRoute(route) {
    this.currentRoute = route;
    
    // Update header context based on route
    this.updateHeaderForRoute(route);
  }

  updateHeaderForRoute(route) {
    // Route-specific header updates
    if (this.headerBar) {
      // Example: Update search placeholder based on route
      if (route.startsWith('/customers')) {
        this.headerBar.setSearchTerm('');
        // Update search placeholder would require modifying the HeaderBar component
      } else if (route.startsWith('/products')) {
        this.headerBar.setSearchTerm('');
      }
    }
  }

  // Toggle sidebar (for mobile)
  toggleSidebar() {
    const sidebarWrapper = document.querySelector('.sidebar-wrapper');
    if (sidebarWrapper) {
      sidebarWrapper.classList.toggle('show');
    }
  }

  // Cleanup method
  destroy() {
    if (this.commandProvider) {
      this.commandProvider.destroy();
    }
    
    if (this.headerBar) {
      // HeaderBar cleanup would go here
    }
    
    if (this.sidebar) {
      // Sidebar cleanup would go here
    }
  }
}

// Make available globally
window.AppShellV2 = AppShellV2;