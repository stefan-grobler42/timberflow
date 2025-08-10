// Layout - Header Component
// Provides top navigation and user info for the modular system

class Header {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.user = null;
    
    if (!this.container) {
      console.error('Header: Container not found:', containerId);
      return;
    }
    
    this.init();
  }

  init() {
    this.loadUser();
    this.render();
    this.setupEventListeners();
  }

  loadUser() {
    // Get user from existing app if available
    if (window.app && window.app.currentUser) {
      this.user = window.app.currentUser;
    } else {
      // Fallback user
      this.user = {
        name: 'Development User',
        role: 'Administrator'
      };
    }
  }

  render() {
    this.container.innerHTML = `
      <header class="header-container">
        <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom">
          <div class="container-fluid px-3">
            <!-- Brand -->
            <div class="navbar-brand d-flex align-items-center">
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 100'%3E%3Cpath d='M20,80 L50,20 L80,80 M50,20 L80,20 L100,50' fill='%2354C3D6'/%3E%3Cpath d='M100,80 L130,20 L160,80 M130,20 L160,20 L180,50' fill='%23464746'/%3E%3Ctext x='20' y='95' font-family='Roboto' font-weight='700' font-size='24' fill='%2359AAD5'%3EMILLENNIUM%3C/text%3E%3C/svg%3E" 
                   alt="Millennium Roofing" height="40" class="me-2">
              <div>
                <span class="fw-bold text-primary">Millennium ERP</span>
                <small class="d-block text-muted">Modular System</small>
              </div>
            </div>

            <!-- Breadcrumb -->
            <div class="flex-grow-1 mx-4">
              <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-0" id="breadcrumb-nav">
                  <li class="breadcrumb-item"><a href="#/">Dashboard</a></li>
                </ol>
              </nav>
            </div>

            <!-- User Menu -->
            <div class="navbar-nav">
              <div class="nav-item dropdown">
                <a class="nav-link dropdown-toggle d-flex align-items-center" 
                   href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <div class="avatar-sm me-2">
                    <div class="avatar-sm-inner">
                      <i class="fas fa-user"></i>
                    </div>
                  </div>
                  <div class="d-none d-md-block">
                    <div class="fw-semibold">${this.user.name}</div>
                    <small class="text-muted">${this.user.role}</small>
                  </div>
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><h6 class="dropdown-header">Account</h6></li>
                  <li><a class="dropdown-item" href="#"><i class="fas fa-user me-2"></i>Profile</a></li>
                  <li><a class="dropdown-item" href="#"><i class="fas fa-cog me-2"></i>Settings</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><h6 class="dropdown-header">System</h6></li>
                  <li><a class="dropdown-item" href="javascript:void(0)" id="legacy-mode-btn">
                    <i class="fas fa-arrow-left me-2"></i>Legacy Mode
                  </a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item text-danger" href="#"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                </ul>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <style>
        .header-container {
          position: sticky;
          top: 0;
          z-index: 1020;
          background: white;
        }
        
        .avatar-sm {
          width: 40px;
          height: 40px;
          background: linear-gradient(45deg, #007bff, #0056b3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .avatar-sm-inner {
          color: white;
          font-size: 16px;
        }
        
        .breadcrumb-item a {
          color: #6c757d;
          text-decoration: none;
        }
        
        .breadcrumb-item a:hover {
          color: #007bff;
        }
        
        .breadcrumb-item.active {
          color: #007bff;
          font-weight: 500;
        }
      </style>
    `;
  }

  setupEventListeners() {
    // Update breadcrumb on route changes
    window.addEventListener('hashchange', () => {
      this.updateBreadcrumb();
    });

    // Legacy mode button
    const legacyBtn = this.container.querySelector('#legacy-mode-btn');
    if (legacyBtn) {
      legacyBtn.addEventListener('click', () => {
        // Hide modular interface and show original system
        this.toggleLegacyMode();
      });
    }

    // Initial breadcrumb update
    this.updateBreadcrumb();
  }

  updateBreadcrumb() {
    const breadcrumbNav = this.container.querySelector('#breadcrumb-nav');
    if (!breadcrumbNav) return;

    const currentHash = window.location.hash.slice(1) || '/';
    let breadcrumbHTML = '<li class="breadcrumb-item"><a href="#/">Dashboard</a></li>';

    if (currentHash.startsWith('/customers')) {
      breadcrumbHTML += '<li class="breadcrumb-item"><a href="#/customers">Customers</a></li>';
      
      if (currentHash === '/customers/new') {
        breadcrumbHTML += '<li class="breadcrumb-item active">New Customer</li>';
      } else if (currentHash.match(/^\/customers\/\d+/)) {
        const customerId = currentHash.split('/')[2];
        breadcrumbHTML += `<li class="breadcrumb-item active">Customer ${customerId}</li>`;
      }
    } else if (currentHash !== '/') {
      const pageName = currentHash.replace('/', '').charAt(0).toUpperCase() + 
                     currentHash.replace('/', '').slice(1);
      breadcrumbHTML += `<li class="breadcrumb-item active">${pageName}</li>`;
    }

    breadcrumbNav.innerHTML = breadcrumbHTML;
  }

  toggleLegacyMode() {
    // Switch back to the original system
    const modularContainer = document.getElementById('modular-app-container');
    const originalContainer = document.querySelector('.container-fluid[style*="margin-top"]');
    
    if (modularContainer) {
      modularContainer.style.display = 'none';
    }
    
    if (originalContainer) {
      originalContainer.style.display = 'block';
    }
    
    // Switch to customers tab in original system
    if (window.app) {
      window.app.switchTab('customers');
    }
  }
}

// Make globally accessible
window.Header = Header;

export default Header;