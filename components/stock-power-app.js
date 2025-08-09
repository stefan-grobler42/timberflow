// Stock Management using Power Apps Framework
class StockPowerApp extends PowerAppsFramework {
    constructor(containerId) {
        const config = {
            entityName: 'Stock Item',
            entityPluralName: 'Stock Items',
            primaryKey: 'id',
            displayField: 'itemCode',
            fields: [
                {
                    name: 'itemCode',
                    label: 'Item Code',
                    type: 'text',
                    required: true,
                    section: 'Basic Information',
                    width: '6',
                    description: 'Unique identifier for this stock item'
                },
                {
                    name: 'description',
                    label: 'Description',
                    type: 'text',
                    required: true,
                    section: 'Basic Information',
                    width: '6',
                    description: 'Full description of the item'
                },
                {
                    name: 'itemType',
                    label: 'Item Type',
                    type: 'select',
                    required: true,
                    section: 'Basic Information',
                    width: '6',
                    options: [
                        { value: 'manufactured', label: 'Manufactured Item' },
                        { value: 'standard', label: 'Standard Stock Item' },
                        { value: 'service', label: 'Service Item' },
                        { value: 'composite', label: 'Composite Item' },
                        { value: 'temporary', label: 'Temporary Item' }
                    ]
                },
                {
                    name: 'category',
                    label: 'Category',
                    type: 'select',
                    required: true,
                    section: 'Basic Information',
                    width: '6',
                    options: [
                        { value: 'timber-trusses', label: 'Timber Trusses' },
                        { value: 'structural-timber', label: 'Structural Timber' },
                        { value: 'roofing-materials', label: 'Roofing Materials' },
                        { value: 'hardware', label: 'Hardware & Fixings' },
                        { value: 'labour', label: 'Labour Services' },
                        { value: 'transport', label: 'Transport Services' }
                    ]
                },
                {
                    name: 'unitCost',
                    label: 'Unit Cost',
                    type: 'currency',
                    section: 'Pricing Information',
                    width: '4',
                    description: 'Cost price per unit'
                },
                {
                    name: 'unitPrice',
                    label: 'Unit Price',
                    type: 'currency',
                    section: 'Pricing Information',
                    width: '4',
                    description: 'Selling price per unit'
                },
                {
                    name: 'markup',
                    label: 'Markup %',
                    type: 'number',
                    section: 'Pricing Information',
                    width: '4',
                    description: 'Markup percentage',
                    readonly: true
                },
                {
                    name: 'stockUom',
                    label: 'Stock UOM',
                    type: 'select',
                    required: true,
                    section: 'Units of Measure',
                    width: '4',
                    description: 'Unit of measure for stock keeping',
                    options: [
                        { value: 'EA', label: 'Each (EA)' },
                        { value: 'M', label: 'Meters (M)' },
                        { value: 'M2', label: 'Square Meters (M²)' },
                        { value: 'M3', label: 'Cubic Meters (M³)' },
                        { value: 'KG', label: 'Kilograms (KG)' },
                        { value: 'L', label: 'Liters (L)' },
                        { value: 'HR', label: 'Hours (HR)' }
                    ]
                },
                {
                    name: 'salesUom',
                    label: 'Sales UOM',
                    type: 'select',
                    required: true,
                    section: 'Units of Measure',
                    width: '4',
                    description: 'Unit of measure for sales',
                    options: [
                        { value: 'EA', label: 'Each (EA)' },
                        { value: 'M', label: 'Meters (M)' },
                        { value: 'M2', label: 'Square Meters (M²)' },
                        { value: 'M3', label: 'Cubic Meters (M³)' },
                        { value: 'KG', label: 'Kilograms (KG)' },
                        { value: 'L', label: 'Liters (L)' },
                        { value: 'HR', label: 'Hours (HR)' }
                    ]
                },
                {
                    name: 'purchaseUom',
                    label: 'Purchase UOM',
                    type: 'select',
                    required: true,
                    section: 'Units of Measure',
                    width: '4',
                    description: 'Unit of measure for purchasing',
                    options: [
                        { value: 'EA', label: 'Each (EA)' },
                        { value: 'BOX', label: 'Box (BOX)' },
                        { value: 'M', label: 'Meters (M)' },
                        { value: 'M2', label: 'Square Meters (M²)' },
                        { value: 'M3', label: 'Cubic Meters (M³)' },
                        { value: 'KG', label: 'Kilograms (KG)' },
                        { value: 'L', label: 'Liters (L)' }
                    ]
                },
                {
                    name: 'purchasePackSize',
                    label: 'Purchase Pack Size',
                    type: 'number',
                    section: 'Units of Measure',
                    width: '6',
                    description: 'Number of stock units per purchase pack',
                    defaultValue: '1'
                },
                {
                    name: 'stockToSalesConversion',
                    label: 'Stock to Sales Conversion',
                    type: 'number',
                    section: 'Units of Measure',
                    width: '6',
                    description: 'Conversion factor from stock to sales units',
                    defaultValue: '1'
                },
                {
                    name: 'currentStock',
                    label: 'Current Stock',
                    type: 'number',
                    section: 'Inventory Information',
                    width: '4',
                    description: 'Current stock level'
                },
                {
                    name: 'minimumStock',
                    label: 'Minimum Stock',
                    type: 'number',
                    section: 'Inventory Information',
                    width: '4',
                    description: 'Minimum stock level threshold'
                },
                {
                    name: 'maximumStock',
                    label: 'Maximum Stock',
                    type: 'number',
                    section: 'Inventory Information',
                    width: '4',
                    description: 'Maximum stock level'
                },
                {
                    name: 'reorderPoint',
                    label: 'Reorder Point',
                    type: 'number',
                    section: 'Inventory Information',
                    width: '6',
                    description: 'Stock level at which to reorder'
                },
                {
                    name: 'reorderQuantity',
                    label: 'Reorder Quantity',
                    type: 'number',
                    section: 'Inventory Information',
                    width: '6',
                    description: 'Standard reorder quantity'
                },
                {
                    name: 'location',
                    label: 'Storage Location',
                    type: 'text',
                    section: 'Inventory Information',
                    width: '6',
                    description: 'Physical storage location'
                },
                {
                    name: 'supplierCode',
                    label: 'Supplier Code',
                    type: 'text',
                    section: 'Supplier Information',
                    width: '6',
                    description: 'Primary supplier reference'
                },
                {
                    name: 'supplierItemCode',
                    label: 'Supplier Item Code',
                    type: 'text',
                    section: 'Supplier Information',
                    width: '6',
                    description: 'Supplier\'s item code'
                },
                {
                    name: 'leadTime',
                    label: 'Lead Time (Days)',
                    type: 'number',
                    section: 'Supplier Information',
                    width: '6',
                    description: 'Standard delivery lead time'
                },
                {
                    name: 'isActive',
                    label: 'Active',
                    type: 'checkbox',
                    section: 'Status',
                    width: '6',
                    defaultValue: true,
                    description: 'Item is active and available for use'
                },
                {
                    name: 'isBomItem',
                    label: 'BOM Item',
                    type: 'checkbox',
                    section: 'Status',
                    width: '6',
                    description: 'Item can be used in Bill of Materials'
                },
                {
                    name: 'allowBackorder',
                    label: 'Allow Backorder',
                    type: 'checkbox',
                    section: 'Status',
                    width: '6',
                    description: 'Allow orders when out of stock'
                },
                {
                    name: 'trackSerialNumbers',
                    label: 'Track Serial Numbers',
                    type: 'checkbox',
                    section: 'Status',
                    width: '6',
                    description: 'Track individual serial numbers'
                },
                {
                    name: 'notes',
                    label: 'Notes',
                    type: 'textarea',
                    section: 'Additional Information',
                    width: '12',
                    rows: '3',
                    description: 'Additional notes or comments'
                }
            ]
        };

        super(containerId, config);
    }

