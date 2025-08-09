// Simple, Reliable Stock Management System
class SimpleStockManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.data = [];
        this.currentView = 'list';
        this.currentItem = null;
        this.searchTerm = '';
        
        if (!this.container) {
            console.error('SimpleStockManager: Container not found:', containerId);
            return;
        }
        
        this.init();
    }

    init() {
        console.log('SimpleStockManager: Initializing...');
        this.loadSampleData();
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
                        <button class="btn btn-outline-secondary me-3" id="back-btn">
                            <i class="fas fa-arrow-left me-1"></i>Back to List
                        </button>
                        <h3><i class="fas fa-edit me-2 text-primary"></i>${title}</h3>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-success" id="save-btn">
                            <i class="fas fa-save me-1"></i>Save
                        </button>
                        ${isEdit ? `
                            <button class="btn btn-outline-danger" id="delete-btn">
                                <i class="fas fa-trash me-1"></i>Delete
                            </button>
                        ` : ''}
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
                                            <select class="form-select" name="itemType" required>
                                                <option value="">Select Type...</option>
                                                <option value="Manufactured">Manufactured</option>
                                                <option value="Standard">Standard</option>
                                                <option value="Service">Service</option>
                                                <option value="Composite">Composite</option>
                                            </select>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Category <span class="text-danger">*</span></label>
                                            <select class="form-select" name="category" required>
                                                <option value="">Select Category...</option>
                                                <option value="Timber Trusses">Timber Trusses</option>
                                                <option value="Structural Timber">Structural Timber</option>
                                                <option value="Roofing Materials">Roofing Materials</option>
                                                <option value="Hardware">Hardware</option>
                                                <option value="Labour">Labour</option>
                                            </select>
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
                                            <select class="form-select" name="stockUom">
                                                <option value="EA">Each (EA)</option>
                                                <option value="M">Meters (M)</option>
                                                <option value="M2">Square Meters (M²)</option>
                                                <option value="HR">Hours (HR)</option>
                                            </select>
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
        // Back button
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showList());
        }

        // Save button
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveItem());
        }

        // Delete button
        const deleteBtn = document.getElementById('delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteCurrentItem());
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
            itemType: formData.get('itemType'),
            category: formData.get('category'),
            unitCost: parseFloat(formData.get('unitCost')) || 0,
            unitPrice: parseFloat(formData.get('unitPrice')) || 0,
            stockUom: formData.get('stockUom'),
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
}

// Make it globally available
window.SimpleStockManager = SimpleStockManager;