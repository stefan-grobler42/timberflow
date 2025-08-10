// App Shell - Routes Configuration
// Simple hash-based routing for the modular system

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.init();
  }

  init() {
    // Register routes
    this.addRoute('/', () => this.renderDashboard());
    this.addRoute('/customers', () => this.renderCustomersList());
    this.addRoute('/customers/new', () => this.renderCustomerDetails('new'));
    this.addRoute('/customers/:id', (params) => this.renderCustomerDetails(params.id));
    this.addRoute('/customers/:id/edit', (params) => this.renderCustomerDetails(params.id));
    this.addRoute('/products', () => this.renderProductsList());
    this.addRoute('/products/new', () => this.renderProductDetails('new'));
    this.addRoute('/products/:id', (params) => this.renderProductDetails(params.id));
    this.addRoute('/products/:id/edit', (params) => this.renderProductDetails(params.id));

    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleRouteChange());
    window.addEventListener('load', () => this.handleRouteChange());
    
    // Handle initial route
    this.handleRouteChange();
  }

  addRoute(path, handler) {
    this.routes.set(path, handler);
  }

  handleRouteChange() {
    const hash = window.location.hash.slice(1) || '/';
    this.currentRoute = hash;
    this.navigateTo(hash);
  }

  navigateTo(path) {
    // Parse route parameters
    const params = this.parseParams(path);
    const handler = this.findRouteHandler(path, params);
    
    if (handler) {
      handler(params);
    } else {
      console.warn('Route not found:', path);
      this.renderNotFound();
    }
  }

  parseParams(path) {
    const params = {};
    const pathParts = path.split('/').filter(p => p);
    
    // Simple parameter parsing for :id patterns
    if (pathParts.length >= 2 && pathParts[0] === 'customers' && pathParts[1] !== 'new') {
      params.id = pathParts[1];
    }
    if (pathParts.length >= 2 && pathParts[0] === 'products' && pathParts[1] !== 'new') {
      params.id = pathParts[1];
    }
    
    return params;
  }

  findRouteHandler(path, params) {
    // Exact match first
    if (this.routes.has(path)) {
      return this.routes.get(path);
    }
    
    // Pattern matching for parameterized routes
    for (const [routePath, handler] of this.routes) {
      if (this.matchRoute(routePath, path)) {
        return handler;
      }
    }
    
    return null;
  }

  matchRoute(routePath, actualPath) {
    const routeParts = routePath.split('/').filter(p => p);
    const actualParts = actualPath.split('/').filter(p => p);
    
    if (routeParts.length !== actualParts.length) {
      return false;
    }
    
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        // Parameter - matches anything
        continue;
      } else if (routeParts[i] !== actualParts[i]) {
        return false;
      }
    }
    
    return true;
  }

  renderDashboard() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="container-fluid">
          <h1>Welcome to Millennium ERP</h1>
          <div class="row">
            <div class="col-md-4">
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">Customers</h5>
                  <p class="card-text">Manage your customer relationships</p>
                  <a href="#/customers" class="btn btn-primary">View Customers</a>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">Projects</h5>
                  <p class="card-text">Track your projects and progress</p>
                  <a href="#/projects" class="btn btn-primary">View Projects</a>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">Quotes</h5>
                  <p class="card-text">Generate and manage quotes</p>
                  <a href="#/quotes" class="btn btn-primary">View Quotes</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  renderCustomersList() {
    console.log('📋 Customers module mounted on /customers');
    
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.innerHTML = '<div id="customers-list-container"></div>';
      
      // Dynamically load and initialize the customers index component
      if (window.CustomersIndex) {
        new window.CustomersIndex('customers-list-container');
        console.log('✅ Customers list component initialized');
      } else {
        // Fallback if component not loaded
        console.warn('⚠️ CustomersIndex component not available');
        mainContent.innerHTML = '<div class="alert alert-warning">Customers module not loaded</div>';
      }
    }
  }

  renderCustomerDetails(customerId) {
    console.log(`📝 Customer details mounted for ID: ${customerId}`);
    
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.innerHTML = '<div id="customer-details-container"></div>';
      
      // Dynamically load and initialize the customer details component
      if (window.CustomerDetails) {
        new window.CustomerDetails('customer-details-container', customerId);
        console.log('✅ Customer details component initialized');
      } else {
        // Fallback if component not loaded
        console.warn('⚠️ CustomerDetails component not available');
        mainContent.innerHTML = '<div class="alert alert-warning">Customer details module not loaded</div>';
      }
    }
  }

  renderProductsList() {
    console.log('📦 Products module mounted on /products');
    
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.innerHTML = '<div id="products-list-container"></div>';
      
      // Dynamically load and initialize the products index component
      if (window.ProductsIndex) {
        new window.ProductsIndex('products-list-container');
        console.log('✅ Products list component initialized');
      } else {
        // Fallback if component not loaded
        console.warn('⚠️ ProductsIndex component not available');
        mainContent.innerHTML = '<div class="alert alert-warning">Products module not loaded</div>';
      }
    }
  }

  renderProductDetails(productId) {
    console.log(`📝 Product details mounted for ID: ${productId}`);
    
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.innerHTML = '<div id="product-details-container"></div>';
      
      // Dynamically load and initialize the product details component
      if (window.ProductDetails) {
        new window.ProductDetails('product-details-container', productId);
        console.log('✅ Product details component initialized');
      } else {
        // Fallback if component not loaded
        console.warn('⚠️ ProductDetails component not available');
        mainContent.innerHTML = '<div class="alert alert-warning">Product details module not loaded</div>';
      }
    }
  }

  renderNotFound() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="container-fluid">
          <div class="alert alert-danger">
            <h4>Page Not Found</h4>
            <p>The requested page could not be found.</p>
            <a href="#/" class="btn btn-primary">Go to Dashboard</a>
          </div>
        </div>
      `;
    }
  }
}

// Create and export the router instance
export const router = new Router();
export default router;