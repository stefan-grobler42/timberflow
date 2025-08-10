// Simple, Reliable Stock Management System
class SimpleStockManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.data = [];
        this.currentView = 'list';
        this.currentItem = null;
        this.originalItem = null;
        this.hasUnsavedChanges = false;
        this.searchTerm = '';
        
        // Enhanced grid
        this.dataGrid = null;
        this.gridColumns = [
            { field: 'itemCode', header: 'Item Code', width: '120px', type: 'text' },
            { field: 'description', header: 'Description', width: '300px', type: 'text' },
            { field: 'itemType', header: 'Type', width: '120px', type: 'badge',
              badgeClasses: SystemDefaults.GRID_DEFAULTS.badgeSchemes.itemType
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

    deleteItem(id) {
        if (confirm('Are you sure you want to delete this stock item?')) {
            this.data = this.data.filter(item => item.id !== id);
            this.dataGrid.setData(this.data);
        }
    }

    renderFormView() {
        // Placeholder for form view
        this.container.innerHTML = `
            <div class="stock-form-container">
                <h3>Stock Item Form (Coming Soon)</h3>
                <button class="btn btn-secondary" onclick="window.stockManager.currentView = 'list'; window.stockManager.render();">
                    Back to List
                </button>
            </div>
        `;
    }
}

// Make available globally
window.SimpleStockManager = SimpleStockManager;