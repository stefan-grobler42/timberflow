// Stock Management System - Built with System Defaults
class StockManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.data = [];
        this.currentView = 'list';
        this.currentItem = null;
        this.originalItem = null;
        this.dataGrid = null;
        
        // Grid columns using system defaults
        this.gridColumns = [
            { field: 'itemCode', header: 'Item Code', width: SystemDefaults.GRID_DEFAULTS.columnWidths.code, type: 'text' },
            { field: 'description', header: 'Description', width: SystemDefaults.GRID_DEFAULTS.columnWidths.description, type: 'text' },
            { field: 'itemType', header: 'Type', width: SystemDefaults.GRID_DEFAULTS.columnWidths.shortText, type: 'badge',
              badgeClasses: SystemDefaults.GRID_DEFAULTS.badgeSchemes.itemType
            },
            { field: 'category', header: 'Category', width: SystemDefaults.GRID_DEFAULTS.columnWidths.mediumText, type: 'text' },
            { field: 'unitCost', header: 'Unit Cost', width: SystemDefaults.GRID_DEFAULTS.columnWidths.currency, type: 'currency' },
            { field: 'unitPrice', header: 'Unit Price', width: SystemDefaults.GRID_DEFAULTS.columnWidths.currency, type: 'currency' },
            { field: 'stockUom', header: 'UOM', width: SystemDefaults.GRID_DEFAULTS.columnWidths.shortText, type: 'text' },
            { field: 'currentStock', header: 'Current Stock', width: SystemDefaults.GRID_DEFAULTS.columnWidths.number, type: 'number' },
            { field: 'minimumStock', header: 'Min Stock', width: SystemDefaults.GRID_DEFAULTS.columnWidths.number, type: 'number' },
            { field: 'isActive', header: 'Active', width: SystemDefaults.GRID_DEFAULTS.columnWidths.boolean, type: 'boolean' }
        ];
        
        if (!this.container) {
            console.error('StockManager: Container not found:', containerId);
            return;
        }
        
        this.init();
    }

    init() {
        console.log('StockManager: Initializing...');
        this.loadSampleData();
        this.render();
        console.log('StockManager: Ready');
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
        // Generate module header using system defaults
        const moduleHeader = SystemDefaults.generateModuleHeader('Stock Management');
        
        this.container.innerHTML = `
            ${moduleHeader}
            <div class="stock-manager-container">
                <div id="stock-grid-container"></div>
            </div>
        `;

        // Setup header action handlers  
        this.setupHeaderActions();
        
        // Setup grid using system defaults
        this.setupGrid();
    }

    setupHeaderActions() {
        // Add event listeners for header actions
        this.container.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            if (action) {
                e.preventDefault();
                this.handleHeaderAction(action);
            }
        });
    }

    handleHeaderAction(action) {
        switch (action) {
            case 'new-record':
                this.showForm();
                break;
            case 'export-excel':
                if (this.dataGrid) {
                    this.dataGrid.exportToExcel();
                }
                break;
            case 'refresh':
                this.render();
                break;
        }
    }

    setupGrid() {
        // Use system defaults for grid configuration
        const gridConfig = SystemDefaults.getGridConfig('Stock Item', {
            columns: this.gridColumns,
            onRowClick: (id) => this.editItem(id),
            onSelectionChange: (selectedIds) => {
                console.log('Selected stock items:', selectedIds);
            }
        });

        this.dataGrid = new EnhancedDataGrid('stock-grid-container', gridConfig);
        this.dataGrid.setData(this.data);
    }

    editItem(id) {
        const item = this.data.find(item => item.id === id);
        if (item) {
            this.currentItem = { ...item };
            this.originalItem = { ...item };
            this.currentView = 'form';
            this.render();
        }
    }

    showForm() {
        this.currentItem = {
            id: null,
            itemCode: '',
            description: '',
            itemType: 'Standard',
            category: '',
            unitCost: 0,
            unitPrice: 0,
            stockUom: 'EA',
            currentStock: 0,
            minimumStock: 0,
            isActive: true
        };
        this.originalItem = null;
        this.currentView = 'form';
        this.render();
    }

    renderFormView() {
        const isEdit = !!this.currentItem && !!this.currentItem.id;
        const title = isEdit ? 'Edit Stock Item' : 'New Stock Item';
        
        // Generate module header for form view
        const moduleHeader = SystemDefaults.generateModuleHeader('Stock Management');
        
        // Generate form tabs using system defaults
        const formTabs = SystemDefaults.generateFormTabs('stock');
        
        this.container.innerHTML = `
            ${moduleHeader}
            <div class="stock-form-container">
                <!-- Form Header -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-outline-secondary" id="back-to-list-btn">
                            <i class="fas fa-arrow-left"></i> Back to List
                        </button>
                        <h3><i class="fas fa-boxes me-2" style="color: var(--millennium-primary);"></i>${title}</h3>
                    </div>
                </div>

                <!-- Form Tabs -->
                ${formTabs}
                
                <!-- Form Content (General Tab) -->
                <div id="general-content">
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
                                                <input type="text" class="form-control" name="itemCode" value="${this.currentItem?.itemCode || ''}" required>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Description <span class="text-danger">*</span></label>
                                                <input type="text" class="form-control" name="description" value="${this.currentItem?.description || ''}" required>
                                            </div>
                                        </div>
                                        
                                        <div class="row g-3 mt-2">
                                            <div class="col-md-6">
                                                <label class="form-label">Item Type <span class="text-danger">*</span></label>
                                                <select class="form-select" name="itemType" required>
                                                    <option value="Manufactured" ${this.currentItem?.itemType === 'Manufactured' ? 'selected' : ''}>Manufactured</option>
                                                    <option value="Standard" ${this.currentItem?.itemType === 'Standard' ? 'selected' : ''}>Standard</option>
                                                    <option value="Service" ${this.currentItem?.itemType === 'Service' ? 'selected' : ''}>Service</option>
                                                </select>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Category <span class="text-danger">*</span></label>
                                                <input type="text" class="form-control" name="category" value="${this.currentItem?.category || ''}" required>
                                            </div>
                                        </div>
                                        
                                        <div class="row g-3 mt-2">
                                            <div class="col-md-4">
                                                <label class="form-label">Stock UOM <span class="text-danger">*</span></label>
                                                <select class="form-select" name="stockUom" required>
                                                    <option value="EA" ${this.currentItem?.stockUom === 'EA' ? 'selected' : ''}>EA - Each</option>
                                                    <option value="M" ${this.currentItem?.stockUom === 'M' ? 'selected' : ''}>M - Metres</option>
                                                    <option value="M2" ${this.currentItem?.stockUom === 'M2' ? 'selected' : ''}>M2 - Square Metres</option>
                                                    <option value="M3" ${this.currentItem?.stockUom === 'M3' ? 'selected' : ''}>M3 - Cubic Metres</option>
                                                    <option value="KG" ${this.currentItem?.stockUom === 'KG' ? 'selected' : ''}>KG - Kilograms</option>
                                                    <option value="L" ${this.currentItem?.stockUom === 'L' ? 'selected' : ''}>L - Litres</option>
                                                    <option value="HR" ${this.currentItem?.stockUom === 'HR' ? 'selected' : ''}>HR - Hours</option>
                                                </select>
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label">Unit Cost</label>
                                                <input type="number" class="form-control" name="unitCost" step="0.01" value="${this.currentItem?.unitCost || 0}">
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label">Unit Price</label>
                                                <input type="number" class="form-control" name="unitPrice" step="0.01" value="${this.currentItem?.unitPrice || 0}">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-lg-4">
                                <!-- Stock Information -->
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <h6 class="mb-0">Stock Information</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="mb-3">
                                            <label class="form-label">Current Stock</label>
                                            <input type="number" class="form-control" name="currentStock" value="${this.currentItem?.currentStock || 0}">
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Minimum Stock</label>
                                            <input type="number" class="form-control" name="minimumStock" value="${this.currentItem?.minimumStock || 0}">
                                        </div>
                                        
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" name="isActive" ${this.currentItem?.isActive ? 'checked' : ''}>
                                            <label class="form-check-label">Active</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Setup form event handlers
        this.setupFormHandlers();
        
        // Setup header action handlers for form view
        this.setupHeaderActions();
    }

    setupFormHandlers() {
        // Back to list button
        const backBtn = this.container.querySelector('#back-to-list-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.currentView = 'list';
                this.render();
            });
        }

        // Form submission (auto-save)
        const form = this.container.querySelector('#stock-form');
        if (form) {
            form.addEventListener('change', () => {
                // Auto-save functionality here
                console.log('Form changed - auto-saving...');
            });
        }
    }
}

// Make available globally
window.StockManager = StockManager;