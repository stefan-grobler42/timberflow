// Simple, Reliable Stock Management System
class SimpleStockManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.data = [];
        this.currentView = 'list';
        this.currentItem = null;
        this.originalItem = null; // Store original state for undo functionality
        this.hasUnsavedChanges = false;
        this.searchTerm = '';
        
        // Enhanced grid
        this.dataGrid = null;
        this.gridColumns = [
            { field: 'itemCode', header: 'Item Code', width: '120px', type: 'text' },
            { field: 'description', header: 'Description', width: '300px', type: 'text' },
            { field: 'itemType', header: 'Type', width: '120px', type: 'badge',
              badgeClasses: {
                'Manufactured': 'bg-primary',
                'Standard': 'bg-success', 
                'Service': 'bg-info'
              }
            },
            { field: 'category', header: 'Category', width: '150px', type: 'text' },
            { field: 'unitCost', header: 'Unit Cost', width: '100px', type: 'currency' },
            { field: 'unitPrice', header: 'Unit Price', width: '100px', type: 'currency' },
            { field: 'stockUom', header: 'UOM', width: '80px', type: 'text' },
            { field: 'currentStock', header: 'Stock', width: '80px', type: 'number' },
            { field: 'minimumStock', header: 'Min Stock', width: '80px', type: 'number' },
            { field: 'isActive', header: 'Active', width: '80px', type: 'boolean' }
        ];
        
        // Reference data for lookups
        this.itemTypes = ['Manufactured', 'Standard', 'Service'];
        this.categories = ['Timber Trusses', 'Structural Timber', 'Hardware', 'Sheeting', 'Insulation', 'Labour', 'Transport'];
        this.uomTypes = ['EA', 'M', 'M2', 'M3', 'KG', 'L', 'HR'];
        this.suppliers = ['Timber World', 'Steel & Tube', 'Bunnings', 'Local Supplier', 'Direct Manufacturer'];
        
        // Lookup field instances
        this.lookupFields = {};
        
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
        this.setupGrid();
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

    setupGrid() {
        const gridConfig = {
            columns: this.gridColumns,
            entityName: 'Stock Item',
            onRowClick: (id) => this.editItem(id),
            onSelectionChange: (selectedIds) => {
                console.log('Selected stock items:', selectedIds);
            }
        };

        this.dataGrid = new EnhancedDataGrid('stock-grid-container', gridConfig);
        this.dataGrid.setData(this.data);
    }

    render() {
        if (this.currentView === 'list') {
            this.renderListView();
        } else {
            this.renderFormView();
        }
    }

    renderListView() {
        // Set up container for enhanced data grid
        this.container.innerHTML = `
            <div class="stock-manager-container">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2><i class="fas fa-boxes"></i> Stock Management</h2>
                </div>
                <div id="stock-grid-container"></div>
            </div>
        `;

        // Recreate grid to ensure proper rendering
        this.setupGrid();
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
                    <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-outline-secondary" id="back-to-list-btn">
                            <i class="fas fa-arrow-left"></i> Back to List
                        </button>
                        <button class="btn btn-outline-warning" id="undo-changes-btn" style="display: none;">
                            <i class="fas fa-undo"></i> Undo Changes
                        </button>
                        <div id="auto-save-status" class="text-muted small" style="display: none;">
                            <i class="fas fa-save"></i> Auto-saved
                        </div>
                    </div>
                    <h3><i class="fas fa-boxes me-2 text-primary"></i>${title}</h3>
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
        // Store original state for undo functionality
        if (this.currentItem) {
            this.originalItem = JSON.parse(JSON.stringify(this.currentItem));
        } else {
            this.originalItem = null;
        }
        this.hasUnsavedChanges = false;

        const form = document.getElementById('stock-form');
        if (form) {
            // Prevent default form submission
            form.addEventListener('submit', (e) => e.preventDefault());
            
            // Add change detection
            form.addEventListener('input', () => this.detectChanges());
            form.addEventListener('change', () => this.detectChanges());
        }

        // Back to list button with auto-save
        const backBtn = document.getElementById('back-to-list-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.handleBackToList());
        }

        // Undo changes button
        const undoBtn = document.getElementById('undo-changes-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undoChanges());
        }
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
        this.originalItem = null;
        this.hasUnsavedChanges = false;
        
        // Force recreate the grid to ensure proper navigation
        this.dataGrid = null;
        this.render();
    }

    showForm(item = null) {
        this.currentView = 'form';
        this.currentItem = item;
        this.originalItem = null; // Will be set in setupFormEvents
        this.hasUnsavedChanges = false;
        this.render();
    }

    editItem(id) {
        const item = this.data.find(item => item.id === id);
        if (item) {
            this.showForm(item);
        }
    }

    // Auto-save functionality methods
    detectChanges() {
        if (!this.originalItem && !this.currentItem) return;
        
        const currentFormData = this.getFormData();
        const hasChanges = this.originalItem ? 
            JSON.stringify(currentFormData) !== JSON.stringify(this.originalItem) :
            Object.values(currentFormData).some(value => value !== '' && value !== 0 && value !== false);
        
        if (hasChanges !== this.hasUnsavedChanges) {
            this.hasUnsavedChanges = hasChanges;
            this.updateUndoButtonVisibility();
        }
    }

    updateUndoButtonVisibility() {
        const undoBtn = document.getElementById('undo-changes-btn');
        if (undoBtn) {
            undoBtn.style.display = this.hasUnsavedChanges ? 'block' : 'none';
        }
    }

    undoChanges() {
        if (this.originalItem) {
            this.populateForm();
            this.hasUnsavedChanges = false;
            this.updateUndoButtonVisibility();
            this.showAutoSaveStatus('Changes undone');
        }
    }

    async handleBackToList() {
        if (this.hasUnsavedChanges) {
            const success = await this.autoSave();
            if (success) {
                this.showAutoSaveStatus('Auto-saved successfully');
                setTimeout(() => this.showList(), 500);
            } else {
                const proceed = confirm('Failed to save changes. Do you want to discard changes and continue?');
                if (proceed) {
                    this.showList();
                }
            }
        } else {
            this.showList();
        }
    }

    async autoSave() {
        try {
            const formData = this.getFormData();
            
            if (this.currentItem) {
                // Update existing stock item
                const index = this.data.findIndex(item => item.id === this.currentItem.id);
                if (index !== -1) {
                    this.data[index] = { ...this.data[index], ...formData };
                }
            } else {
                // Create new stock item
                formData.id = Math.max(...this.data.map(item => item.id), 0) + 1;
                this.data.push(formData);
            }
            
            this.hasUnsavedChanges = false;
            this.updateUndoButtonVisibility();
            return true;
        } catch (error) {
            console.error('Auto-save failed:', error);
            return false;
        }
    }

    getFormData() {
        const form = document.getElementById('stock-form');
        if (!form) return {};

        const formData = new FormData(form);
        return {
            itemCode: formData.get('itemCode') || '',
            description: formData.get('description') || '',
            itemType: this.lookupFields.itemType ? this.lookupFields.itemType.getValue() : formData.get('itemType') || '',
            category: this.lookupFields.category ? this.lookupFields.category.getValue() : formData.get('category') || '',
            unitCost: parseFloat(formData.get('unitCost')) || 0,
            unitPrice: parseFloat(formData.get('unitPrice')) || 0,
            stockUom: this.lookupFields.stockUom ? this.lookupFields.stockUom.getValue() : formData.get('stockUom') || '',
            currentStock: parseFloat(formData.get('currentStock')) || 0,
            minimumStock: parseFloat(formData.get('minimumStock')) || 0,
            isActive: formData.has('isActive')
        };
    }

    showAutoSaveStatus(message) {
        const statusDiv = document.getElementById('auto-save-status');
        if (statusDiv) {
            statusDiv.innerHTML = `<i class="fas fa-check text-success"></i> ${message}`;
            statusDiv.style.display = 'block';
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
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
}

// Make it globally available
window.SimpleStockManager = SimpleStockManager;