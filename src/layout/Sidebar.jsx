// Layout - Sidebar Component
// Provides navigation for the modular system

class Sidebar {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.currentRoute = '/';
    
    if (!this.container) {
      console.error('Sidebar: Container not found:', containerId);
      return;
    }
    
    this.init();
  }

  init() {
    this.render();
    this.setupEventListeners();
    this.updateActiveState();
  }

  render() {
    this.container.innerHTML = `
      <div class="sidebar-container h-100">
        <!-- Brand -->
        <div class="sidebar-brand p-3">
          <h5 class="mb-0">
            <i class="fas fa-building text-primary"></i>
            Millennium ERP
          </h5>
          <small class="text-muted">Modular System</small>
        </div>

        <!-- Navigation -->
        <nav class="sidebar-nav">
          <div class="nav-section">
            <h6 class="nav-header px-3 py-2 text-muted small">Main</h6>
            <ul class="nav flex-column">
              <li class="nav-item">
                <a class="nav-link" href="#/" data-route="/">
                  <i class="fas fa-home"></i>
                  Dashboard
                </a>
              </li>
            </ul>
          </div>

          <div class="nav-section">
            <h6 class="nav-header px-3 py-2 text-muted small">Modules</h6>
            <ul class="nav flex-column">
              <li class="nav-item">
                <a class="nav-link" href="#/customers" data-route="/customers">
                  <i class="fas fa-user-tie"></i>
                  Customers
                  <span class="badge bg-primary ms-auto">Active</span>
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#/products" data-route="/products">
                  <i class="fas fa-boxes"></i>
                  Products
                  <span class="badge bg-primary ms-auto">New</span>
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link disabled" href="#/projects" data-route="/projects">
                  <i class="fas fa-project-diagram"></i>
                  Projects
                  <span class="badge bg-secondary ms-auto">Soon</span>
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link disabled" href="#/quotes" data-route="/quotes">
                  <i class="fas fa-calculator"></i>
                  Quotes
                  <span class="badge bg-secondary ms-auto">Soon</span>
                </a>
              </li>
            </ul>
          </div>

          <div class="nav-section">
            <h6 class="nav-header px-3 py-2 text-muted small">Legacy</h6>
            <ul class="nav flex-column">
              <li class="nav-item">
                <a class="nav-link" href="javascript:void(0)" onclick="window.app.switchTab('customers')">
                  <i class="fas fa-arrow-right"></i>
                  Original System
                  <small class="d-block text-muted">Full Feature Set</small>
                </a>
              </li>
            </ul>
          </div>
        </nav>

        <!-- Footer -->
        <div class="sidebar-footer mt-auto p-3 border-top">
          <small class="text-muted">
            <i class="fas fa-code"></i>
            Modular Architecture v1.0
          </small>
        </div>
      </div>

      <style>
        .sidebar-container {
          background: #f8f9fa;
          border-right: 1px solid #dee2e6;
          display: flex;
          flex-direction: column;
        }
        
        .sidebar-brand {
          border-bottom: 1px solid #dee2e6;
          background: white;
        }
        
        .nav-header {
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.75rem;
        }
        
        .sidebar-nav .nav-link {
          color: #495057;
          padding: 0.75rem 1rem;
          display: flex;
          align-items-center;
          border-radius: 0;
          transition: all 0.2s ease;
        }
        
        .sidebar-nav .nav-link:hover:not(.disabled) {
          background-color: rgba(0, 123, 255, 0.1);
          color: #007bff;
          border-left: 3px solid #007bff;
          padding-left: calc(1rem - 3px);
        }
        
        .sidebar-nav .nav-link.active {
          background-color: #007bff;
          color: white;
          border-left: 3px solid #0056b3;
          padding-left: calc(1rem - 3px);
        }
        
        .sidebar-nav .nav-link.disabled {
          color: #6c757d;
          cursor: not-allowed;
        }
        
        .sidebar-nav .nav-link i {
          width: 20px;
          margin-right: 0.5rem;
        }
        
        .nav-section {
          margin-bottom: 1rem;
        }
        
        .sidebar-footer {
          background: rgba(0, 0, 0, 0.02);
        }
      </style>
    `;
  }

  setupEventListeners() {
    // Listen for route changes to update active state
    window.addEventListener('hashchange', () => {
      this.updateActiveState();
    });

    // Handle navigation clicks
    this.container.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route]');
      if (link && !link.classList.contains('disabled')) {
        e.preventDefault();
        const route = link.getAttribute('data-route');
        window.location.hash = route;
      }
    });
  }

  updateActiveState() {
    // Remove all active states
    this.container.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    // Get current route and set active state
    const currentHash = window.location.hash.slice(1) || '/';
    const activeLink = this.container.querySelector(`[data-route="${currentHash}"]`) ||
                     this.container.querySelector(`[data-route="/customers"]`);
    
    if (activeLink && currentHash.startsWith('/customers')) {
      const customersLink = this.container.querySelector(`[data-route="/customers"]`);
      if (customersLink) {
        customersLink.classList.add('active');
      }
    } else if (activeLink) {
      activeLink.classList.add('active');
    }
  }
}

// Make globally accessible
window.Sidebar = Sidebar;

export default Sidebar;