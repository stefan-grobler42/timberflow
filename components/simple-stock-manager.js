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
        this.render();
        console.log('SimpleStockManager: Ready');
    }

    loadSampleData() {
        this.data = [
            // Timber Trusses
            { id: 1, itemCode: 'TR001', description: 'Standard Roof Truss 8m Span', itemType: 'Manufactured', category: 'Timber Trusses', unitCost: 450.00, unitPrice: 585.00, stockUom: 'EA', currentStock: 25, minimumStock: 10, isActive: true, supplier: 'Direct Manufacturer' },
            { id: 2, itemCode: 'TR002', description: 'Hip Truss 6m Span', itemType: 'Manufactured', category: 'Timber Trusses', unitCost: 380.00, unitPrice: 494.00, stockUom: 'EA', currentStock: 15, minimumStock: 8, isActive: true, supplier: 'Direct Manufacturer' },
            { id: 3, itemCode: 'TR003', description: 'Gable Truss 10m Span', itemType: 'Manufactured', category: 'Timber Trusses', unitCost: 620.00, unitPrice: 806.00, stockUom: 'EA', currentStock: 12, minimumStock: 5, isActive: true, supplier: 'Direct Manufacturer' },
            { id: 4, itemCode: 'TR004', description: 'Valley Truss 7m Span', itemType: 'Manufactured', category: 'Timber Trusses', unitCost: 410.00, unitPrice: 533.00, stockUom: 'EA', currentStock: 8, minimumStock: 6, isActive: true, supplier: 'Direct Manufacturer' },
            
            // Structural Timber
            { id: 5, itemCode: 'TM240X35', description: '240x35mm Pine Structural Timber', itemType: 'Standard', category: 'Structural Timber', unitCost: 15.50, unitPrice: 22.50, stockUom: 'M', currentStock: 180, minimumStock: 50, isActive: true, supplier: 'Timber World' },
            { id: 6, itemCode: 'TM190X45', description: '190x45mm Pine Structural Timber', itemType: 'Standard', category: 'Structural Timber', unitCost: 18.20, unitPrice: 26.40, stockUom: 'M', currentStock: 145, minimumStock: 40, isActive: true, supplier: 'Timber World' },
            { id: 7, itemCode: 'TM140X35', description: '140x35mm Pine Structural Timber', itemType: 'Standard', category: 'Structural Timber', unitCost: 12.80, unitPrice: 18.60, stockUom: 'M', currentStock: 220, minimumStock: 60, isActive: true, supplier: 'Timber World' },
            { id: 8, itemCode: 'TM90X35', description: '90x35mm Pine Structural Timber', itemType: 'Standard', category: 'Structural Timber', unitCost: 9.50, unitPrice: 13.80, stockUom: 'M', currentStock: 280, minimumStock: 80, isActive: true, supplier: 'Timber World' },
            
            // Hardware
            { id: 9, itemCode: 'HW001', description: 'Galvanised Nail Plates 100x150mm', itemType: 'Standard', category: 'Hardware', unitCost: 2.40, unitPrice: 3.60, stockUom: 'EA', currentStock: 500, minimumStock: 100, isActive: true, supplier: 'Steel & Tube' },
            { id: 10, itemCode: 'HW002', description: 'Truss Clips 90mm', itemType: 'Standard', category: 'Hardware', unitCost: 1.80, unitPrice: 2.70, stockUom: 'EA', currentStock: 750, minimumStock: 200, isActive: true, supplier: 'Steel & Tube' },
            { id: 11, itemCode: 'HW003', description: 'Bolts M12x150mm Galv', itemType: 'Standard', category: 'Hardware', unitCost: 3.20, unitPrice: 4.80, stockUom: 'EA', currentStock: 200, minimumStock: 50, isActive: true, supplier: 'Bunnings' },
            { id: 12, itemCode: 'HW004', description: 'Washers M12 Galvanised', itemType: 'Standard', category: 'Hardware', unitCost: 0.15, unitPrice: 0.25, stockUom: 'EA', currentStock: 1000, minimumStock: 300, isActive: true, supplier: 'Bunnings' },
            
            // Sheeting
            { id: 13, itemCode: 'SH001', description: 'Colorbond Roofing 0.42mm Surfmist', itemType: 'Standard', category: 'Sheeting', unitCost: 24.50, unitPrice: 36.75, stockUom: 'M2', currentStock: 85, minimumStock: 25, isActive: true, supplier: 'Steel & Tube' },
            { id: 14, itemCode: 'SH002', description: 'Colorbond Roofing 0.42mm Monument', itemType: 'Standard', category: 'Sheeting', unitCost: 24.50, unitPrice: 36.75, stockUom: 'M2', currentStock: 120, minimumStock: 30, isActive: true, supplier: 'Steel & Tube' },
            { id: 15, itemCode: 'SH003', description: 'Zincalume Roofing 0.48mm', itemType: 'Standard', category: 'Sheeting', unitCost: 22.80, unitPrice: 34.20, stockUom: 'M2', currentStock: 95, minimumStock: 25, isActive: true, supplier: 'Steel & Tube' },
            { id: 16, itemCode: 'SH004', description: 'Ridge Cap Colorbond 150mm', itemType: 'Standard', category: 'Sheeting', unitCost: 18.60, unitPrice: 27.90, stockUom: 'M', currentStock: 45, minimumStock: 15, isActive: true, supplier: 'Steel & Tube' },
            
            // Insulation
            { id: 17, itemCode: 'IN001', description: 'Bulk Insulation R2.5 580mm', itemType: 'Standard', category: 'Insulation', unitCost: 8.40, unitPrice: 12.60, stockUom: 'M2', currentStock: 200, minimumStock: 50, isActive: true, supplier: 'Local Supplier' },
            { id: 18, itemCode: 'IN002', description: 'Reflective Foil 1350mm', itemType: 'Standard', category: 'Insulation', unitCost: 4.20, unitPrice: 6.30, stockUom: 'M2', currentStock: 150, minimumStock: 40, isActive: true, supplier: 'Local Supplier' },
            { id: 19, itemCode: 'IN003', description: 'Roof Blanket R3.5 430mm', itemType: 'Standard', category: 'Insulation', unitCost: 12.80, unitPrice: 19.20, stockUom: 'M2', currentStock: 180, minimumStock: 45, isActive: true, supplier: 'Local Supplier' },
            
            // Labour Services
            { id: 20, itemCode: 'LB001', description: 'Carpenter - Standard Rate', itemType: 'Service', category: 'Labour', unitCost: 65.00, unitPrice: 85.00, stockUom: 'HR', currentStock: 0, minimumStock: 0, isActive: true, supplier: 'Internal' },
            { id: 21, itemCode: 'LB002', description: 'Crane Operator', itemType: 'Service', category: 'Labour', unitCost: 95.00, unitPrice: 125.00, stockUom: 'HR', currentStock: 0, minimumStock: 0, isActive: true, supplier: 'External' },
            { id: 22, itemCode: 'LB003', description: 'Roof Installation Team', itemType: 'Service', category: 'Labour', unitCost: 180.00, unitPrice: 240.00, stockUom: 'HR', currentStock: 0, minimumStock: 0, isActive: true, supplier: 'Internal' },
            
            // Transport Services  
            { id: 23, itemCode: 'TR101', description: 'Local Delivery <50km', itemType: 'Service', category: 'Transport', unitCost: 125.00, unitPrice: 175.00, stockUom: 'EA', currentStock: 0, minimumStock: 0, isActive: true, supplier: 'Internal' },
            { id: 24, itemCode: 'TR102', description: 'Regional Delivery 50-100km', itemType: 'Service', category: 'Transport', unitCost: 225.00, unitPrice: 315.00, stockUom: 'EA', currentStock: 0, minimumStock: 0, isActive: true, supplier: 'External' },
            { id: 25, itemCode: 'TR103', description: 'Crane Truck Delivery', itemType: 'Service', category: 'Transport', unitCost: 350.00, unitPrice: 490.00, stockUom: 'EA', currentStock: 0, minimumStock: 0, isActive: true, supplier: 'External' }
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
        // Initialize enhanced data grid if not already done
        if (!this.dataGrid) {
            this.container.innerHTML = `
                <div class="stock-manager-container">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2><i class="fas fa-boxes"></i> Stock Management</h2>
                    </div>
                    <div id="stock-grid-container"></div>
                </div>
            `;

            this.initDataGrid();
        } else {
            // Update existing grid data
            this.dataGrid.updateData(this.data);
        }
    }

    initDataGrid() {
        // Stock grid columns configuration
        const columns = [
            { field: 'itemCode', header: 'Item Code', width: '120px' },
            { field: 'description', header: 'Description', width: '250px' },
            { field: 'itemType', header: 'Type', width: '100px' },
            { field: 'category', header: 'Category', width: '150px' },
            { field: 'currentStock', header: 'Stock', width: '80px' },
            { field: 'stockUom', header: 'UOM', width: '60px' },
            { field: 'unitPrice', header: 'Price', width: '100px' },
            { field: 'supplier', header: 'Supplier', width: '140px' },
            { field: 'isActive', header: 'Status', width: '80px' }
        ];

        // Enhanced data grid configuration
        const config = {
            entityName: 'Stock Item',
            showNewButton: true,
            allowMultiSelect: true,
            formatters: {
                currentStock: (value, row) => {
                    const isLow = row.currentStock <= row.minimumStock && row.itemType !== 'Service';
                    return `<span class="${isLow ? 'text-danger fw-bold' : ''}">${value}</span>`;
                },
                unitPrice: (value) => `R ${parseFloat(value).toFixed(2)}`,
                itemType: (value) => `<span class="badge bg-info">${value}</span>`,
                isActive: (value) => `<span class="badge bg-${value ? 'success' : 'secondary'}">${value ? 'Active' : 'Inactive'}</span>`,
                supplier: (value) => value || 'Not Set'
            },
            onRowClick: (id) => this.editItem(id),
            onSelectionChange: (selectedIds) => {
                console.log('Selected stock items:', selectedIds);
            },
            onDelete: (id) => this.deleteItem(id)
        };

        // Initialize enhanced data grid
        this.dataGrid = new EnhancedDataGrid('stock-grid-container', columns, this.data, config);
    }

    editItem(id) {
        this.currentItem = this.data.find(item => item.id === id);
        if (this.currentItem) {
            this.originalItem = { ...this.currentItem };
            this.currentView = 'form';
            this.render();
        }
    }

    deleteItem(id) {
        if (confirm('Are you sure you want to delete this stock item?')) {
            this.data = this.data.filter(item => item.id !== id);
            if (this.dataGrid) {
                this.dataGrid.updateData(this.data);
            }
        }
    }

    renderFormView() {
        // Simple form placeholder for now
        this.container.innerHTML = `
            <div class="stock-form-container">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <button class="btn btn-outline-secondary" onclick="window.stockManager.backToList()">
                        <i class="fas fa-arrow-left"></i> Back to List
                    </button>
                    <h3><i class="fas fa-boxes me-2 text-primary"></i>Edit Stock Item</h3>
                </div>
                <div class="alert alert-info">
                    Form implementation coming soon. Stock item ID: ${this.currentItem?.id}
                </div>
            </div>
        `;
    }

    backToList() {
        this.currentView = 'list';
        this.currentItem = null;
        this.render();
    }
}