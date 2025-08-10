// Universal Header Bar Component
// Provides navigation, search, and contextual actions
class HeaderBar {
  constructor(containerId = 'header-bar') {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.searchTerm = '';
    this.actions = [];
    
    if (!this.container) {
      console.error('HeaderBar: Container not found:', containerId);
      return;
    }
    
    this.init();
  }

  init() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <header class="header-bar bg-white border-bottom shadow-sm">
        <div class="container-fluid">
          <div class="row align-items-center py-2">
            <!-- Left: Back Button -->
            <div class="col-auto">
              <button type="button" class="btn btn-link text-muted p-1" id="back-btn" title="Go Back">
                <i class="fas fa-arrow-left"></i>
              </button>
            </div>
            
            <!-- Center: Global Search -->
            <div class="col">
              <div class="search-container position-relative">
                <input 
                  type="text" 
                  class="form-control search-input" 
                  placeholder="Search customers, projects, quotes..."
                  id="global-search"
                  value="${this.searchTerm}"
                >
                <i class="fas fa-search search-icon position-absolute text-muted"></i>
              </div>
            </div>
            
            <!-- Right: Actions and User -->
            <div class="col-auto">
              <div class="d-flex align-items-center gap-2">
                <!-- Contextual Actions -->
                <div class="header-actions d-flex gap-1" id="header-actions">
                  ${this.renderActions()}
                </div>
                
                <!-- User Menu -->
                <div class="dropdown">
                  <button class="btn btn-link text-muted p-1" type="button" data-bs-toggle="dropdown">
                    <i class="fas fa-user-circle fs-5"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="#"><i class="fas fa-user me-2"></i>Profile</a></li>
                    <li><a class="dropdown-item" href="#"><i class="fas fa-cog me-2"></i>Settings</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <style>
        .header-bar {
          background: linear-gradient(135deg, #59AAD5 0%, #54C3D6 100%);
          border-bottom: 1px solid #e9ecef;
          position: sticky;
          top: 0;
          z-index: 1020;
        }
        
        .search-container {
          max-width: 400px;
          margin: 0 auto;
        }
        
        .search-input {
          padding-left: 2.5rem;
          border: 1px solid #dee2e6;
          border-radius: 0.375rem;
          background: rgba(255, 255, 255, 0.9);
          transition: all 0.15s ease-in-out;
        }
        
        .search-input:focus {
          background: #fff;
          border-color: #59AAD5;
          box-shadow: 0 0 0 0.2rem rgba(89, 170, 213, 0.25);
        }
        
        .search-icon {
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }
        
        .header-actions .btn {
          font-size: 0.875rem;
          padding: 0.375rem 0.75rem;
          border-radius: 0.25rem;
        }
        
        .btn-primary {
          background-color: #59AAD5;
          border-color: #59AAD5;
        }
        
        .btn-primary:hover {
          background-color: #4a91b8;
          border-color: #4a91b8;
        }
        
        .btn-outline-primary {
          color: #59AAD5;
          border-color: #59AAD5;
        }
        
        .btn-outline-primary:hover {
          background-color: #59AAD5;
          border-color: #59AAD5;
        }
        
        .dropdown-menu {
          border: 1px solid #dee2e6;
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        }
      </style>
    `;
  }

  renderActions() {
    if (!this.actions || this.actions.length === 0) {
      return '';
    }
    
    return this.actions.map(action => {
      const variant = action.variant || 'outline-primary';
      const icon = action.icon ? `<i class="${action.icon} me-1"></i>` : '';
      
      return `
        <button 
          type="button" 
          class="btn btn-${variant}" 
          id="action-${action.id}"
          title="${action.label}"
        >
          ${icon}${action.label}
        </button>
      `;
    }).join('');
  }

  setupEventListeners() {
    // Back button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          // Fallback to home if no history
          window.location.hash = '#/';
        }
      });
    }

    // Global search
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        this.onSearch(this.searchTerm);
      });
      
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.onSearchSubmit(this.searchTerm);
        }
      });
    }

    // Action buttons
    this.actions.forEach(action => {
      const btn = document.getElementById(`action-${action.id}`);
      if (btn && action.onClick) {
        btn.addEventListener('click', action.onClick);
      }
    });
  }

  // Update actions from CommandRegistry
  updateActions(actions) {
    this.actions = actions || [];
    
    // Re-render actions area only
    const actionsContainer = document.getElementById('header-actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = this.renderActions();
      
      // Re-bind action listeners
      this.actions.forEach(action => {
        const btn = document.getElementById(`action-${action.id}`);
        if (btn && action.onClick) {
          btn.addEventListener('click', action.onClick);
        }
      });
    }
  }

  // Search callbacks (can be overridden)
  onSearch(term) {
    // Debounced search implementation would go here
    console.log('Global search:', term);
  }

  onSearchSubmit(term) {
    // Submit search implementation would go here
    console.log('Global search submit:', term);
  }

  // Update search term programmatically
  setSearchTerm(term) {
    this.searchTerm = term;
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      searchInput.value = term;
    }
  }

  // Show/hide the header
  show() {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }
}

// Make available globally
window.HeaderBar = HeaderBar;