// Customer Management with Interactive Grid
class CustomerGridManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.currentView = 'grid';
        this.currentItem = null;
        
        // Customer data
        this.data = [];
        
        // Grid configuration
        this.gridConfig = {
            columns: [
                { key: 'accountNo', title: 'Account No.', width: '120px', type: 'text' },
                { key: 'accountName', title: 'Account Name', width: '200px', type: 'text' },
                { key: 'companyType', title: 'Company Type', width: '140px', type: 'select',
                  options: [
                      { value: 'Sole Proprietor', label: 'Sole Proprietor' },
                      { value: 'Partnership', label: 'Partnership' },
                      { value: 'Private Company', label: 'Private Company' },
                      { value: 'Public Company', label: 'Public Company' },
                      { value: 'Trust', label: 'Trust' },
                      { value: 'Other', label: 'Other' }
                  ]
                },
                { key: 'phone', title: 'Phone', width: '130px', type: 'text' },
                { key: 'email', title: 'Email', width: '180px', type: 'text' },
                { key: 'salesRepresentative', title: 'Sales Rep', width: '140px', type: 'select',
                  options: [
                      { value: 'John Smith', label: 'John Smith' },
                      { value: 'Sarah Johnson', label: 'Sarah Johnson' },
                      { value: 'Mike Wilson', label: 'Mike Wilson' },
                      { value: 'Lisa Brown', label: 'Lisa Brown' }
                  ]
                },
                { key: 'accountType', title: 'Account Type', width: '120px', type: 'select',
                  options: [
                      { value: 'Individual', label: 'Individual' },
                      { value: 'Business', label: 'Business' },
                      { value: 'Government', label: 'Government' },
                      { value: 'Non-Profit', label: 'Non-Profit' }
                  ]
                },
                { key: 'customerStatus', title: 'Status', width: '120px', type: 'select',
                  options: [
                      { value: 'Prospect', label: 'Prospect' },
                      { value: 'Confirmed Customer', label: 'Confirmed Customer' },
                      { value: 'Account Review', label: 'Account Review' }
                  ]
                },
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
            console.error('CustomerGridManager: Container not found:', containerId);
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
                accountNo: 'ACC001',
                accountName: 'Johnson Construction Ltd',
                companyType: 'Private Company',
                phone: '+27 11 123 4567',
                email: 'info@johnsonconstruction.co.za',
                salesRepresentative: 'John Smith',
                accountType: 'Business',
                customerStatus: 'Confirmed Customer',
                isActive: true
            },
            {
                id: 2,
                accountNo: 'ACC002',
                accountName: 'Smith Family Trust',
                companyType: 'Trust',
                phone: '+27 21 234 5678',
                email: 'smith.trust@gmail.com',
                salesRepresentative: 'Sarah Johnson',
                accountType: 'Individual',
                customerStatus: 'Prospect',
                isActive: true
            },
            {
                id: 3,
                accountNo: 'ACC003',
                accountName: 'Metro Housing Development',
                companyType: 'Public Company',
                phone: '+27 31 345 6789',
                email: 'procurement@metrohousing.co.za',
                salesRepresentative: 'Mike Wilson',
                accountType: 'Business',
                customerStatus: 'Account Review',
                isActive: true
            },
            {
                id: 4,
                accountNo: 'ACC004',
                accountName: 'Green Building Contractors',
                companyType: 'Private Company',
                phone: '+27 12 456 7890',
                email: 'admin@greenbuilding.co.za',
                salesRepresentative: 'Lisa Brown',
                accountType: 'Business',
                customerStatus: 'Confirmed Customer',
                isActive: true
            },
            {
                id: 5,
                accountNo: 'ACC005',
                accountName: 'Williams & Associates',
                companyType: 'Partnership',
                phone: '+27 41 567 8901',
                email: 'office@williamsassoc.co.za',
                salesRepresentative: 'John Smith',
                accountType: 'Business',
                customerStatus: 'Prospect',
                isActive: false
            }
        ];
        
        // Update grid config data
        this.gridConfig.data = this.data;
    }
    
    createMainLayout() {
        this.container.innerHTML = `
            <div class="customer-grid-manager">
                <!-- Header -->
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4><i class="fas fa-users me-2 text-primary"></i>Customer Management</h4>
                    <div class="btn-group">
                        <button class="btn btn-primary btn-sm" id="switch-to-form-btn">
                            <i class="fas fa-edit me-1"></i>Form View
                        </button>
                        <button class="btn btn-outline-info btn-sm" id="view-audit-btn">
                            <i class="fas fa-history me-1"></i>Audit Trail
                        </button>
                        <button class="btn btn-outline-success btn-sm" id="add-contact-btn">
                            <i class="fas fa-user-plus me-1"></i>Add Contact
                        </button>
                    </div>
                </div>
                
                <!-- Grid Container -->
                <div id="customer-grid-container"></div>
                
                <!-- Audit Trail Modal -->
                <div class="modal fade" id="customer-audit-modal" tabindex="-1">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Customer Management Audit Trail</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div id="customer-audit-viewer"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Contact Management Modal -->
                <div class="modal fade" id="contact-modal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Contact Management</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div id="contact-grid-container"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    initializeGrid() {
        this.grid = new InteractiveGrid('customer-grid-container', this.gridConfig);
        
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
                // Show the original form-based customer manager
                if (window.currentCustomerManager) {
                    window.currentCustomerManager.showList();
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
        
        // Add contact
        const addContactBtn = document.getElementById('add-contact-btn');
        if (addContactBtn) {
            addContactBtn.addEventListener('click', () => {
                this.showContactManagement();
            });
        }
    }
    
    showAuditTrail() {
        const modal = new bootstrap.Modal(document.getElementById('customer-audit-modal'));
        
        // Create audit viewer with customer-specific filters
        if (window.auditTrailManager) {
            window.auditTrailManager.createAuditViewer('customer-audit-viewer', {
                filters: { module: 'customer' }
            });
        }
        
        modal.show();
    }
    
    showContactManagement() {
        const modal = new bootstrap.Modal(document.getElementById('contact-modal'));
        
        // Create contact grid
        const contactConfig = {
            columns: [
                { key: 'firstName', title: 'First Name', width: '120px', type: 'text' },
                { key: 'lastName', title: 'Last Name', width: '120px', type: 'text' },
                { key: 'email', title: 'Email', width: '180px', type: 'text' },
                { key: 'phone', title: 'Phone', width: '130px', type: 'text' },
                { key: 'position', title: 'Position', width: '140px', type: 'text' },
                { key: 'department', title: 'Department', width: '120px', type: 'text' },
                { key: 'isPrimary', title: 'Primary', width: '60px', type: 'checkbox' }
            ],
            data: [
                {
                    id: 1,
                    firstName: 'John',
                    lastName: 'Johnson',
                    email: 'john@johnsonconstruction.co.za',
                    phone: '+27 11 123 4567',
                    position: 'Managing Director',
                    department: 'Executive',
                    isPrimary: true
                },
                {
                    id: 2,
                    firstName: 'Mary',
                    lastName: 'Johnson',
                    email: 'mary@johnsonconstruction.co.za',
                    phone: '+27 11 123 4568',
                    position: 'Project Manager',
                    department: 'Operations',
                    isPrimary: false
                }
            ],
            editable: true,
            selectable: true,
            exportable: true,
            importable: true,
            auditTrail: true
        };
        
        this.contactGrid = new InteractiveGrid('contact-grid-container', contactConfig);
        modal.show();
    }
    
    recordAuditEvent(action, recordId, metadata) {
        if (window.auditTrailManager) {
            window.auditTrailManager.recordEvent({
                module: 'customer',
                recordType: 'customer',
                recordId,
                action,
                metadata: {
                    component: 'CustomerGridManager',
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
window.CustomerGridManager = CustomerGridManager;