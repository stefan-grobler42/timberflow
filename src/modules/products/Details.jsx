// Products Details Module
class ProductDetails {
  constructor(containerId, productId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.productId = productId;
    this.product = null;
    this.originalProduct = null;
    this.hasUnsavedChanges = false;
    this.isNewProduct = productId === 'new';
    
    if (!this.container) {
      console.error('ProductDetails: Container not found:', containerId);
      return;
    }
    
    this.init();
  }
  
  async init() {
    console.log('ProductDetails: Initializing for product:', this.productId);
    
    if (!this.isNewProduct) {
      await this.loadProduct();
    } else {
      this.product = this.getEmptyProduct();
      this.originalProduct = { ...this.product };
    }
    
    this.render();
    this.setupAutoSave();
    console.log('ProductDetails: Ready');
  }
  
  getEmptyProduct() {
    return {
      id: null,
      name: '',
      sku: '',
      price: 0.00,
      description: '',
      category: '',
      unitOfMeasure: 'Each',
      active: true,
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString()
    };
  }
  
  async loadProduct() {
    try {
      if (window.ProductsAPI) {
        this.product = await window.ProductsAPI.getById(this.productId);
      } else {
        // Fallback sample data
        this.product = {
          id: this.productId,
          name: 'Steel Roofing Sheet',
          sku: 'SRS-001',
          price: 250.00,
          description: 'High-quality corrugated steel roofing sheet',
          category: 'Roofing Materials',
          unitOfMeasure: 'Each',
          active: true,
          createdDate: '2024-01-15T10:30:00Z',
          modifiedDate: '2024-08-10T14:20:00Z'
        };
      }
      
      this.originalProduct = { ...this.product };
    } catch (error) {
      console.error('Failed to load product:', error);
      this.product = this.getEmptyProduct();
      this.originalProduct = { ...this.product };
    }
  }
  
  render() {
    const title = this.isNewProduct ? 'New Product' : `Product: ${this.product.name}`;
    
    this.container.innerHTML = `
      <div class="product-details">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>${title}</h2>
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item">
                  <a href="#/products" onclick="window.location.hash='/products'; return false;">Products</a>
                </li>
                <li class="breadcrumb-item active">${this.isNewProduct ? 'New Product' : this.product.name}</li>
              </ol>
            </nav>
          </div>
          <div class="btn-group">
            <button class="btn btn-outline-secondary" onclick="this.goBack()">
              <i class="fas fa-arrow-left"></i> Back
            </button>
            <button class="btn btn-success" onclick="this.save()" ${this.hasUnsavedChanges ? '' : 'disabled'}>
              <i class="fas fa-save"></i> Save
            </button>
          </div>
        </div>
        
        ${this.hasUnsavedChanges ? `
          <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle"></i>
            You have unsaved changes. Changes are automatically saved as you type.
            <button class="btn btn-sm btn-outline-warning ms-2" onclick="this.undoChanges()">
              <i class="fas fa-undo"></i> Undo Changes
            </button>
          </div>
        ` : ''}
        
        <div class="row">
          <div class="col-lg-8">
            <div class="card">
              <div class="card-header">
                <h5><i class="fas fa-info-circle"></i> Product Information</h5>
              </div>
              <div class="card-body">
                <form id="product-form">
                  <div class="row">
                    <div class="col-md-8">
                      <div class="mb-3">
                        <label for="name" class="form-label">Product Name *</label>
                        <input type="text" class="form-control" id="name" name="name" 
                               value="${this.product.name}" required>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="mb-3">
                        <label for="sku" class="form-label">SKU</label>
                        <input type="text" class="form-control" id="sku" name="sku" 
                               value="${this.product.sku || ''}">
                      </div>
                    </div>
                  </div>
                  
                  <div class="row">
                    <div class="col-md-4">
                      <div class="mb-3">
                        <label for="price" class="form-label">Price *</label>
                        <div class="input-group">
                          <span class="input-group-text">R</span>
                          <input type="number" class="form-control" id="price" name="price" 
                                 value="${this.product.price || 0}" step="0.01" min="0" required>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="mb-3">
                        <label for="category" class="form-label">Category</label>
                        <input type="text" class="form-control" id="category" name="category" 
                               value="${this.product.category || ''}">
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="mb-3">
                        <label for="unitOfMeasure" class="form-label">Unit of Measure</label>
                        <select class="form-select" id="unitOfMeasure" name="unitOfMeasure">
                          <option value="Each" ${this.product.unitOfMeasure === 'Each' ? 'selected' : ''}>Each</option>
                          <option value="Metre" ${this.product.unitOfMeasure === 'Metre' ? 'selected' : ''}>Metre</option>
                          <option value="Square Metre" ${this.product.unitOfMeasure === 'Square Metre' ? 'selected' : ''}>Square Metre</option>
                          <option value="Kilogram" ${this.product.unitOfMeasure === 'Kilogram' ? 'selected' : ''}>Kilogram</option>
                          <option value="Litre" ${this.product.unitOfMeasure === 'Litre' ? 'selected' : ''}>Litre</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div class="mb-3">
                    <label for="description" class="form-label">Description</label>
                    <textarea class="form-control" id="description" name="description" rows="3">${this.product.description || ''}</textarea>
                  </div>
                  
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="active" name="active" 
                           ${this.product.active ? 'checked' : ''}>
                    <label class="form-check-label" for="active">
                      Active Product
                    </label>
                  </div>
                </form>
              </div>
            </div>
          </div>
          
          <div class="col-lg-4">
            <div class="card">
              <div class="card-header">
                <h6><i class="fas fa-info"></i> Product Details</h6>
              </div>
              <div class="card-body">
                <div class="row mb-2">
                  <div class="col-sm-4"><strong>ID:</strong></div>
                  <div class="col-sm-8">${this.product.id || 'New Product'}</div>
                </div>
                <div class="row mb-2">
                  <div class="col-sm-4"><strong>Created:</strong></div>
                  <div class="col-sm-8">${this.product.createdDate ? new Date(this.product.createdDate).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div class="row mb-2">
                  <div class="col-sm-4"><strong>Modified:</strong></div>
                  <div class="col-sm-8">${this.product.modifiedDate ? new Date(this.product.modifiedDate).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div class="row mb-2">
                  <div class="col-sm-4"><strong>Status:</strong></div>
                  <div class="col-sm-8">
                    <span class="badge ${this.product.active ? 'bg-success' : 'bg-secondary'}">
                      ${this.product.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            ${!this.isNewProduct ? `
              <div class="card mt-3">
                <div class="card-header">
                  <h6><i class="fas fa-chart-line"></i> Quick Stats</h6>
                </div>
                <div class="card-body">
                  <div class="row text-center">
                    <div class="col-6">
                      <div class="border-end">
                        <h4 class="text-primary mb-0">-</h4>
                        <small class="text-muted">Total Sales</small>
                      </div>
                    </div>
                    <div class="col-6">
                      <h4 class="text-success mb-0">-</h4>
                      <small class="text-muted">Revenue</small>
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    this.setupFormEventListeners();
  }
  
