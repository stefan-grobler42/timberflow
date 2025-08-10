// Products List Module
class ProductsIndex {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.products = [];
    this.filteredProducts = [];
    this.dataGrid = null;
    this.searchTerm = '';
    
    if (!this.container) {
      console.error('ProductsIndex: Container not found:', containerId);
      return;
    }
    
    this.init();
  }
  
  async init() {
    console.log('ProductsIndex: Initializing...');
    await this.loadProducts();
    this.render();
    console.log('ProductsIndex: Ready');
  }
  
  async loadProducts() {
    try {
      if (window.ProductsAPI) {
        this.products = await window.ProductsAPI.getAll();
      } else {
        // Fallback sample data
        this.products = [
          { id: 1, name: 'Steel Roofing Sheet', sku: 'SRS-001', price: 250.00 },
          { id: 2, name: 'Cedar Shingles', sku: 'CS-002', price: 180.50 },
          { id: 3, name: 'Aluminum Gutters', sku: 'AG-003', price: 75.25 },
          { id: 4, name: 'Roof Insulation', sku: 'RI-004', price: 45.00 },
          { id: 5, name: 'Flashing Kit', sku: 'FK-005', price: 120.75 }
        ];
      }
      this.filteredProducts = [...this.products];
    } catch (error) {
      console.error('Failed to load products:', error);
      this.products = [];
      this.filteredProducts = [];
    }
  }
  
  render() {
    this.container.innerHTML = `
      <div class="products-module">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>Products</h2>
            <p class="text-muted mb-0">Manage product catalog and pricing</p>
          </div>
          <button class="btn btn-primary" onclick="this.addNewProduct()">
            <i class="fas fa-plus"></i> Add Product
          </button>
        </div>
        
        <div class="card">
          <div class="card-header">
            <div class="row align-items-center">
              <div class="col-md-6">
                <div class="input-group">
                  <span class="input-group-text">
                    <i class="fas fa-search"></i>
                  </span>
                  <input type="text" class="form-control" placeholder="Search products..." 
                         id="products-search" value="${this.searchTerm}">
                </div>
              </div>
              <div class="col-md-6 text-end">
                <span class="text-muted">${this.filteredProducts.length} products</span>
              </div>
            </div>
          </div>
          <div class="card-body p-0">
            <div id="products-grid"></div>
          </div>
        </div>
      </div>
    `;
    
    this.initializeDataGrid();
    this.setupEventListeners();
  }
  
  initializeDataGrid() {
    const gridContainer = document.getElementById('products-grid');
    if (!gridContainer) return;
    
    const columns = [
      {
        key: 'name',
        title: 'Product Name',
        sortable: true,
        width: '40%',
        renderer: (value, row) => `
          <div class="fw-bold">${value}</div>
          <small class="text-muted">SKU: ${row.sku || 'N/A'}</small>
        `
      },
      {
        key: 'price',
        title: 'Price',
        sortable: true,
        width: '20%',
        renderer: (value) => `<span class="fw-bold text-success">R ${parseFloat(value || 0).toFixed(2)}</span>`
      },
      {
        key: 'sku',
        title: 'SKU',
        sortable: true,
        width: '20%'
      },
      {
        key: 'actions',
        title: 'Actions',
        width: '20%',
        renderer: (value, row) => `
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" onclick="window.productsIndex.editProduct(${row.id})" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-outline-info" onclick="window.productsIndex.viewProduct(${row.id})" title="View">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-outline-danger" onclick="window.productsIndex.deleteProduct(${row.id})" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `
      }
    ];
    
    if (window.DataGrid) {
      this.dataGrid = new window.DataGrid(gridContainer, {
        data: this.filteredProducts,
        columns: columns,
        rowsPerPage: 25,
        showPagination: true,
        onRowClick: (row) => this.viewProduct(row.id)
      });
    } else {
      // Fallback simple table
      this.renderSimpleTable(gridContainer);
    }
    
    // Store reference for global access
    window.productsIndex = this;
  }
  
  renderSimpleTable(container) {
    const tableHtml = `
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${this.filteredProducts.map(product => `
            <tr onclick="window.productsIndex.viewProduct(${product.id})" style="cursor: pointer;">
              <td>
                <div class="fw-bold">${product.name}</div>
                <small class="text-muted">SKU: ${product.sku || 'N/A'}</small>
              </td>
              <td>${product.sku || 'N/A'}</td>
              <td><span class="fw-bold text-success">R ${parseFloat(product.price || 0).toFixed(2)}</span></td>
              <td>
                <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); window.productsIndex.editProduct(${product.id})" title="Edit">
                  <i class="fas fa-edit"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    container.innerHTML = tableHtml;
  }
  
  setupEventListeners() {
    const searchInput = document.getElementById('products-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        this.filterProducts();
      });
    }
  }
  
  filterProducts() {
    const term = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(product => 
      product.name.toLowerCase().includes(term) ||
      (product.sku && product.sku.toLowerCase().includes(term))
    );
    
    if (this.dataGrid) {
      this.dataGrid.updateData(this.filteredProducts);
    } else {
      const gridContainer = document.getElementById('products-grid');
      if (gridContainer) {
        this.renderSimpleTable(gridContainer);
      }
    }
    
    // Update count
    const countElement = this.container.querySelector('.text-muted');
    if (countElement) {
      countElement.textContent = `${this.filteredProducts.length} products`;
    }
  }
  
  addNewProduct() {
    window.location.hash = '/products/new';
  }
  
  viewProduct(productId) {
    window.location.hash = `/products/${productId}`;
  }
  
  editProduct(productId) {
    window.location.hash = `/products/${productId}`;
  }
  
  async deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    try {
      if (window.ProductsAPI) {
        await window.ProductsAPI.delete(productId);
      }
      
      // Remove from local data
      this.products = this.products.filter(p => p.id !== productId);
      this.filterProducts();
      
      // Show success message
      if (window.app && window.app.showAlert) {
        window.app.showAlert('Product deleted successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      if (window.app && window.app.showAlert) {
        window.app.showAlert('Failed to delete product', 'danger');
      }
    }
  }
}

// Export for global access
window.ProductsIndex = ProductsIndex;