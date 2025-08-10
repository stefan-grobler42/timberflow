class StockItemForm {
    constructor() {
        this.lookupData = {
            uoms: [],
            categories: [],
            variants: [],
            marginCategories: [],
            discountCategories: []
        };
        this.currentItem = null;
        this.isEditing = false;
        this.initializeComponent();
    }

    async initializeComponent() {
        await this.loadLookupData();
        this.render();
        this.bindEvents();
    }

    async loadLookupData() {
        try {
            this.lookupData = {
                uoms: this.getSampleUoms(),
                categories: this.getSampleCategories(),
                variants: this.getSampleVariants(),
                marginCategories: this.getSampleMarginCategories(),
                discountCategories: this.getSampleDiscountCategories()
            };
        } catch (error) {
            console.error('Failed to load lookup data:', error);
        }
    }

    getSampleUoms() {
        return [
            { id: 1, code: 'EA', name: 'Each', isActive: true },
            { id: 2, code: 'M', name: 'Metres', isActive: true },
            { id: 3, code: 'M2', name: 'Square Metres', isActive: true },
            { id: 4, code: 'HR', name: 'Hours', isActive: true },
            { id: 5, code: 'KG', name: 'Kilograms', isActive: true }
        ];
    }

    getSampleCategories() {
        return [
            { id: 1, name: 'Timber Trusses', isActive: true },
            { id: 2, name: 'Structural Timber', isActive: true },
            { id: 3, name: 'Roofing Materials', isActive: true },
            { id: 4, name: 'Labour Services', isActive: true },
            { id: 5, name: 'Hardware', isActive: true }
        ];
    }

    getSampleVariants() {
        return [
            { id: 1, name: 'Standard', isActive: true },
            { id: 2, name: 'Galvanised', isActive: true },
            { id: 3, name: 'Stainless Steel', isActive: true }
        ];
    }

    getSampleMarginCategories() {
        return [
            { id: 1, name: 'Standard Margin', defaultMarginPercent: 25, isActive: true },
            { id: 2, name: 'High Margin', defaultMarginPercent: 40, isActive: true },
            { id: 3, name: 'Low Margin', defaultMarginPercent: 15, isActive: true }
        ];
    }

    getSampleDiscountCategories() {
        return [
            { id: 1, name: 'No Discount', maxDiscountPercent: 0, isActive: true },
            { id: 2, name: 'Standard Discount', maxDiscountPercent: 10, isActive: true },
            { id: 3, name: 'High Volume Discount', maxDiscountPercent: 20, isActive: true }
        ];
    }

    render() {
        const container = document.getElementById('stock-item-form-container');
        if (!container) return;

        container.innerHTML = `
            <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">
                        <i class="fas fa-box-open text-primary me-2"></i>
                        ${this.isEditing ? 'Edit Stock Item' : 'New Stock Item'}
                    </h5>
                    <div class="btn-group">
                        <button type="button" class="btn btn-sm btn-outline-secondary" id="clear-form-btn">
                            <i class="fas fa-broom me-1"></i>Clear
                        </button>
                        <button type="button" class="btn btn-sm btn-success" id="save-item-btn">
                            <i class="fas fa-save me-1"></i>Save
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <form id="stock-item-form" class="row g-3">
                        <!-- Basic Information -->
                        <div class="col-12">
                            <h6 class="text-muted border-bottom pb-2 mb-3">
                                <i class="fas fa-info-circle me-1"></i>Basic Information
                            </h6>
                        </div>
                        
                        <div class="col-md-6">
                            <label class="form-label required">Item Code</label>
                            <input type="text" class="form-control" id="itemCode" name="itemCode" required>
                            <div class="form-text">Unique identifier for this item</div>
                        </div>
                        
                        <div class="col-md-6">
                            <label class="form-label required">Description</label>
                            <input type="text" class="form-control" id="description" name="description" required>
                            <div class="form-text">Full description of the item</div>
                        </div>

                        <!-- Classification -->
                        <div class="col-12 mt-4">
                            <h6 class="text-muted border-bottom pb-2 mb-3">
                                <i class="fas fa-tags me-1"></i>Classification
                            </h6>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label required">Item Type</label>
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
                            <label class="form-label required">Category</label>
                            <select class="form-select" id="itemCategoryId" name="itemCategoryId" required>
                                <option value="">Select Category...</option>
                                ${this.lookupData.categories.map(cat => 
                                    `<option value="${cat.id}">${cat.name}</option>`
                                ).join('')}
                            </select>
                        </div>

                        <!-- Units of Measure -->
                        <div class="col-12 mt-4">
                            <h6 class="text-muted border-bottom pb-2 mb-3">
                                <i class="fas fa-balance-scale me-1"></i>Units of Measure
                            </h6>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label required">Stock UOM</label>
                            <select class="form-select" id="stockUomId" name="stockUomId" required>
                                <option value="">Select UOM...</option>
                                ${this.lookupData.uoms.map(uom => 
                                    `<option value="${uom.id}">${uom.code} - ${uom.name}</option>`
                                ).join('')}
                            </select>
                            <div class="form-text">How we store this item</div>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label required">Sales UOM</label>
                            <select class="form-select" id="salesUomId" name="salesUomId" required>
                                <option value="">Select UOM...</option>
                                ${this.lookupData.uoms.map(uom => 
                                    `<option value="${uom.id}">${uom.code} - ${uom.name}</option>`
                                ).join('')}
                            </select>
                            <div class="form-text">How we sell this item</div>
                        </div>

                        <!-- Pricing -->
                        <div class="col-12 mt-4">
                            <h6 class="text-muted border-bottom pb-2 mb-3">
                                <i class="fas fa-dollar-sign me-1"></i>Pricing & Margins
                            </h6>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Unit Cost</label>
                            <div class="input-group">
                                <span class="input-group-text">R</span>
                                <input type="number" class="form-control" id="unitCost" name="unitCost" step="0.01" min="0">
                            </div>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Unit Price</label>
                            <div class="input-group">
                                <span class="input-group-text">R</span>
                                <input type="number" class="form-control" id="unitPrice" name="unitPrice" step="0.01" min="0">
                            </div>
                        </div>

                        <!-- Inventory -->
                        <div class="col-12 mt-4">
                            <h6 class="text-muted border-bottom pb-2 mb-3">
                                <i class="fas fa-warehouse me-1"></i>Inventory Management
                            </h6>
                        </div>

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

                        <!-- Special Options -->
                        <div class="col-12 mt-4">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="isActive" name="isActive" checked>
                                <label class="form-check-label" for="isActive">
                                    <strong>Active</strong>
                                </label>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    bindEvents() {
        const saveBtn = document.getElementById('save-item-btn');
        const clearBtn = document.getElementById('clear-form-btn');

        saveBtn?.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.saveItem();
        });

        clearBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.clearForm();
        });
    }

    async saveItem() {
        const form = document.getElementById('stock-item-form');
        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        console.log('Saving item:', data);
        this.showNotification('Stock item saved successfully!', 'success');
    }

    loadItem(item) {
        this.currentItem = item;
        this.isEditing = true;
        
        const header = document.querySelector('#stock-item-form-container .card-header h5');
        if (header) {
            header.innerHTML = `
                <i class="fas fa-box-open text-primary me-2"></i>
                Edit Stock Item - ${item.itemCode}
            `;
        }

        Object.keys(item).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = !!item[key];
                } else {
                    element.value = item[key] || '';
                }
            }
        });
    }

    clearForm() {
        this.currentItem = null;
        this.isEditing = false;
        
        const form = document.getElementById('stock-item-form');
        form.reset();
        
        document.getElementById('isActive').checked = true;
        
        const header = document.querySelector('#stock-item-form-container .card-header h5');
        if (header) {
            header.innerHTML = `
                <i class="fas fa-box-open text-primary me-2"></i>
                New Stock Item
            `;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

window.StockItemForm = StockItemForm;