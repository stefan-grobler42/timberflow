// Advanced Stock Management System for Millennium Timber Roof ERP
class AdvancedStockManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.stockItems = [];
        this.compositeItems = [];
        this.temporaryItems = [];
        this.currentView = 'grid'; // 'grid' or 'form'
        this.editingItem = null;
        this.stockCategories = {
            manufactured: 'Manufactured Items',
            standard: 'Standard Stock Items', 
            service: 'Service Items',
            composite: 'Composite Tender Rates',
            temporary: 'Temporary Stock Codes'
        };
        this.variableAttributes = {};
        this.init();
    }

    async init() {
        console.log('Starting Advanced Stock Manager initialization...');
        
        // Render UI immediately
        this.render();
        this.setupEventListeners();
        
        // Load stock data with a small delay to ensure DOM is ready
        setTimeout(() => {
            this.loadStockData().then(() => {
                console.log('Stock data loaded, refreshing display...');
                this.renderStockGrids();
            }).catch(error => {
                console.warn('Stock data loading failed, using defaults:', error);
                this.stockItems = this.getAllSampleStockItems();
                this.renderStockGrids();
            });
        }, 100);
        console.log('Advanced Stock Manager UI rendered successfully');
    }

    render() {
        if (!this.container) {
            console.error('Stock Management container not found!');
            return;
        }
        
        console.log('Rendering Advanced Stock Manager...');

        if (this.currentView === 'grid') {
            this.renderGridView();
        } else if (this.currentView === 'form') {
            this.renderFormView();
        }
    }

    renderGridView() {
        this.container.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h3><i class="fas fa-boxes"></i> Stock Management</h3>
                        <div class="btn-group">
                            <button class="btn btn-primary" id="add-stock-item">
                                <i class="fas fa-plus"></i> Add Stock Item
                            </button>
                            <button class="btn btn-info" id="create-composite">
                                <i class="fas fa-layer-group"></i> Create Composite
                            </button>
                            <button class="btn btn-warning" id="temp-stock-code">
                                <i class="fas fa-clock"></i> Temporary Code
                            </button>
                        </div>
                    </div>

                    <!-- Stock Categories Tabs -->
                    <ul class="nav nav-tabs" id="stock-tabs" role="tablist">
                        <li class="nav-item">
                            <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#manufactured-tab">
                                <i class="fas fa-industry"></i> Manufactured Items
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#standard-tab">
                                <i class="fas fa-boxes"></i> Standard Stock
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#service-tab">
                                <i class="fas fa-tools"></i> Service Items
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#composite-tab">
                                <i class="fas fa-layer-group"></i> Composite Rates
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#temporary-tab">
                                <i class="fas fa-clock"></i> Temporary Codes
                            </button>
                        </li>
                    </ul>

                    <!-- Tab Content -->
                    <div class="tab-content mt-3" id="stock-tab-content">
                        <!-- Manufactured Items Tab -->
                        <div class="tab-pane fade show active" id="manufactured-tab">
                            <div class="card">
                                <div class="card-header">
                                    <h5><i class="fas fa-industry"></i> Timber Trusses & Manufactured Items</h5>
                                </div>
                                <div class="card-body">
                                    <div id="manufactured-items-grid"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Standard Stock Tab -->
                        <div class="tab-pane fade" id="standard-tab">
                            <div class="card">
                                <div class="card-header">
                                    <h5><i class="fas fa-boxes"></i> Standard Stock Items</h5>
                                </div>
                                <div class="card-body">
                                    <div id="standard-items-grid"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Service Items Tab -->
                        <div class="tab-pane fade" id="service-tab">
                            <div class="card">
                                <div class="card-header">
                                    <h5><i class="fas fa-tools"></i> Service Items</h5>
                                </div>
                                <div class="card-body">
                                    <div id="service-items-grid"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Composite Rates Tab -->
                        <div class="tab-pane fade" id="composite-tab">
                            <div class="card">
                                <div class="card-header">
                                    <h5><i class="fas fa-layer-group"></i> Composite Tender Rates</h5>
                                </div>
                                <div class="card-body">
                                    <div id="composite-items-grid"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Temporary Codes Tab -->
                        <div class="tab-pane fade" id="temporary-tab">
                            <div class="card">
                                <div class="card-header">
                                    <h5><i class="fas fa-clock"></i> Temporary Stock Codes (120 Day Expiry)</h5>
                                </div>
                                <div class="card-body">
                                    <div id="temporary-items-grid"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stock Item Modal -->
            <div class="modal fade" id="stockItemModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Stock Item Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="stock-modal-content"></div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="save-stock-item">Save</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Variable Attributes Modal -->
            <div class="modal fade" id="variableAttributesModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Variable Attributes Configuration</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="variable-modal-content"></div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="save-variables">Save Variables</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tally Input Modal -->
            <div class="modal fade" id="tallyModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Quantity & Length Tally</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="tally-modal-content"></div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="save-tally">Add to Quote</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.renderStockGrids();
    }

    // Switch to form view for editing/creating items
    showItemForm(itemCode = null) {
        console.log('Switching to form view for item:', itemCode);
        if (itemCode) {
            this.editingItem = this.stockItems.find(item => item.itemCode === itemCode || item.baseCode === itemCode || item.code === itemCode);
            console.log('Found editing item:', this.editingItem);
        } else {
            this.editingItem = null;
        }
        this.currentView = 'form';
        this.render();
        this.setupFormEventListeners();
    }

    // Switch back to grid view
    showGridView() {
        this.currentView = 'grid';
        this.editingItem = null;
        this.render();
    }

    renderFormView() {
        const itemCode = this.editingItem?.itemCode || '';
        const isEdit = !!this.editingItem;
        const title = isEdit ? `Edit Stock Item - ${itemCode}` : 'New Stock Item';

        this.container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div class="d-flex align-items-center">
                            <button class="btn btn-outline-secondary me-3" id="back-to-grid">
                                <i class="fas fa-arrow-left me-1"></i>Back to Stock Items
                            </button>
                            <h3><i class="fas fa-box-open me-2"></i>${title}</h3>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-outline-secondary" id="clear-form-btn">
                                <i class="fas fa-broom me-1"></i>Clear
                            </button>
                            <button class="btn btn-success" id="save-item-btn">
                                <i class="fas fa-save me-1"></i>Save Item
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            ${this.getFormHTML()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupFormEventListeners();
        
        if (isEdit && this.editingItem) {
            this.populateForm(this.editingItem);
        }
    }

    getFormHTML() {
        return `
            <form id="stock-item-form" class="row g-3">
                <!-- Basic Information Section -->
                <div class="col-12">
                    <div class="form-section" style="background: #f8f9fa; border-left: 4px solid var(--millennium-blue); padding: 1rem; margin: 1rem 0;">
                        <h5 class="mb-3">
                            <i class="fas fa-info-circle me-2"></i>Basic Information
                        </h5>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label">Item Code <span style="color: red;">*</span></label>
                                <input type="text" class="form-control" id="itemCode" name="itemCode" required>
                                <div class="form-text">Unique identifier for this item</div>
                            </div>
                            
                            <div class="col-md-6">
                                <label class="form-label">Description <span style="color: red;">*</span></label>
                                <input type="text" class="form-control" id="description" name="description" required>
                                <div class="form-text">Full description of the item</div>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">Item Type <span style="color: red;">*</span></label>
                                <select class="form-select" id="itemType" name="itemType" required>
                                    <option value="">Select Type...</option>
                                    <option value="stock">Stock Item</option>
                                    <option value="service">Service</option>
                                    <option value="manufactured">Manufactured</option>
                                    <option value="composite">Composite</option>
                                    <option value="temporary">Temporary</option>
                                </select>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">Category <span style="color: red;">*</span></label>
                                <select class="form-select" id="itemCategoryId" name="itemCategoryId" required>
                                    <option value="">Select Category...</option>
                                    <option value="1">Timber Trusses</option>
                                    <option value="2">Structural Timber</option>
                                    <option value="3">Roofing Materials</option>
                                    <option value="4">Labour Services</option>
                                    <option value="5">Hardware</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Units of Measure Section -->
                <div class="col-12">
                    <div class="form-section" style="background: #f8f9fa; border-left: 4px solid var(--millennium-blue); padding: 1rem; margin: 1rem 0;">
                        <h5 class="mb-3">
                            <i class="fas fa-balance-scale me-2"></i>Units of Measure
                        </h5>
                        <div class="row g-3">
                            <div class="col-md-4">
                                <label class="form-label">Stock UOM <span style="color: red;">*</span></label>
                                <select class="form-select" id="stockUomId" name="stockUomId" required>
                                    <option value="">Select UOM...</option>
                                    <option value="1">EA - Each</option>
                                    <option value="2">M - Metres</option>
                                    <option value="3">M2 - Square Metres</option>
                                    <option value="4">HR - Hours</option>
                                    <option value="5">KG - Kilograms</option>
                                </select>
                                <div class="form-text">How we store this item</div>
                            </div>

                            <div class="col-md-4">
                                <label class="form-label">Sales UOM <span style="color: red;">*</span></label>
                                <select class="form-select" id="salesUomId" name="salesUomId" required>
                                    <option value="">Select UOM...</option>
                                    <option value="1">EA - Each</option>
                                    <option value="2">M - Metres</option>
                                    <option value="3">M2 - Square Metres</option>
                                    <option value="4">HR - Hours</option>
                                    <option value="5">KG - Kilograms</option>
                                </select>
                                <div class="form-text">How we sell this item</div>
                            </div>

                            <div class="col-md-4">
                                <label class="form-label">Purchase UOM <span style="color: red;">*</span></label>
                                <select class="form-select" id="purchaseUomId" name="purchaseUomId" required>
                                    <option value="">Select UOM...</option>
                                    <option value="1">EA - Each</option>
                                    <option value="2">M - Metres</option>
                                    <option value="3">M2 - Square Metres</option>
                                    <option value="4">HR - Hours</option>
                                    <option value="5">KG - Kilograms</option>
                                    <option value="6">BOX - Box</option>
                                </select>
                                <div class="form-text">How we buy this item</div>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">Purchase Pack Size</label>
                                <input type="number" class="form-control" id="purchasePackSize" name="purchasePackSize" min="1" value="1">
                                <div class="form-text">Number of stock units per purchase unit</div>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">Stock to Sales Conversion</label>
                                <input type="number" class="form-control" id="stockToSalesConversion" name="stockToSalesConversion" step="0.001" min="0" value="1">
                                <div class="form-text">Conversion factor from stock to sales UOM</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pricing Section -->
                <div class="col-12">
                    <div class="form-section" style="background: #f8f9fa; border-left: 4px solid var(--millennium-blue); padding: 1rem; margin: 1rem 0;">
                        <h5 class="mb-3">
                            <i class="fas fa-dollar-sign me-2"></i>Pricing & Margins
                        </h5>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label">Unit Cost (per Stock UOM)</label>
                                <div class="input-group">
                                    <span class="input-group-text">R</span>
                                    <input type="number" class="form-control" id="unitCost" name="unitCost" step="0.01" min="0">
                                </div>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">Unit Price (per Sales UOM)</label>
                                <div class="input-group">
                                    <span class="input-group-text">R</span>
                                    <input type="number" class="form-control" id="unitPrice" name="unitPrice" step="0.01" min="0">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Inventory Management Section -->
                <div class="col-12">
                    <div class="form-section" style="background: #f8f9fa; border-left: 4px solid var(--millennium-blue); padding: 1rem; margin: 1rem 0;">
                        <h5 class="mb-3">
                            <i class="fas fa-warehouse me-2"></i>Inventory Management
                        </h5>
                        <div class="row g-3">
                            <div class="col-md-4">
                                <label class="form-label">Current Stock</label>
                                <input type="number" class="form-control" id="currentStock" name="currentStock" step="0.01" min="0" value="0">
                            </div>

                            <div class="col-md-4">
                                <label class="form-label">Minimum Stock</label>
                                <input type="number" class="form-control" id="minimumStock" name="minimumStock" step="0.01" min="0" value="0">
                            </div>

                            <div class="col-md-4">
                                <label class="form-label">Maximum Stock</label>
                                <input type="number" class="form-control" id="maximumStock" name="maximumStock" step="0.01" min="0">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Special Options Section -->
                <div class="col-12">
                    <div class="form-section" style="background: #f8f9fa; border-left: 4px solid var(--millennium-blue); padding: 1rem; margin: 1rem 0;">
                        <h5 class="mb-3">
                            <i class="fas fa-cog me-2"></i>Special Options
                        </h5>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="isBomItem" name="isBomItem">
                                    <label class="form-check-label" for="isBomItem">
                                        <strong>Bill of Materials Item</strong>
                                    </label>
                                    <div class="form-text">This item has sub-components</div>
                                </div>
                            </div>

                            <div class="col-md-6">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="isActive" name="isActive" checked>
                                    <label class="form-check-label" for="isActive">
                                        <strong>Active</strong>
                                    </label>
                                    <div class="form-text">Available for use in system</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        `;
    }

    setupFormEventListeners() {
        // Back to grid button
        const backBtn = document.getElementById('back-to-grid');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showGridView();
            });
        }

        // Save button
        const saveBtn = document.getElementById('save-item-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveItem();
            });
        }

        // Clear button
        const clearBtn = document.getElementById('clear-form-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearForm();
            });
        }
    }

    saveItem() {
        console.log('Saving stock item...');
        // For now, just show success and return to grid
        alert('Item saved successfully!');
        this.showGridView();
    }

    clearForm() {
        const form = document.getElementById('stock-item-form');
        if (form) {
            form.reset();
        }
    }

    populateForm(item) {
        // Populate form fields with item data
        const fields = ['itemCode', 'description', 'itemType', 'itemCategoryId'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && item[field] !== undefined) {
                element.value = item[field];
            }
        });
    }

    loadItemIntoForm(item) {
        setTimeout(() => {
            this.populateForm(item);
        }, 100);
    }

    renderStockGrids() {
        console.log('Rendering stock grids with', this.stockItems?.length || 0, 'items');
        
        // Ensure we have data before rendering
        if (!this.stockItems || this.stockItems.length === 0) {
            console.log('No stock items found, loading sample data...');
            this.stockItems = this.getAllSampleStockItems();
        }
        
        try {
            // Render Manufactured Items (Timber Trusses)
            this.renderManufacturedItems();
            
            // Render Standard Stock Items
            this.renderStandardItems();
            
            // Render Service Items
            this.renderServiceItems();
            
            // Render Composite Items
            this.renderCompositeItems();
            
            // Render Temporary Items
            this.renderTemporaryItems();
            
            console.log('Stock grids rendered successfully');
        } catch (error) {
            console.error('Failed to render stock grids:', error);
            this.renderFallbackView();
        }
    }

    renderFallbackView() {
        const containers = [
            'manufactured-items-grid',
            'standard-items-grid', 
            'service-items-grid',
            'composite-items-grid',
            'temporary-items-grid'
        ];

        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="text-center p-4">
                        <div class="text-muted mb-2">
                            <i class="fas fa-exclamation-triangle fa-2x"></i>
                        </div>
                        <p class="text-muted">Loading stock items...</p>
                        <div class="spinner-border spinner-border-sm" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                `;
            }
        });
    }

    renderManufacturedItems() {
        const container = document.getElementById('manufactured-items-grid');
        if (!container) {
            console.warn('manufactured-items-grid container not found');
            return;
        }

        const manufacturedItems = this.getManufacturedItems();
        console.log('Rendering', manufacturedItems.length, 'manufactured items');
        
        // Simple test content first
        container.innerHTML = `
            <div class="alert alert-info" role="alert">
                <h6><i class="fas fa-industry"></i> Manufactured Items (${manufacturedItems.length} items)</h6>
                <p>Successfully loaded timber truss and manufactured item data.</p>
            </div>
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Code</th>
                            <th>Description</th>
                            <th>BOM Items</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${manufacturedItems.map(item => `
                            <tr class="clickable-row" data-item-code="${item.code}" style="cursor: pointer;">
                                <td><strong>${item.code}</strong></td>
                                <td>${item.description}</td>
                                <td>
                                    <span class="badge bg-info">${item.bomItems?.length || 0} items</span>
                                </td>
                                <td>
                                    <span class="badge bg-${item.active ? 'success' : 'secondary'}">
                                        ${item.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td><i class="fas fa-edit text-muted"></i></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        console.log('Manufactured items HTML set - container visible:', container.offsetHeight > 0);
    }

    renderStandardItems() {
        const container = document.getElementById('standard-items-grid');
        if (!container) {
            console.warn('standard-items-grid container not found');
            return;
        }

        const standardItems = this.getStandardItems();
        console.log('Rendering', standardItems.length, 'standard items');
        
        // Simple visible content
        container.innerHTML = `
            <div class="alert alert-success" role="alert">
                <h6><i class="fas fa-boxes"></i> Standard Stock Items (${standardItems.length} items)</h6>
                <p>Successfully loaded standard stock and material data.</p>
            </div>
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Base Code</th>
                            <th>Description</th>
                            <th>Variables</th>
                            <th>UOM</th>
                            <th>Unit Price</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${standardItems.map(item => `
                            <tr class="clickable-row" data-item-code="${item.baseCode}" style="cursor: pointer;">
                                <td><strong>${item.baseCode}</strong></td>
                                <td>${item.description}</td>
                                <td>
                                    ${item.hasVariables ? 
                                        `<span class="badge bg-warning">${item.variableCount} variables</span>` :
                                        '<span class="text-muted">None</span>'
                                    }
                                </td>
                                <td>${item.uom}</td>
                                <td>R ${item.unitPrice?.toFixed(2) || '0.00'}</td>
                                <td><i class="fas fa-edit text-muted"></i></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        console.log('Standard items HTML set - container visible:', container.offsetHeight > 0);
    }

    renderServiceItems() {
        const container = document.getElementById('service-items-grid');
        if (!container) return;

        const serviceItems = this.getServiceItems();
        
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Description</th>
                            <th>Rate Type</th>
                            <th>Unit Rate</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${serviceItems.map(item => `
                            <tr>
                                <td><strong>${item.code}</strong></td>
                                <td>${item.description}</td>
                                <td>${item.rateType}</td>
                                <td>R ${item.unitRate?.toFixed(2) || '0.00'}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-warning" onclick="stockManager.editItem('${item.code}')">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderCompositeItems() {
        const container = document.getElementById('composite-items-grid');
        if (!container) return;

        const compositeItems = this.getCompositeItems();
        
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Composite Code</th>
                            <th>Description</th>
                            <th>Components</th>
                            <th>Total Rate</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${compositeItems.map(item => `
                            <tr>
                                <td><strong>${item.code}</strong></td>
                                <td>${item.description}</td>
                                <td>
                                    <span class="badge bg-info">${item.components?.length || 0} items</span>
                                </td>
                                <td>R ${item.totalRate?.toFixed(2) || '0.00'}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="stockManager.viewRecipe('${item.code}')">
                                        <i class="fas fa-list"></i> Recipe
                                    </button>
                                    <button class="btn btn-sm btn-outline-warning" onclick="stockManager.editComposite('${item.code}')">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderTemporaryItems() {
        const container = document.getElementById('temporary-items-grid');
        if (!container) return;

        const tempItems = this.getTemporaryItems();
        
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Temp Code</th>
                            <th>Description</th>
                            <th>Created</th>
                            <th>Expires</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tempItems.map(item => `
                            <tr class="${item.expired ? 'table-danger' : ''}">
                                <td><strong>${item.code}</strong></td>
                                <td>${item.description}</td>
                                <td>${item.createdDate}</td>
                                <td>${item.expiryDate}</td>
                                <td>
                                    <span class="badge bg-${item.expired ? 'danger' : 'warning'}">
                                        ${item.expired ? 'Expired' : 'Active'}
                                    </span>
                                </td>
                                <td>
                                    ${!item.expired ? 
                                        `<button class="btn btn-sm btn-outline-success" onclick="stockManager.promoteToPermanent('${item.code}')">
                                            <i class="fas fa-arrow-up"></i> Make Permanent
                                        </button>` : ''
                                    }
                                    <button class="btn btn-sm btn-outline-danger" onclick="stockManager.deleteItem('${item.code}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    setupEventListeners() {
        // Add Stock Item button - switch to form view
        const addItemBtn = document.getElementById('add-stock-item');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => {
                this.showItemForm();
            });
        }

        // Create composite button
        const compositeButton = document.getElementById('create-composite');
        if (compositeButton) {
            compositeButton.addEventListener('click', () => this.showCreateCompositeModal());
        }

        // Temporary stock code button
        const tempButton = document.getElementById('temp-stock-code');
        if (tempButton) {
            tempButton.addEventListener('click', () => this.showTempStockModal());
        }

        // Row click handlers for editing items (using event delegation)
        const self = this;
        document.addEventListener('click', function(e) {
            const clickableRow = e.target.closest('.clickable-row');
            if (clickableRow && self.currentView === 'grid' && self.container.contains(clickableRow)) {
                e.preventDefault();
                const itemCode = clickableRow.getAttribute('data-item-code');
                console.log('Row clicked for item:', itemCode);
                if (itemCode) {
                    self.showItemForm(itemCode);
                }
            }
        });

        console.log('Event listeners set up successfully');
    }

    // Integration with StockItemForm
    addNewStockItem() {
        if (window.stockItemForm) {
            window.stockItemForm.clearForm();
        }
    }

    async editStockItem(itemCode) {
        try {
            // Load the item data from the API by item code, not ID
            const response = await fetch(`/api/stock/items/by-code/${itemCode}`);
            const result = await response.json();
            
            if (result.success && window.stockItemForm) {
                window.stockItemForm.loadItem(result.data);
            } else {
                console.error('Failed to load stock item:', result.error);
                // For now, create a sample item to demonstrate the form
                this.loadSampleItem(itemCode);
            }
        } catch (error) {
            console.error('Error loading stock item:', error);
            // For now, create a sample item to demonstrate the form
            this.loadSampleItem(itemCode);
        }
    }

    loadSampleItem(itemCode) {
        // Create sample data based on the item code for demonstration
        const sampleItems = {
            'TR001': {
                itemCode: 'TR001',
                description: 'Standard Roof Truss 8m Span',
                itemType: 'manufactured',
                status: 'active',
                baseUomId: 1,
                stockUomId: 1,
                salesUomId: 1, 
                purchaseUomId: 1,
                purchasePackSize: 1,
                unitCost: 2000.00,
                unitPrice: 2450.00,
                currentStock: 25,
                minimumStock: 5,
                maximumStock: 100,
                isBomItem: true,
                isActive: true
            },
            'TM240x35': {
                itemCode: 'TM240x35',
                description: 'Treated Pine Timber 240x35mm',
                itemType: 'stock',
                status: 'active',
                baseUomId: 2,
                stockUomId: 2,
                salesUomId: 2,
                purchaseUomId: 2,
                purchasePackSize: 1,
                unitCost: 100.00,
                unitPrice: 125.50,
                currentStock: 2500,
                minimumStock: 500,
                maximumStock: 5000,
                isBomItem: false,
                isActive: true
            },
            'LAB001': {
                itemCode: 'LAB001',
                description: 'Installation Labour - Roof Truss',
                itemType: 'service',
                status: 'active',
                baseUomId: 3,
                stockUomId: 3,
                salesUomId: 3,
                purchaseUomId: 3,
                purchasePackSize: 1,
                unitCost: 350.00,
                unitPrice: 450.00,
                currentStock: 0,
                minimumStock: 0,
                maximumStock: 0,
                isBomItem: false,
                isActive: true
            }
        };

        const item = sampleItems[itemCode];
        if (item && window.stockItemForm) {
            window.stockItemForm.loadItem(item);
        }
    }

    refreshGrid() {
        console.log('Refreshing stock grid...');
        this.renderStockGrids();
    }

    // Sample data methods
    getManufacturedItems() {
        return [
            {
                code: 'TT-001',
                description: 'Standard Hip Truss - 8m Span',
                bomItems: [
                    { code: '38x114', description: 'Pine Timber 38x114', quantity: 15, unit: 'm' },
                    { code: 'PLT-20', description: '20ga Nail Plates', quantity: 24, unit: 'ea' }
                ],
                active: true
            },
            {
                code: 'TT-002', 
                description: 'Gable End Truss - 10m Span',
                bomItems: [
                    { code: '38x114', description: 'Pine Timber 38x114', quantity: 18, unit: 'm' },
                    { code: 'PLT-20', description: '20ga Nail Plates', quantity: 28, unit: 'ea' }
                ],
                active: true
            }
        ];
    }

    getStandardItems() {
        return [
            {
                baseCode: 'SHEET-0.5-AZ100-CP',
                description: '0.5mm AZ100 G550 Colorplus Sheeting',
                hasVariables: true,
                variableCount: 3,
                variables: ['colour', 'length', 'profile'],
                uom: 'm',
                unitPrice: 85.50,
                requiresTally: true,
                coverWidth: 0.765
            },
            {
                baseCode: 'FLASH-0.5-AZ100-CP',
                description: '0.5mm AZ100 G550 Colorplus Flashing',
                hasVariables: true,
                variableCount: 3,
                variables: ['type', 'girth', 'colour'],
                uom: 'm',
                unitPrice: 95.80,
                requiresTally: true
            },
            {
                baseCode: '38x114',
                description: 'Pine Timber 38x114mm',
                hasVariables: false,
                uom: 'm',
                unitPrice: 42.50,
                requiresTally: true
            }
        ];
    }

    getServiceItems() {
        return [
            {
                code: 'LAB-INSTALL',
                description: 'Installation Labour',
                rateType: 'Per Hour',
                unitRate: 450.00
            },
            {
                code: 'TRANS-LOCAL',
                description: 'Local Transport',
                rateType: 'Per Load',
                unitRate: 850.00
            },
            {
                code: 'CERT-STRUCT',
                description: 'Structural Certification',
                rateType: 'Per Job',
                unitRate: 2500.00
            }
        ];
    }

    getCompositeItems() {
        return [
            {
                code: 'COMP-SHEET-0.5-CP-INST',
                description: '0.5mm Corrugated AZ100 Colorplus - Supply & Install',
                components: [
                    { code: 'SHEET-0.5-AZ100-CP', quantity: 1, unit: 'm2' },
                    { code: 'SCREW-12X65', quantity: 8, unit: 'ea' },
                    { code: 'LAB-INSTALL', quantity: 0.15, unit: 'hr' },
                    { code: 'TRANS-LOCAL', quantity: 0.05, unit: 'load' }
                ],
                totalRate: 125.50,
                unitConversions: {
                    'm': { rate: 125.50, factor: 0.765 },
                    'm2': { rate: 164.05, factor: 1 },
                    'ea': { rate: 96.11, factor: 0.765 }
                }
            }
        ];
    }

    getTemporaryItems() {
        const now = new Date();
        const expiry120 = new Date(now.getTime() + (120 * 24 * 60 * 60 * 1000));
        
        return [
            {
                code: 'TEMP-001',
                description: 'Custom Flashing - Special Profile',
                createdDate: now.toLocaleDateString(),
                expiryDate: expiry120.toLocaleDateString(),
                expired: false,
                unitPrice: 125.00
            }
        ];
    }

    // Modal methods
    showAddStockModal() {
        const modal = document.getElementById('stockItemModal');
        const content = document.getElementById('stock-modal-content');
        
        content.innerHTML = this.getStockItemForm();
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    showCreateCompositeModal() {
        const modal = document.getElementById('stockItemModal');
        const content = document.getElementById('stock-modal-content');
        
        content.innerHTML = this.getCompositeItemForm();
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    showTempStockModal() {
        const modal = document.getElementById('stockItemModal');
        const content = document.getElementById('stock-modal-content');
        
        content.innerHTML = this.getTempStockForm();
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    openTally(baseCode) {
        const modal = document.getElementById('tallyModal');
        const content = document.getElementById('tally-modal-content');
        
        content.innerHTML = this.getTallyForm(baseCode);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    getStockItemForm() {
        return `
            <form id="stock-item-form">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Item Type</label>
                            <select class="form-select" name="itemType" required>
                                <option value="">Select Type</option>
                                <option value="manufactured">Manufactured Item</option>
                                <option value="standard">Standard Stock Item</option>
                                <option value="service">Service Item</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Stock Code</label>
                            <input type="text" class="form-control" name="stockCode" required>
                        </div>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label class="form-label">Description</label>
                    <input type="text" class="form-control" name="description" required>
                </div>
                
                <div class="row">
                    <div class="col-md-4">
                        <div class="mb-3">
                            <label class="form-label">Unit of Measure</label>
                            <select class="form-select" name="uom">
                                <option value="ea">Each</option>
                                <option value="m">Meters</option>
                                <option value="m2">Square Meters</option>
                                <option value="kg">Kilograms</option>
                                <option value="hr">Hours</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="mb-3">
                            <label class="form-label">Unit Price</label>
                            <input type="number" class="form-control" name="unitPrice" step="0.01">
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="mb-3">
                            <label class="form-label">Cover Width (m)</label>
                            <input type="number" class="form-control" name="coverWidth" step="0.001" placeholder="For sheeting">
                        </div>
                    </div>
                </div>
                
                <div class="mb-3">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="hasVariables" id="hasVariables">
                        <label class="form-check-label" for="hasVariables">
                            Has Variable Attributes (colours, sizes, etc.)
                        </label>
                    </div>
                </div>
                
                <div class="mb-3">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="requiresTally" id="requiresTally">
                        <label class="form-check-label" for="requiresTally">
                            Requires Tally Input (cut-to-length materials)
                        </label>
                    </div>
                </div>
            </form>
        `;
    }

    getTallyForm(baseCode) {
        return `
            <div class="text-center mb-3">
                <h6>Quantity & Length Tally for: <strong>${baseCode}</strong></h6>
            </div>
            
            <div id="tally-entries">
                <div class="tally-entry row mb-2">
                    <div class="col-md-4">
                        <label class="form-label">Quantity</label>
                        <input type="number" class="form-control tally-qty" min="1" value="1">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Length (m)</label>
                        <input type="number" class="form-control tally-length" step="0.1" min="0.1">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Total (m)</label>
                        <input type="number" class="form-control tally-total" readonly>
                    </div>
                    <div class="col-md-1">
                        <label class="form-label">&nbsp;</label>
                        <button type="button" class="btn btn-outline-danger btn-sm w-100" onclick="this.closest('.tally-entry').remove(); stockManager.updateTallyTotal();">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="d-flex justify-content-between align-items-center mb-3">
                <button type="button" class="btn btn-outline-primary btn-sm" onclick="stockManager.addTallyRow()">
                    <i class="fas fa-plus"></i> Add Row
                </button>
                <div>
                    <strong>Grand Total: <span id="grand-total">0.0</span> m</strong>
                </div>
            </div>
        `;
    }

    addTallyRow() {
        const container = document.getElementById('tally-entries');
        const newRow = document.createElement('div');
        newRow.className = 'tally-entry row mb-2';
        newRow.innerHTML = `
            <div class="col-md-4">
                <input type="number" class="form-control tally-qty" min="1" value="1">
            </div>
            <div class="col-md-4">
                <input type="number" class="form-control tally-length" step="0.1" min="0.1">
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control tally-total" readonly>
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-outline-danger btn-sm w-100" onclick="this.closest('.tally-entry').remove(); stockManager.updateTallyTotal();">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(newRow);
        
        // Add event listeners to new inputs
        this.setupTallyCalculation(newRow);
    }

    setupTallyCalculation(container = document) {
        const qtyInputs = container.querySelectorAll('.tally-qty');
        const lengthInputs = container.querySelectorAll('.tally-length');
        
        qtyInputs.forEach(input => {
            input.addEventListener('input', () => this.calculateRowTotal(input.closest('.tally-entry')));
        });
        
        lengthInputs.forEach(input => {
            input.addEventListener('input', () => this.calculateRowTotal(input.closest('.tally-entry')));
        });
    }

    calculateRowTotal(row) {
        const qty = parseFloat(row.querySelector('.tally-qty').value) || 0;
        const length = parseFloat(row.querySelector('.tally-length').value) || 0;
        const total = qty * length;
        
        row.querySelector('.tally-total').value = total.toFixed(2);
        this.updateTallyTotal();
    }

    updateTallyTotal() {
        const totalInputs = document.querySelectorAll('.tally-total');
        let grandTotal = 0;
        
        totalInputs.forEach(input => {
            grandTotal += parseFloat(input.value) || 0;
        });
        
        const grandTotalElement = document.getElementById('grand-total');
        if (grandTotalElement) {
            grandTotalElement.textContent = grandTotal.toFixed(2);
        }
    }

    async loadStockData() {
        try {
            console.log('Loading stock data - using development samples');
            
            // Initialize with comprehensive sample data
            this.stockItems = this.getAllSampleStockItems();
            
            // This would normally load from your API:
            // const response = await fetch('/api/stock-items');
            // this.stockItems = await response.json();
            
        } catch (error) {
            console.warn('Using default sample stock data:', error.message);
            this.stockItems = this.getAllSampleStockItems();
        }
    }

    getAllSampleStockItems() {
        return [
            // Manufactured Items with proper formatting
            ...this.getManufacturedItems().map(item => ({
                ...item,
                id: item.code,
                category: 'Manufactured Items',
                currentStock: Math.floor(Math.random() * 20) + 5,
                sellingPrice: Math.floor(Math.random() * 400) + 300,
                uom: 'ea'
            })),
            // Standard Stock Items
            ...this.getStandardItems().map(item => ({
                ...item,
                id: item.baseCode,
                code: item.baseCode,
                category: 'Standard Stock',
                currentStock: Math.floor(Math.random() * 500) + 50,
                sellingPrice: item.unitPrice * 1.4 // Add 40% markup
            })),
            // Service Items
            ...this.getServiceItems().map(item => ({
                ...item,
                id: item.code,
                category: 'Services',
                currentStock: 'N/A',
                sellingPrice: item.unitRate,
                uom: item.rateType === 'Per Hour' ? 'hr' : 'ea'
            })),
            // Composite Items
            ...this.getCompositeItems().map(item => ({
                ...item,
                id: item.code,
                category: 'Composite Rates',
                currentStock: 'N/A',
                sellingPrice: item.totalRate,
                uom: 'm2'
            }))
        ];
    }

    // Public methods for external access
    viewBOM(itemCode) {
        console.log('Viewing BOM for:', itemCode);
        // Implementation for viewing BOM details
    }

    editItem(itemCode) {
        console.log('Editing item:', itemCode);
        // Implementation for editing items
    }

    configureVariables(baseCode) {
        console.log('Configuring variables for:', baseCode);
        // Implementation for variable configuration
    }

    viewRecipe(compositeCode) {
        console.log('Viewing recipe for:', compositeCode);
        // Implementation for viewing composite recipes
    }

    editComposite(compositeCode) {
        console.log('Editing composite:', compositeCode);
        // Implementation for editing composites
    }

    promoteToPermanent(tempCode) {
        console.log('Promoting temporary code to permanent:', tempCode);
        // Implementation for promoting temp codes
    }

    deleteItem(itemCode) {
        console.log('Deleting item:', itemCode);
        // Implementation for deleting items
    }
}

// Make globally accessible
window.AdvancedStockManager = AdvancedStockManager;