    getSampleData() {
        return [
            {
                id: 1,
                itemCode: 'TR001',
                description: 'Standard Roof Truss 8m Span',
                itemType: 'manufactured',
                category: 'timber-trusses',
                unitCost: 450.00,
                unitPrice: 585.00,
                markup: 30,
                stockUom: 'EA',
                salesUom: 'EA',
                purchaseUom: 'EA',
                purchasePackSize: 1,
                stockToSalesConversion: 1,
                currentStock: 25,
                minimumStock: 10,
                maximumStock: 100,
                reorderPoint: 15,
                reorderQuantity: 50,
                location: 'YARD-A1',
                supplierCode: 'TRUSS-SUP',
                supplierItemCode: 'TR-8M-STD',
                leadTime: 14,
                isActive: true,
                isBomItem: false,
                allowBackorder: true,
                trackSerialNumbers: false,
                notes: 'Standard timber truss for residential construction',
                createdDate: '2025-01-01T10:00:00Z',
                modifiedDate: '2025-01-05T14:30:00Z'
            },
            {
                id: 2,
                itemCode: 'TM240X35',
                description: '240x35mm Pine Structural Timber',
                itemType: 'standard',
                category: 'structural-timber',
                unitCost: 15.50,
                unitPrice: 22.50,
                markup: 45,
                stockUom: 'M',
                salesUom: 'M',
                purchaseUom: 'M',
                purchasePackSize: 4.8,
                stockToSalesConversion: 1,
                currentStock: 180,
                minimumStock: 50,
                maximumStock: 500,
                reorderPoint: 75,
                reorderQuantity: 200,
                location: 'TIMBER-B2',
                supplierCode: 'PINE-SUP',
                supplierItemCode: 'PN240x35',
                leadTime: 7,
                isActive: true,
                isBomItem: true,
                allowBackorder: false,
                trackSerialNumbers: false,
                notes: 'H2 treated pine timber, 4.8m lengths',
                createdDate: '2025-01-01T10:00:00Z',
                modifiedDate: '2025-01-03T09:15:00Z'
            },
            {
                id: 3,
                itemCode: 'M10X10-NP',
                description: 'M10x10 Nail Plate',
                itemType: 'standard',
                category: 'hardware',
                unitCost: 0.85,
                unitPrice: 1.25,
                markup: 47,
                stockUom: 'EA',
                salesUom: 'EA',
                purchaseUom: 'BOX',
                purchasePackSize: 150,
                stockToSalesConversion: 1,
                currentStock: 2250,
                minimumStock: 500,
                maximumStock: 5000,
                reorderPoint: 750,
                reorderQuantity: 1500,
                location: 'HARDWARE-C1',
                supplierCode: 'METAL-SUP',
                supplierItemCode: 'NP-M10x10',
                leadTime: 10,
                isActive: true,
                isBomItem: true,
                allowBackorder: true,
                trackSerialNumbers: false,
                notes: 'Galvanized nail plates for truss connections',
                createdDate: '2025-01-01T10:00:00Z',
                modifiedDate: '2025-01-02T16:45:00Z'
            },
            {
                id: 4,
                itemCode: 'LAB-INSTALL',
                description: 'Roof Installation Labour',
                itemType: 'service',
                category: 'labour',
                unitCost: 45.00,
                unitPrice: 65.00,
                markup: 44,
                stockUom: 'HR',
                salesUom: 'HR',
                purchaseUom: 'HR',
                purchasePackSize: 1,
                stockToSalesConversion: 1,
                currentStock: 0,
                minimumStock: 0,
                maximumStock: 0,
                reorderPoint: 0,
                reorderQuantity: 0,
                location: 'N/A',
                supplierCode: 'LABOUR-TEAM',
                supplierItemCode: 'ROOF-INST',
                leadTime: 1,
                isActive: true,
                isBomItem: false,
                allowBackorder: true,
                trackSerialNumbers: false,
                notes: 'Professional roof installation service per hour',
                createdDate: '2025-01-01T10:00:00Z',
                modifiedDate: '2025-01-01T10:00:00Z'
            },
            {
                id: 5,
                itemCode: 'SHEET-0.42-ZAM',
                description: '0.42mm Zincalume Roofing Sheet',
                itemType: 'standard',
                category: 'roofing-materials',
                unitCost: 85.00,
                unitPrice: 125.00,
                markup: 47,
                stockUom: 'M2',
                salesUom: 'M2',
                purchaseUom: 'M2',
                purchasePackSize: 1,
                stockToSalesConversion: 1,
                currentStock: 450,
                minimumStock: 100,
                maximumStock: 1000,
                reorderPoint: 150,
                reorderQuantity: 300,
                location: 'SHEETING-D1',
                supplierCode: 'STEEL-SUP',
                supplierItemCode: 'ZAM-042-IBR',
                leadTime: 5,
                isActive: true,
                isBomItem: true,
                allowBackorder: false,
                trackSerialNumbers: false,
                notes: 'IBR profile, various lengths available',
                createdDate: '2025-01-01T10:00:00Z',
                modifiedDate: '2025-01-04T11:20:00Z'
            },
            {
                id: 6,
                itemCode: 'SCREW-14G-50',
                description: '14G x 50mm Self-Drilling Screws',
                itemType: 'standard',
                category: 'hardware',
                unitCost: 0.12,
                unitPrice: 0.18,
                markup: 50,
                stockUom: 'EA',
                salesUom: 'EA',
                purchaseUom: 'BOX',
                purchasePackSize: 500,
                stockToSalesConversion: 1,
                currentStock: 5500,
                minimumStock: 1000,
                maximumStock: 10000,
                reorderPoint: 1500,
                reorderQuantity: 2500,
                location: 'HARDWARE-C2',
                supplierCode: 'FASTENER-SUP',
                supplierItemCode: 'SD-14G-50',
                leadTime: 7,
                isActive: true,
                isBomItem: true,
                allowBackorder: true,
                trackSerialNumbers: false,
                notes: 'Self-drilling screws with washer seal',
                createdDate: '2025-01-01T10:00:00Z',
                modifiedDate: '2025-01-01T10:00:00Z'
            }
        ];
    }

