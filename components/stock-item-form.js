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
            const [uoms, categories, variants, marginCategories, discountCategories] = await Promise.all([
                fetch('/api/lookup/uoms').then(r => r.json()),
                fetch('/api/lookup/categories').then(r => r.json()),
                fetch('/api/lookup/variants').then(r => r.json()),
                fetch('/api/lookup/margin-categories').then(r => r.json()),
                fetch('/api/lookup/discount-categories').then(r => r.json())
            ]);

            this.lookupData = {
                uoms: uoms.success ? uoms.data : [],
                categories: categories.success ? categories.data : [],
                variants: variants.success ? variants.data : [],
                marginCategories: marginCategories.success ? marginCategories.data : [],
                discountCategories: discountCategories.success ? discountCategories.data : []
            };
        } catch (error) {
            console.error('Failed to load lookup data:', error);
        }
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
                        
                        <div class="col-md-3">
                            <label class="form-label required">Item Code</label>
                            <input type="text" class="form-control" id="itemCode" name="itemCode" required>
                            <div class="form-text">Unique identifier for this item</div>
                        </div>
                        
                        <div class="col-md-6">
                            <label class="form-label required">Description</label>
                            <input type="text" class="form-control" id="description" name="description" required>
                            <div class="form-text">Full description of the item</div>
                        </div>
                        
                        <div class="col-md-3">
                            <label class="form-label">Status</label>
                            <select class="form-select" id="status" name="status">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="discontinued">Discontinued</option>
                            </select>
                        </div>

                        <!-- Classification -->
                        <div class="col-12 mt-4">
                            <h6 class="text-muted border-bottom pb-2 mb-3">
                                <i class="fas fa-tags me-1"></i>Classification
                            </h6>
                        </div>

                        <div class="col-md-3">
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

                        <div class="col-md-3">
                            <label class="form-label required">Category</label>
                            <select class="form-select" id="itemCategoryId" name="itemCategoryId" required>
                                <option value="">Select Category...</option>
                                ${this.lookupData.categories.map(cat => 
                                    `<option value="${cat.id}">${cat.name}</option>`
                                ).join('')}
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Variant</label>
                            <select class="form-select" id="variantId" name="variantId">
                                <option value="">Select Variant...</option>
                                ${this.lookupData.variants.map(variant => 
                                    `<option value="${variant.id}">${variant.name}</option>`
                                ).join('')}
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label required">Base UOM</label>
                            <select class="form-select" id="baseUomId" name="baseUomId" required>
                                <option value="">Select UOM...</option>
                                ${this.lookupData.uoms.map(uom => 
                                    `<option value="${uom.id}">${uom.code} - ${uom.name}</option>`
                                ).join('')}
                            </select>
                        </div>

                        <!-- Units of Measure -->
                        <div class="col-12 mt-4">
                            <h6 class="text-muted border-bottom pb-2 mb-3">
                                <i class="fas fa-balance-scale me-1"></i>Units of Measure
                            </h6>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label required">Stock UOM</label>
                            <select class="form-select" id="stockUomId" name="stockUomId" required>
                                <option value="">Select UOM...</option>
                                ${this.lookupData.uoms.map(uom => 
                                    `<option value="${uom.id}">${uom.code} - ${uom.name}</option>`
                                ).join('')}
                            </select>
                            <div class="form-text">How we store this item</div>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label required">Sales UOM</label>
                            <select class="form-select" id="salesUomId" name="salesUomId" required>
                                <option value="">Select UOM...</option>
                                ${this.lookupData.uoms.map(uom => 
                                    `<option value="${uom.id}">${uom.code} - ${uom.name}</option>`
                                ).join('')}
                            </select>
                            <div class="form-text">How we sell this item</div>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label required">Purchase UOM</label>
                            <select class="form-select" id="purchaseUomId" name="purchaseUomId" required>
                                <option value="">Select UOM...</option>
                                ${this.lookupData.uoms.map(uom => 
                                    `<option value="${uom.id}">${uom.code} - ${uom.name}</option>`
                                ).join('')}
                            </select>
                            <div class="form-text">How we buy this item</div>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Purchase Pack Size</label>
                            <input type="number" class="form-control" id="purchasePackSize" name="purchasePackSize" min="1" value="1">
                            <div class="form-text">Items per purchase unit (e.g., 150 for box)</div>
                        </div>

                        <!-- Pricing -->
                        <div class="col-12 mt-4">
                            <h6 class="text-muted border-bottom pb-2 mb-3">
                                <i class="fas fa-dollar-sign me-1"></i>Pricing & Margins
                            </h6>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Unit Cost</label>
                            <div class="input-group">
                                <span class="input-group-text">R</span>
                                <input type="number" class="form-control" id="unitCost" name="unitCost" step="0.01" min="0">
                            </div>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Unit Price</label>
                            <div class="input-group">
                                <span class="input-group-text">R</span>
                                <input type="number" class="form-control" id="unitPrice" name="unitPrice" step="0.01" min="0">
                            </div>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Margin Category</label>
                            <select class="form-select" id="marginCategoryId" name="marginCategoryId">
                                <option value="">Select Margin...</option>
                                ${this.lookupData.marginCategories.map(margin => 
                                    `<option value="${margin.id}">${margin.name} (${margin.defaultMarginPercent}%)</option>`
                                ).join('')}
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Discount Category</label>
                            <select class="form-select" id="discountCategoryId" name="discountCategoryId">
                                <option value="">Select Discount...</option>
                                ${this.lookupData.discountCategories.map(discount => 
                                    `<option value="${discount.id}">${discount.name} (Max ${discount.maxDiscountPercent}%)</option>`
                                ).join('')}
                            </select>
                        </div>

                        <!-- Inventory -->
                        <div class="col-12 mt-4">
                            <h6 class="text-muted border-bottom pb-2 mb-3">
                                <i class="fas fa-warehouse me-1"></i>Inventory Management
                            </h6>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Current Stock</label>
                            <input type="number" class="form-control" id="currentStock" name="currentStock" step="0.01" min="0" value="0">
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Minimum Stock</label>
                            <input type="number" class="form-control" id="minimumStock" name="minimumStock" step="0.01" min="0" value="0">
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Maximum Stock</label>
                            <input type="number" class="form-control" id="maximumStock" name="maximumStock" step="0.01" min="0">
                        </div>

                        <div class="col-md-3" id="expiry-section" style="display: none;">
                            <label class="form-label">Expiry Date</label>
                            <input type="date" class="form-control" id="expiryDate" name="expiryDate">
                            <div class="form-text">For temporary items (120 days max)</div>
                        </div>

                        <!-- Special Options -->
                        <div class="col-12 mt-4">
                            <h6 class="text-muted border-bottom pb-2 mb-3">
                                <i class="fas fa-cogs me-1"></i>Special Options
                            </h6>
                        </div>

                        <div class="col-md-6">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="isBomItem" name="isBomItem">
                                <label class="form-check-label" for="isBomItem">
                                    <strong>Bill of Materials Item</strong>
                                    <div class="form-text">This item has a manufacturing BOM</div>
                                </label>
                            </div>
                        </div>

                        <div class="col-md-6">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="isActive" name="isActive" checked>
                                <label class="form-check-label" for="isActive">
                                    <strong>Active</strong>
                                    <div class="form-text">Item is available for use</div>
                                </label>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    bindEvents() {
        const form = document.getElementById('stock-item-form');
        const saveBtn = document.getElementById('save-item-btn');
        const clearBtn = document.getElementById('clear-form-btn');
        const itemTypeSelect = document.getElementById('itemType');

        // Handle item type change for expiry date visibility
        itemTypeSelect?.addEventListener('change', (e) => {
            const expirySection = document.getElementById('expiry-section');
            if (e.target.value === 'temporary') {
                expirySection.style.display = 'block';
                // Set default expiry to 120 days from now
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 120);
                document.getElementById('expiryDate').value = expiryDate.toISOString().split('T')[0];
            } else {
                expirySection.style.display = 'none';
                document.getElementById('expiryDate').value = '';
            }
        });

        // Auto-calculate price based on cost and margin
        const unitCostInput = document.getElementById('unitCost');
        const marginCategorySelect = document.getElementById('marginCategoryId');
        const unitPriceInput = document.getElementById('unitPrice');

        const calculatePrice = () => {
            const cost = parseFloat(unitCostInput.value) || 0;
            const marginCategoryId = marginCategorySelect.value;
            
            if (cost > 0 && marginCategoryId) {
                const marginCategory = this.lookupData.marginCategories.find(m => m.id == marginCategoryId);
                if (marginCategory && marginCategory.defaultMarginPercent) {
                    const marginFactor = 1 + (parseFloat(marginCategory.defaultMarginPercent) / 100);
                    const calculatedPrice = cost * marginFactor;
                    unitPriceInput.value = calculatedPrice.toFixed(2);
                }
            }
        };

        unitCostInput?.addEventListener('input', calculatePrice);
        marginCategorySelect?.addEventListener('change', calculatePrice);

        // Save button
        saveBtn?.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.saveItem();
        });

        // Clear button
        clearBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.clearForm();
        });

        // Form validation
        form?.addEventListener('input', () => {
            this.validateForm();
        });
    }

    async saveItem() {
        const form = document.getElementById('stock-item-form');
        const formData = new FormData(form);
        const data = {};

        // Convert form data to object
        for (let [key, value] = formData.entries()) {
            if (value === '') {
                data[key] = null;
            } else if (['baseUomId', 'stockUomId', 'salesUomId', 'purchaseUomId', 'itemCategoryId', 'variantId', 'marginCategoryId', 'discountCategoryId', 'purchasePackSize'].includes(key)) {
                data[key] = parseInt(value);
            } else if (['unitCost', 'unitPrice', 'currentStock', 'minimumStock', 'maximumStock'].includes(key)) {
                data[key] = parseFloat(value) || 0;
            } else if (['isBomItem', 'isActive'].includes(key)) {
                data[key] = document.getElementById(key).checked;
            } else {
                data[key] = value;
            }
        }

        try {
            const saveBtn = document.getElementById('save-item-btn');
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Saving...';

            const url = this.isEditing ? `/api/stock/items/${this.currentItem.id}` : '/api/stock/items';
            const method = this.isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Stock item saved successfully!', 'success');
                this.clearForm();
                // Refresh the stock items grid if it exists
                if (window.advancedStockManager) {
                    window.advancedStockManager.refreshGrid();
                }
            } else {
                this.showNotification('Failed to save stock item: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showNotification('Failed to save stock item: ' + error.message, 'error');
        } finally {
            const saveBtn = document.getElementById('save-item-btn');
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Save';
        }
    }

    loadItem(item) {
        this.currentItem = item;
        this.isEditing = true;
        
        // Update form title
        const header = document.querySelector('#stock-item-form-container .card-header h5');
        if (header) {
            header.innerHTML = `
                <i class="fas fa-box-open text-primary me-2"></i>
                Edit Stock Item - ${item.itemCode}
            `;
        }

        // Populate form fields
        Object.keys(item).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = !!item[key];
                } else if (element.type === 'date' && item[key]) {
                    element.value = new Date(item[key]).toISOString().split('T')[0];
                } else {
                    element.value = item[key] || '';
                }
            }
        });

        // Show expiry section if temporary item
        if (item.itemType === 'temporary') {
            document.getElementById('expiry-section').style.display = 'block';
        }
    }

    clearForm() {
        this.currentItem = null;
        this.isEditing = false;
        
        // Reset form
        const form = document.getElementById('stock-item-form');
        form.reset();
        
        // Reset checkboxes
        document.getElementById('isActive').checked = true;
        document.getElementById('isBomItem').checked = false;
        
        // Hide expiry section
        document.getElementById('expiry-section').style.display = 'none';
        
        // Update form title
        const header = document.querySelector('#stock-item-form-container .card-header h5');
        if (header) {
            header.innerHTML = `
                <i class="fas fa-box-open text-primary me-2"></i>
                New Stock Item
            `;
        }
    }

    validateForm() {
        const form = document.getElementById('stock-item-form');
        const saveBtn = document.getElementById('save-item-btn');
        
        if (form.checkValidity()) {
            saveBtn.disabled = false;
            saveBtn.classList.remove('btn-secondary');
            saveBtn.classList.add('btn-success');
        } else {
            saveBtn.disabled = true;
            saveBtn.classList.remove('btn-success');
            saveBtn.classList.add('btn-secondary');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Export for global access
window.StockItemForm = StockItemForm;