  setupFormEventListeners() {
    const form = document.getElementById('product-form');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        this.detectChanges();
      });
      input.addEventListener('change', () => {
        this.detectChanges();
      });
    });
  }
  
  setupAutoSave() {
    // Auto-save when navigating away
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges) {
        this.autoSave();
      }
    });
    
    // Auto-save on hash change
    window.addEventListener('hashchange', () => {
      if (this.hasUnsavedChanges) {
        this.autoSave();
      }
    });
  }
  
  detectChanges() {
    const formData = this.getFormData();
    this.hasUnsavedChanges = JSON.stringify(formData) !== JSON.stringify(this.originalProduct);
    
    // Update save button state
    const saveBtn = this.container.querySelector('.btn-success');
    if (saveBtn) {
      saveBtn.disabled = !this.hasUnsavedChanges;
    }
    
    // Update product object
    Object.assign(this.product, formData);
    
    // Re-render alerts if needed
    if (this.hasUnsavedChanges) {
      const existingAlert = this.container.querySelector('.alert-warning');
      if (!existingAlert) {
        this.render();
      }
    }
  }
  
  getFormData() {
    const form = document.getElementById('product-form');
    if (!form) return this.product;
    
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      if (key === 'active') {
        data[key] = form.querySelector(`[name="${key}"]`).checked;
      } else if (key === 'price') {
        data[key] = parseFloat(value) || 0;
      } else {
        data[key] = value;
      }
    }
    
    return { ...this.product, ...data };
  }
  
  async save() {
    const formData = this.getFormData();
    
    // Validation
    if (!formData.name?.trim()) {
      alert('Product name is required');
      document.getElementById('name').focus();
      return;
    }
    
    try {
      if (window.ProductsAPI) {
        if (this.isNewProduct) {
          this.product = await window.ProductsAPI.create(formData);
        } else {
          this.product = await window.ProductsAPI.update(this.productId, formData);
        }
      } else {
        // Simulate save
        this.product = { ...formData, id: this.isNewProduct ? Date.now() : this.productId };
      }
      
      this.originalProduct = { ...this.product };
      this.hasUnsavedChanges = false;
      
      if (window.app && window.app.showAlert) {
        window.app.showAlert('Product saved successfully', 'success');
      }
      
      // Redirect to view mode if it was a new product
      if (this.isNewProduct) {
        window.location.hash = `/products/${this.product.id}`;
      } else {
        this.render();
      }
      
    } catch (error) {
      console.error('Failed to save product:', error);
      if (window.app && window.app.showAlert) {
        window.app.showAlert('Failed to save product', 'danger');
      }
    }
  }
  
  async autoSave() {
    if (!this.hasUnsavedChanges) return;
    
    try {
      await this.save();
      console.log('Product auto-saved');
    } catch (error) {
      console.warn('Auto-save failed:', error);
    }
  }
  
  undoChanges() {
    this.product = { ...this.originalProduct };
    this.hasUnsavedChanges = false;
    this.render();
  }
  
  goBack() {
    if (this.hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Do you want to save before leaving?')) {
        this.save().then(() => {
          window.location.hash = '/products';
        });
        return;
      }
    }
    window.location.hash = '/products';
  }
}

// Export for global access
window.ProductDetails = ProductDetails;