    // Override methods for stock-specific functionality
    setupListEventListeners() {
        super.setupListEventListeners();
        
        // Add stock-specific functionality
        this.setupStockSpecificEvents();
    }

    setupStockSpecificEvents() {
        // Export functionality
        const exportExcelBtn = document.getElementById('export-excel-btn');
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', () => this.exportToExcel());
        }

        const exportCsvBtn = document.getElementById('export-csv-btn');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => this.exportToCSV());
        }

        // Stock specific actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.stock-action-btn')) {
                const action = e.target.closest('.stock-action-btn').getAttribute('data-action');
                const id = e.target.closest('.stock-action-btn').getAttribute('data-id');
                this.handleStockAction(action, id);
            }
        });
    }

    handleStockAction(action, id) {
        const item = this.data.find(item => item.id == id);
        if (!item) return;

        switch (action) {
            case 'adjust-stock':
                this.showStockAdjustmentModal(item);
                break;
            case 'view-movements':
                this.showStockMovements(item);
                break;
            case 'reorder':
                this.createReorderRequest(item);
                break;
        }
    }

    showStockAdjustmentModal(item) {
        // Create and show stock adjustment modal
        const modal = this.createModal('Stock Adjustment', `
            <form id="stock-adjustment-form">
                <div class="mb-3">
                    <label class="form-label">Item: ${item.itemCode} - ${item.description}</label>
                    <p class="text-muted">Current Stock: ${item.currentStock} ${item.stockUom}</p>
                </div>
                <div class="mb-3">
                    <label class="form-label">Adjustment Type</label>
                    <select class="form-select" name="adjustmentType" required>
                        <option value="">Select...</option>
                        <option value="increase">Stock Increase</option>
                        <option value="decrease">Stock Decrease</option>
                        <option value="set">Set to Specific Value</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Quantity</label>
                    <input type="number" class="form-control" name="quantity" required step="0.01">
                </div>
                <div class="mb-3">
                    <label class="form-label">Reason</label>
                    <select class="form-select" name="reason" required>
                        <option value="">Select...</option>
                        <option value="purchase">Purchase Receipt</option>
                        <option value="sale">Sale/Issue</option>
                        <option value="damaged">Damaged/Waste</option>
                        <option value="count">Stock Count Adjustment</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Notes</label>
                    <textarea class="form-control" name="notes" rows="2"></textarea>
                </div>
            </form>
        `, [
            { text: 'Cancel', class: 'btn-secondary' },
            { text: 'Apply Adjustment', class: 'btn-primary', action: () => this.applyStockAdjustment(item) }
        ]);
    }

    applyStockAdjustment(item) {
        const form = document.getElementById('stock-adjustment-form');
        const formData = new FormData(form);
        
        const adjustmentType = formData.get('adjustmentType');
        const quantity = parseFloat(formData.get('quantity'));
        const reason = formData.get('reason');
        const notes = formData.get('notes');

        let newStock = item.currentStock;
        
        switch (adjustmentType) {
            case 'increase':
                newStock += quantity;
                break;
            case 'decrease':
                newStock -= quantity;
                break;
            case 'set':
                newStock = quantity;
                break;
        }

        if (newStock < 0) {
            this.showNotification('Stock cannot be negative', 'error');
            return;
        }

        item.currentStock = newStock;
        item.modifiedDate = new Date().toISOString();

        this.showNotification(`Stock adjusted: ${item.itemCode} now has ${newStock} ${item.stockUom}`, 'success');
        this.filterData();
        this.updateTableContent();
        
        // Close modal
        const modal = document.querySelector('.modal.show');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            bsModal.hide();
        }
    }

    createModal(title, content, buttons = []) {
        const modalHtml = `
            <div class="modal fade" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        <div class="modal-footer">
                            ${buttons.map(btn => `
                                <button type="button" class="btn ${btn.class}" 
                                        ${btn.action ? '' : 'data-bs-dismiss="modal"'}>
                                    ${btn.text}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modalElement = document.createElement('div');
        modalElement.innerHTML = modalHtml;
        document.body.appendChild(modalElement.firstElementChild);

        const modal = new bootstrap.Modal(modalElement.firstElementChild);
        
        // Add button event listeners
        buttons.forEach((btn, index) => {
            if (btn.action) {
                const button = modalElement.querySelector(`.modal-footer .btn:nth-child(${index + 1})`);
                button.addEventListener('click', btn.action);
            }
        });

        modal.show();
        return modal;
    }

    exportToExcel() {
        this.showNotification('Excel export feature would be implemented here', 'info');
    }

    exportToCSV() {
        const headers = this.getVisibleFields().map(field => field.label || field.name);
        const rows = this.filteredData.map(item => 
            this.getVisibleFields().map(field => item[field.name] || '')
        );

        let csvContent = headers.join(',') + '\n';
        csvContent += rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock-items-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        this.showNotification('Stock items exported to CSV', 'success');
    }

    // Override formatFieldValue for stock-specific formatting
    formatFieldValue(value, field) {
        if (value === null || value === undefined || value === '') {
            return '<span class="text-muted">-</span>';
        }

        switch (field.name) {
            case 'currentStock':
                const item = this.data.find(item => item[field.name] === value);
                if (item && item.minimumStock && value <= item.minimumStock) {
                    return `<span class="text-danger fw-bold">${value}</span>`;
                }
                return value;
            
            case 'itemType':
                const badges = {
                    'manufactured': 'bg-primary',
                    'standard': 'bg-success',
                    'service': 'bg-info',
                    'composite': 'bg-warning',
                    'temporary': 'bg-secondary'
                };
                return `<span class="badge ${badges[value] || 'bg-secondary'}">${value}</span>`;
                
            default:
                return super.formatFieldValue(value, field);
        }
    }
}

// Initialize the Stock Power App when the page loads
let stockPowerApp;

// Make it available globally for the old stock management integration
window.StockPowerApp = StockPowerApp;