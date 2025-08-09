// Stock Management with Interactive Grid
class StockGridManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.currentView = 'grid';
        this.currentItem = null;
        
        // Stock data
        this.data = [];
        
        // Grid configuration
        this.gridConfig = {
            columns: [
                { key: 'itemCode', title: 'Item Code', width: '120px', type: 'text' },
                { key: 'description', title: 'Description', width: '200px', type: 'text' },
                { key: 'itemType', title: 'Type', width: '120px', type: 'select', 
                  options: [
                      { value: 'Manufactured', label: 'Manufactured' },
                      { value: 'Standard', label: 'Standard' },
                      { value: 'Service', label: 'Service' }
                  ]
                },
                { key: 'category', title: 'Category', width: '140px', type: 'select',
                  options: [
                      { value: 'Timber Trusses', label: 'Timber Trusses' },
                      { value: 'Structural Timber', label: 'Structural Timber' },
                      { value: 'Hardware', label: 'Hardware' },
                      { value: 'Sheeting', label: 'Sheeting' },
                      { value: 'Insulation', label: 'Insulation' },
                      { value: 'Labour', label: 'Labour' },
                      { value: 'Transport', label: 'Transport' }
                  ]
                },
                { key: 'unitCost', title: 'Unit Cost', width: '100px', type: 'number' },
                { key: 'unitPrice', title: 'Unit Price', width: '100px', type: 'number' },
                { key: 'stockUom', title: 'UOM', width: '80px', type: 'select',
                  options: [
                      { value: 'EA', label: 'Each' },
                      { value: 'M', label: 'Meters' },
                      { value: 'M2', label: 'Sq Meters' },
                      { value: 'M3', label: 'Cubic Meters' },
                      { value: 'KG', label: 'Kilograms' },
                      { value: 'L', label: 'Liters' },
                      { value: 'HR', label: 'Hours' }
                  ]
                },
                { key: 'currentStock', title: 'Stock', width: '80px', type: 'number' },
                { key: 'minimumStock', title: 'Min Stock', width: '80px', type: 'number' },
                { key: 'isActive', title: 'Active', width: '60px', type: 'checkbox' }
            ],
            data: [],
            editable: true,
            selectable: true,
            exportable: true,
            importable: true,
            auditTrail: true
        };
        
        if (!this.container) {
            console.error('StockGridManager: Container not found:', containerId);
            return;
        }
        
        this.init();
    }
    
    init() {
        this.loadSampleData();
        this.createMainLayout();
        this.initializeGrid();
        this.render();
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
                unitCost: 2.75,
                unitPrice: 3.50,
                stockUom: 'EA',
                currentStock: 500,
                minimumStock: 100,
                isActive: true
            },
            {
                id: 4,
                itemCode: 'IS0.55-CF',
                description: 'Colorsteel Roofing 0.55mm',
                itemType: 'Standard',
                category: 'Sheeting',
                unitCost: 18.90,
                unitPrice: 28.50,
                stockUom: 'M2',
                currentStock: 85,
                minimumStock: 20,
                isActive: true
            },
            {
                id: 5,
                itemCode: 'LAB-INST',
                description: 'Installation Labour',
                itemType: 'Service',
                category: 'Labour',
                unitCost: 45.00,
                unitPrice: 65.00,
                stockUom: 'HR',
                currentStock: 0,
                minimumStock: 0,
                isActive: true
            }
        ];
        
        // Update grid config data
        this.gridConfig.data = this.data;
    }
    
    createMainLayout() {
        this.container.innerHTML = `
            <div class="stock-grid-manager">
                <!-- Header -->
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4><i class="fas fa-boxes me-2 text-primary"></i>Stock Management</h4>
                    <div class="btn-group">
                        <button class="btn btn-primary btn-sm" id="switch-to-form-btn">
                            <i class="fas fa-edit me-1"></i>Form View
                        </button>
                        <button class="btn btn-outline-info btn-sm" id="view-audit-btn">
                            <i class="fas fa-history me-1"></i>Audit Trail
                        </button>
                    </div>
                </div>
                
                <!-- Grid Container -->
                <div id="stock-grid-container"></div>
                
                <!-- Audit Trail Modal -->
                <div class="modal fade" id="audit-trail-modal" tabindex="-1">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Stock Management Audit Trail</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div id="stock-audit-viewer"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    initializeGrid() {
        this.grid = new InteractiveGrid('stock-grid-container', this.gridConfig);
        
        // Listen for grid changes to update our data
        this.grid.container.addEventListener('gridChanged', (e) => {
            this.data = this.grid.getData();
            this.recordAuditEvent('GRID_UPDATE', null, { rowsAffected: e.detail.rowsAffected });
        });
    }
    
    render() {
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        // Switch to form view
        const formViewBtn = document.getElementById('switch-to-form-btn');
        if (formViewBtn) {
            formViewBtn.addEventListener('click', () => {
                // Show the original form-based stock manager
                if (window.currentStockManager) {
                    window.currentStockManager.showList();
                }
            });
        }
        
        // View audit trail
        const auditBtn = document.getElementById('view-audit-btn');
        if (auditBtn) {
            auditBtn.addEventListener('click', () => {
                this.showAuditTrail();
            });
        }
    }
    
    showAuditTrail() {
        const modal = new bootstrap.Modal(document.getElementById('audit-trail-modal'));
        
        // Create audit viewer with stock-specific filters
        if (window.auditTrailManager) {
            window.auditTrailManager.createAuditViewer('stock-audit-viewer', {
                filters: { module: 'stock' }
            });
        }
        
        modal.show();
    }
    
    recordAuditEvent(action, recordId, metadata) {
        if (window.auditTrailManager) {
            window.auditTrailManager.recordEvent({
                module: 'stock',
                recordType: 'stock_item',
                recordId,
                action,
                metadata: {
                    component: 'StockGridManager',
                    ...metadata
                }
            });
        }
    }
    
    // Public API
    getData() {
        return this.grid ? this.grid.getData() : this.data;
    }
    
    setData(data) {
        this.data = data;
        if (this.grid) {
            this.grid.setData(data);
        }
    }
    
    refreshGrid() {
        if (this.grid) {
            this.grid.render();
        }
    }
}

// Make it globally available
window.StockGridManager = StockGridManager;