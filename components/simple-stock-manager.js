// Simple, Reliable Stock Management System
class SimpleStockManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.data = [];
        this.currentView = 'list';
        this.currentItem = null;
        this.searchTerm = '';
        
        // Reference data for lookups
        this.itemTypes = ['Manufactured', 'Standard', 'Service'];
        this.categories = ['Timber Trusses', 'Structural Timber', 'Hardware', 'Sheeting', 'Insulation', 'Labour', 'Transport'];
        this.uomTypes = ['EA', 'M', 'M2', 'M3', 'KG', 'L', 'HR'];
        this.suppliers = ['Timber World', 'Steel & Tube', 'Bunnings', 'Local Supplier', 'Direct Manufacturer'];
        
        // Lookup field instances
        this.lookupFields = {};
        
        // Auto-save functionality
        this.autoSaveEnabled = true;
        this.changesPending = false;
        this.lastSavedState = null;
        this.autoSaveDelay = 1000; // 1 second delay
        
        if (!this.container) {
            console.error('SimpleStockManager: Container not found:', containerId);
            return;
        }
        
        this.init();
    }

    init() {
        console.log('SimpleStockManager: Initializing...');
        console.log('Container element:', this.container);
        
        if (!this.container) {
            console.error('Container not found:', this.containerId);
            return;
        }
        
        this.loadSampleData();
        console.log('Sample data loaded:', this.data.length, 'items');
        this.render();
        console.log('SimpleStockManager: Ready');
    }

    loadSampleData() {
        this.data = [
            {
                id: 1,
                itemCode: 'TR001',
                description: 'Standard Roof Truss 8m Span',
                itemType: 'Manufactured',
                category: 'Timber Trusses',
                unitCost: 450.00,
                unitPrice: 585.00,
                stockUom: 'EA',
                currentStock: 25,
                minimumStock: 10,
                isActive: true
            },
            {
                id: 2,
                itemCode: 'TM240X35',
                description: '240x35mm Pine Structural Timber',
                itemType: 'Standard',
                category: 'Structural Timber',
                unitCost: 15.50,
                unitPrice: 22.50,
                stockUom: 'M',
                currentStock: 180,
                minimumStock: 50,
                isActive: true
            },
            {
                id: 3,
                itemCode: 'M10X10-NP',
                description: 'M10x10 Nail Plate',
                itemType: 'Standard',
                category: 'Hardware',
                unitCost: 0.85,
                unitPrice: 1.25,
                stockUom: 'EA',
                currentStock: 2250,
                minimumStock: 500,
                isActive: true
            },
            {
                id: 4,
                itemCode: 'LAB-INSTALL',
                description: 'Roof Installation Labour',
                itemType: 'Service',
                category: 'Labour',
                unitCost: 45.00,
                unitPrice: 65.00,
                stockUom: 'HR',
                currentStock: 0,
                minimumStock: 0,
                isActive: true
            },
            {
                id: 5,
                itemCode: 'SHEET-0.42-ZAM',
                description: '0.42mm Zincalume Roofing Sheet',
                itemType: 'Standard',
                category: 'Roofing Materials',
                unitCost: 85.00,
                unitPrice: 125.00,
                stockUom: 'M2',
                currentStock: 450,
                minimumStock: 100,
                isActive: true
            }
        ];
    }

    render() {
        if (this.currentView === 'list') {
            this.renderListView();
        } else {
            this.renderFormView();
        }
    }

    renderListView() {
        console.log('Rendering list view to container:', this.container);
        this.container.innerHTML = `
            <div class="stock-manager-container">
                <!-- Header -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3><i class="fas fa-boxes me-2 text-primary"></i>Stock Items</h3>
                    <div class="btn-group">
                        <button class="btn btn-primary" id="new-item-btn">
                            <i class="fas fa-plus me-1"></i>New Item
                        </button>
                        <button class="btn btn-outline-secondary" id="refresh-btn">
                            <i class="fas fa-sync-alt me-1"></i>Refresh
                        </button>
                    </div>
                </div>

                <!-- Search Bar -->
                <div class="row mb-3">
                    <div class="col-md-6">
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-search"></i></span>
                            <input type="text" class="form-control" id="search-input" 
                                   placeholder="Search stock items..." value="${this.searchTerm}">
                        </div>
                    </div>
                </div>

                <!-- Data Table -->
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-light">
                            <tr>
                                <th>Item Code</th>
                                <th>Description</th>
                                <th>Type</th>
                                <th>Category</th>
                                <th>Stock</th>
                                <th>Unit Price</th>
                                <th>Status</th>
                                <th width="120">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderTableRows()}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.setupListEvents();
    }

    renderTableRows() {
        const filteredData = this.getFilteredData();
        
        if (filteredData.length === 0) {
            return `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <div class="text-muted">
                            <i class="fas fa-inbox fa-2x mb-3"></i>
                            <p>No stock items found</p>
                        </div>
                    </td>
                </tr>
            `;
        }

        return filteredData.map(item => `
            <tr class="clickable-row" data-id="${item.id}" style="cursor: pointer;">
                <td><strong>${item.itemCode}</strong></td>
                <td>${item.description}</td>
                <td><span class="badge bg-info">${item.itemType}</span></td>
                <td>${item.category}</td>
                <td>
                    <span class="${item.currentStock <= item.minimumStock ? 'text-danger fw-bold' : ''}">
                        ${item.currentStock} ${item.stockUom}
                    </span>
                </td>
                <td>R ${item.unitPrice.toFixed(2)}</td>
                <td>
                    <span class="badge bg-${item.isActive ? 'success' : 'secondary'}">
                        ${item.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary edit-btn" data-id="${item.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger delete-btn" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderFormView() {
        const isEdit = !!this.currentItem;
        const title = isEdit ? 'Edit Stock Item' : 'New Stock Item';

        this.container.innerHTML = `
            <div class="stock-form-container">
                <!-- Form Header -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div class="d-flex align-items-center">
                        <div class="btn-group me-3">
                            <button type="button" class="btn btn-outline-secondary" id="back-btn">
                                <i class="fas fa-arrow-left me-1"></i>Back to List
                            </button>
                            <button type="button" class="btn btn-outline-warning" id="undo-btn" disabled>
                                <i class="fas fa-undo me-1"></i>Undo Changes
                            </button>
                            ${isEdit ? `
                                <button type="button" class="btn btn-outline-danger" id="delete-btn">
                                    <i class="fas fa-trash me-1"></i>Delete
                                </button>
                            ` : ''}
                        </div>
                        <h3><i class="fas fa-edit me-2 text-primary"></i>${title}</h3>
                    </div>
                    <div class="auto-save-status">
                        <small class="text-muted" id="auto-save-status">
                            <i class="fas fa-circle text-success"></i> Auto-save enabled
                        </small>
                    </div>
                </div>

                <!-- Form Content -->
                <form id="stock-form" class="needs-validation" novalidate>
                    <div class="row">
                        <div class="col-lg-8">
                            <!-- Basic Information -->
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h6 class="mb-0">Basic Information</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        <div class="col-md-6">
                                            <label class="form-label">Item Code <span class="text-danger">*</span></label>
                                            <input type="text" class="form-control" name="itemCode" required>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Description <span class="text-danger">*</span></label>
                                            <input type="text" class="form-control" name="description" required>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Item Type <span class="text-danger">*</span></label>
                                            <input type="text" class="form-control lookup-field" name="itemType" 
                                                   placeholder="Type to search item types..." required>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Category <span class="text-danger">*</span></label>
                                            <input type="text" class="form-control lookup-field" name="category" 
                                                   placeholder="Type to search categories..." required>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Pricing Information -->
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h6 class="mb-0">Pricing Information</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        <div class="col-md-4">
                                            <label class="form-label">Unit Cost</label>
                                            <div class="input-group">
                                                <span class="input-group-text">R</span>
                                                <input type="number" class="form-control" name="unitCost" step="0.01">
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label">Unit Price</label>
                                            <div class="input-group">
                                                <span class="input-group-text">R</span>
                                                <input type="number" class="form-control" name="unitPrice" step="0.01">
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label">Stock UOM</label>
                                            <input type="text" class="form-control lookup-field" name="stockUom" 
                                                   placeholder="Type to search UOM...">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Inventory Information -->
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h6 class="mb-0">Inventory Information</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        <div class="col-md-6">
                                            <label class="form-label">Current Stock</label>
                                            <input type="number" class="form-control" name="currentStock" step="0.01">
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Minimum Stock</label>
                                            <input type="number" class="form-control" name="minimumStock" step="0.01">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Status -->
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">Status</h6>
                                </div>
                                <div class="card-body">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="isActive" checked>
                                        <label class="form-check-label">Active</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Side Panel -->
                        <div class="col-lg-4">
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">Information</h6>
                                </div>
                                <div class="card-body">
                                    ${isEdit ? `
                                        <div class="text-muted">
                                            <small>Item ID: ${this.currentItem.id}</small>
                                        </div>
                                    ` : `
                                        <div class="text-muted">
                                            <small>New item will be created when saved.</small>
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        `;

        this.setupFormEvents();
        this.initializeLookupFields();
        if (isEdit) {
            this.populateForm();
        }
    }

    getFilteredData() {
        if (!this.searchTerm) return this.data;
        
        return this.data.filter(item => 
            item.itemCode.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
    }

    setupListEvents() {
        // New button
        const newBtn = document.getElementById('new-item-btn');
        if (newBtn) {
            newBtn.addEventListener('click', () => this.showForm());
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.render());
        }

        // Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.updateTable();
            });
        }

        // Row clicks
        this.container.addEventListener('click', (e) => {
            const row = e.target.closest('.clickable-row');
            if (row && !e.target.closest('button')) {
                const id = parseInt(row.getAttribute('data-id'));
                this.editItem(id);
            }
        });

        // Edit buttons
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.edit-btn')) {
                const id = parseInt(e.target.closest('.edit-btn').getAttribute('data-id'));
                this.editItem(id);
            }
        });

        // Delete buttons
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) {
                const id = parseInt(e.target.closest('.delete-btn').getAttribute('data-id'));
                this.deleteItem(id);
            }
        });
    }

    setupFormEvents() {
        const form = document.getElementById('stock-form');
        if (form) {
            // Add change detection for auto-save
            form.addEventListener('input', () => this.handleFormChange());
            form.addEventListener('change', () => this.handleFormChange());
        }

        // Back button with auto-save
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.saveCurrentChanges().then(() => {
                    this.showList();
                });
            });
        }

        // Undo button
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undoChanges());
        }

        // Delete button
        const deleteBtn = document.getElementById('delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteCurrentItem());
        }
        
        // Store initial state for undo functionality
        this.storeCurrentState();
    }
    
    initializeLookupFields() {
        // Clear existing lookup fields
        Object.values(this.lookupFields).forEach(field => {
            if (field.dropdown && field.dropdown.parentNode) {
                field.dropdown.parentNode.removeChild(field.dropdown);
            }
        });
        this.lookupFields = {};
        
        // Item Types
        const itemTypeInput = document.querySelector('[name="itemType"]');
        if (itemTypeInput) {
            this.lookupFields.itemType = createLookupField(itemTypeInput, this.itemTypes, {
                placeholder: 'Type to search item types...'
            });
        }
        
        // Categories
        const categoryInput = document.querySelector('[name="category"]');
        if (categoryInput) {
            this.lookupFields.category = createLookupField(categoryInput, this.categories, {
                placeholder: 'Type to search categories...'
            });
        }
        
        // UOM Types
        const uomInput = document.querySelector('[name="stockUom"]');
        if (uomInput) {
            const uomData = this.uomTypes.map(uom => {
                const labels = {
                    'EA': 'Each (EA)',
                    'M': 'Meters (M)',
                    'M2': 'Square Meters (M²)',
                    'M3': 'Cubic Meters (M³)',
                    'KG': 'Kilograms (KG)',
                    'L': 'Liters (L)',
                    'HR': 'Hours (HR)'
                };
                return { name: labels[uom] || uom, value: uom };
            });
            
            this.lookupFields.stockUom = createLookupField(uomInput, uomData, {
                placeholder: 'Type to search UOM...'
            });
        }
    }

    updateTable() {
        const tbody = this.container.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = this.renderTableRows();
        }
    }

    showList() {
        this.currentView = 'list';
        this.currentItem = null;
        this.render();
    }

    showForm(item = null) {
        this.currentView = 'form';
        this.currentItem = item;
        this.render();
    }

    editItem(id) {
        const item = this.data.find(item => item.id === id);
        if (item) {
            this.showForm(item);
        }
    }

    deleteItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            const index = this.data.findIndex(item => item.id === id);
            if (index > -1) {
                this.data.splice(index, 1);
                this.showNotification('Item deleted successfully', 'success');
                this.updateTable();
            }
        }
    }

    deleteCurrentItem() {
        if (this.currentItem && confirm('Are you sure you want to delete this item?')) {
            this.deleteItem(this.currentItem.id);
            this.showList();
        }
    }

    saveItem() {
        const form = document.getElementById('stock-form');
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const formData = new FormData(form);
        const data = {
            itemCode: formData.get('itemCode'),
            description: formData.get('description'),
            itemType: this.lookupFields.itemType ? this.lookupFields.itemType.getValue() : formData.get('itemType'),
            category: this.lookupFields.category ? this.lookupFields.category.getValue() : formData.get('category'),
            unitCost: parseFloat(formData.get('unitCost')) || 0,
            unitPrice: parseFloat(formData.get('unitPrice')) || 0,
            stockUom: this.lookupFields.stockUom ? this.lookupFields.stockUom.getValue() : formData.get('stockUom'),
            currentStock: parseFloat(formData.get('currentStock')) || 0,
            minimumStock: parseFloat(formData.get('minimumStock')) || 0,
            isActive: formData.has('isActive')
        };

        if (this.currentItem) {
            // Update existing
            Object.assign(this.currentItem, data);
            this.showNotification('Item updated successfully', 'success');
        } else {
            // Create new
            data.id = Math.max(...this.data.map(item => item.id), 0) + 1;
            this.data.push(data);
            this.showNotification('Item created successfully', 'success');
        }

        this.showList();
    }

    populateForm() {
        if (!this.currentItem) return;

        const form = document.getElementById('stock-form');
        Object.keys(this.currentItem).forEach(key => {
            const element = form.querySelector(`[name="${key}"]`);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = !!this.currentItem[key];
                } else {
                    element.value = this.currentItem[key] || '';
                    
                    // If this is a lookup field, update its value properly
                    if (this.lookupFields[key]) {
                        this.lookupFields[key].setValue(this.currentItem[key]);
                    }
                }
            }
        });
    }

    showNotification(message, type = 'info') {
        const alertClass = type === 'error' ? 'danger' : type;
        const notification = document.createElement('div');
        notification.className = `alert alert-${alertClass} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
    
    // Auto-save functionality methods
    handleFormChange() {
        if (!this.autoSaveEnabled) return;
        
        this.changesPending = true;
        this.updateAutoSaveStatus('Changes detected...');
        
        // Enable undo button
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.disabled = false;
        }
        
        // Clear any existing timeout
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        // Set new timeout for auto-save
        this.autoSaveTimeout = setTimeout(() => {
            this.autoSaveChanges();
        }, this.autoSaveDelay);
    }
    
    async autoSaveChanges() {
        if (!this.changesPending) return;
        
        try {
            this.updateAutoSaveStatus('Saving changes...');
            await this.saveCurrentChanges();
            this.changesPending = false;
            this.updateAutoSaveStatus('All changes saved');
            
            // Store new state for undo
            this.storeCurrentState();
            
            // Reset undo button
            setTimeout(() => {
                const undoBtn = document.getElementById('undo-btn');
                if (undoBtn) {
                    undoBtn.disabled = true;
                }
                this.updateAutoSaveStatus('Auto-save enabled');
            }, 2000);
            
        } catch (error) {
            console.error('Auto-save failed:', error);
            this.updateAutoSaveStatus('Save failed - please try again');
        }
    }
    
    async saveCurrentChanges() {
        const form = document.getElementById('stock-form');
        if (!form) return;
        
        const formData = new FormData(form);
        const data = {
            itemCode: formData.get('itemCode'),
            description: formData.get('description'),
            itemType: this.lookupFields.itemType ? this.lookupFields.itemType.getValue() : formData.get('itemType'),
            category: this.lookupFields.category ? this.lookupFields.category.getValue() : formData.get('category'),
            unitCost: parseFloat(formData.get('unitCost')) || 0,
            unitPrice: parseFloat(formData.get('unitPrice')) || 0,
            stockUom: this.lookupFields.stockUom ? this.lookupFields.stockUom.getValue() : formData.get('stockUom'),
            currentStock: parseFloat(formData.get('currentStock')) || 0,
            minimumStock: parseFloat(formData.get('minimumStock')) || 0,
            isActive: formData.has('isActive')
        };
        
        // Add audit trail
        const now = new Date().toISOString();
        const user = 'current_user'; // This would come from authentication
        
        if (this.currentItem) {
            // Track changes for audit
            const changes = this.getChanges(this.currentItem, data);
            if (Object.keys(changes).length > 0) {
                // Update existing item
                const index = this.data.findIndex(item => item.id === this.currentItem.id);
                if (index !== -1) {
                    this.data[index] = { 
                        ...this.data[index], 
                        ...data,
                        lastModified: now,
                        lastModifiedBy: user
                    };
                    // Add to audit trail
                    this.addAuditEntry(this.currentItem.id, 'UPDATE', changes, user, now);
                }
            }
        } else {
            // Create new item with audit info
            const newId = Math.max(...this.data.map(item => item.id), 0) + 1;
            data.id = newId;
            data.created = now;
            data.createdBy = user;
            data.lastModified = now;
            data.lastModifiedBy = user;
            this.data.push(data);
            this.currentItem = data;
            // Add to audit trail
            this.addAuditEntry(newId, 'CREATE', data, user, now);
        }
        
        return Promise.resolve();
    }
    
    storeCurrentState() {
        const form = document.getElementById('stock-form');
        if (form) {
            const formData = new FormData(form);
            this.lastSavedState = Object.fromEntries(formData.entries());
        }
    }
    
    undoChanges() {
        if (!this.lastSavedState) return;
        
        // Restore form values
        Object.keys(this.lastSavedState).forEach(key => {
            const field = document.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = this.lastSavedState[key] === 'on';
                } else {
                    field.value = this.lastSavedState[key] || '';
                }
            }
        });
        
        // Reset auto-save state
        this.changesPending = false;
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.disabled = true;
        }
        
        this.updateAutoSaveStatus('Changes reverted');
        setTimeout(() => {
            this.updateAutoSaveStatus('Auto-save enabled');
        }, 2000);
    }
    
    updateAutoSaveStatus(message) {
        const statusElement = document.getElementById('auto-save-status');
        if (statusElement) {
            let icon = 'fas fa-circle text-success';
            if (message.includes('Saving')) {
                icon = 'fas fa-spinner fa-spin text-primary';
            } else if (message.includes('failed')) {
                icon = 'fas fa-exclamation-triangle text-danger';
            } else if (message.includes('saved')) {
                icon = 'fas fa-check text-success';
            } else if (message.includes('Changes detected')) {
                icon = 'fas fa-edit text-warning';
            }
            
            statusElement.innerHTML = `<i class="${icon}"></i> ${message}`;
        }
    }
    
    // Audit trail methods
    getChanges(oldData, newData) {
        const changes = {};
        Object.keys(newData).forEach(key => {
            if (oldData[key] !== newData[key]) {
                changes[key] = {
                    old: oldData[key],
                    new: newData[key]
                };
            }
        });
        return changes;
    }
    
    addAuditEntry(recordId, action, changes, user, timestamp) {
        // Use global audit trail manager
        if (window.auditTrailManager) {
            window.auditTrailManager.recordEvent({
                module: 'stock',
                recordType: 'stock_item',
                recordId,
                action,
                changes,
                user,
                metadata: {
                    timestamp: timestamp,
                    component: 'SimpleStockManager'
                }
            });
        }
    }
    
    getAuditTrail(recordId = null) {
        if (!this.auditTrail) return [];
        if (recordId) {
            return this.auditTrail.filter(entry => entry.recordId === recordId);
        }
        return this.auditTrail;
    }
}

// Make it globally available
window.SimpleStockManager = SimpleStockManager;