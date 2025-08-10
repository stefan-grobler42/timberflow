// Customer Management System - Based on Account Excel Specification [LEGACY - KEPT AS SAFETY NET]
// NOTE: This component is preserved for rollback safety but no longer actively used
// The new modular customer system is in src/modules/customers/
class CustomerManager {
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
        this.companyTypes = ['Sole Proprietor', 'Private Company', 'Public Company', 'Close Corporation', 'Partnership', 'Trust', 'Individual'];
        this.accountTypes = ['Prospect', 'Customer', 'Supplier', 'Partner', 'Competitor'];
        this.customerStatuses = ['Prospect', 'Confirmed Customer', 'Account Under Review', 'Credit Approved', 'Account Closed'];
        this.approvalStatuses = ['Pending', 'Credit App Required', 'References Check', 'Payment History Review', 'Approved', 'Rejected'];
        this.relationshipTypes = ['Customer', 'Subsidiary', 'Parent Company', 'Joint Venture', 'Supplier', 'Partner'];
        this.employees = ['John Smith', 'Sarah Johnson', 'Mike Brown', 'Lisa Davis'];
        
        // Contacts data
        this.contacts = [];
        
        // Lookup field instances
        this.lookupFields = {};
        
        if (!this.container) {
            console.error('CustomerManager: Container not found:', containerId);
            return;
        }
        
        this.init();
    }

    init() {
        console.log('CustomerManager: Initializing...');
        this.loadSampleData();
        this.render();
        console.log('CustomerManager: Ready');
    }

    loadSampleData() {
        this.data = [
            {
                id: 1,
                accountNo: 'PROS001',
                accountName: 'Millennium Construction Ltd',
                companyType: 'Private Company',
                companyRegistrationNo: '2018/123456/07',
                vatRegistrationNo: '4123456789',
                phone: '+27 11 234 5678',
                email: 'info@millennium.co.za',
                website: 'https://www.millennium.co.za',
                parentAccount: null,
                accountType: 'Prospect',
                customerStatus: 'Prospect',
                approvalStatus: 'Pending',
                salesRepresentative: 'John Smith',
                relationshipType: 'Customer',
                primaryContact: 'Mike Johnson',
                address: '123 Construction Ave, Johannesburg, 2001',
                dateCreated: '2025-08-01',
                quotesRequested: 3,
                totalQuoteValue: 250000,
                isActive: true
            },
            {
                id: 2,
                accountNo: 'CUST002',
                accountName: 'Cape Town Developers',
                companyType: 'Private Company',
                companyRegistrationNo: '2019/234567/07',
                vatRegistrationNo: '4234567890',
                phone: '+27 21 345 6789',
                email: 'projects@ctdevelopers.co.za',
                website: 'https://www.ctdevelopers.co.za',
                parentAccount: null,
                accountType: 'Customer',
                customerStatus: 'Confirmed Customer',
                approvalStatus: 'Approved',
                salesRepresentative: 'Sarah Johnson',
                relationshipType: 'Customer',
                primaryContact: 'Susan Williams',
                address: '456 Development St, Cape Town, 8001',
                dateCreated: '2024-12-15',
                quotesRequested: 8,
                totalQuoteValue: 750000,
                ordersPlaced: 2,
                isActive: true
            },
            {
                id: 3,
                accountNo: 'PROS003',
                accountName: 'Durban Home Builders',
                companyType: 'Close Corporation',
                companyRegistrationNo: 'CK2020/345678/23',
                vatRegistrationNo: '4345678901',
                phone: '+27 31 456 7890',
                email: 'admin@dhb.co.za',
                website: 'https://www.dhb.co.za',
                parentAccount: null,
                accountType: 'Prospect',
                customerStatus: 'Account Under Review',
                approvalStatus: 'Credit App Required',
                salesRepresentative: 'Mike Brown',
                relationshipType: 'Customer',
                primaryContact: 'David Thompson',
                address: '789 Builder Road, Durban, 4001',
                dateCreated: '2025-07-20',
                quotesRequested: 5,
                totalQuoteValue: 180000,
                isActive: true
            },
            {
                id: 4,
                accountNo: 'CUST004',
                accountName: 'Pretoria Property Group',
                companyType: 'Private Company',
                companyRegistrationNo: '2017/456789/07',
                vatRegistrationNo: '4456789012',
                phone: '+27 12 567 8901',
                email: 'contracts@ppg.co.za',
                website: 'https://www.ppg.co.za',
                parentAccount: null,
                accountType: 'Customer',
                customerStatus: 'Credit Approved',
                approvalStatus: 'Approved',
                salesRepresentative: 'Lisa Davis',
                relationshipType: 'Customer',
                primaryContact: 'Robert Clark',
                address: '321 Capital Rd, Pretoria, 0001',
                dateCreated: '2024-06-10',
                quotesRequested: 12,
                totalQuoteValue: 1200000,
                ordersPlaced: 5,
                isActive: true
            },
            {
                id: 5,
                accountNo: 'PROS005',
                accountName: 'Coastal Homes CC',
                companyType: 'Close Corporation',
                companyRegistrationNo: 'CK2021/567890/23',
                vatRegistrationNo: '4567890123',
                phone: '+27 39 678 9012',
                email: 'info@coastalhomes.co.za',
                website: 'https://www.coastalhomes.co.za',
                parentAccount: null,
                accountType: 'Prospect',
                customerStatus: 'Prospect',
                approvalStatus: 'Pending',
                salesRepresentative: 'John Smith',
                relationshipType: 'Customer',
                primaryContact: 'Emma Taylor',
                address: '654 Beach Front Dr, Port Elizabeth, 6001',
                dateCreated: '2025-07-05',
                quotesRequested: 2,
                totalQuoteValue: 95000,
                isActive: true
            },
            {
                id: 6,
                accountNo: 'CUST006',
                accountName: 'Midlands Construction',
                companyType: 'Private Company',
                companyRegistrationNo: '2015/678901/07',
                vatRegistrationNo: '4678901234',
                phone: '+27 33 789 0123',
                email: 'projects@midlands.co.za',
                website: 'https://www.midlands.co.za',
                parentAccount: null,
                accountType: 'Customer',
                customerStatus: 'Confirmed Customer',
                approvalStatus: 'References Check',
                salesRepresentative: 'Sarah Johnson',
                relationshipType: 'Customer',
                primaryContact: 'James Wilson',
                address: '987 Industrial Ave, Pietermaritzburg, 3200',
                dateCreated: '2024-08-22',
                quotesRequested: 15,
                totalQuoteValue: 890000,
                ordersPlaced: 3,
                isActive: true
            },
            {
                id: 7,
                accountNo: 'SUPP007',
                accountName: 'Northern Timber Supplies',
                companyType: 'Private Company',
                companyRegistrationNo: '2020/789012/07',
                vatRegistrationNo: '4789012345',
                phone: '+27 15 890 1234',
                email: 'sales@northerntimber.co.za',
                website: 'https://www.northerntimber.co.za',
                parentAccount: null,
                accountType: 'Supplier',
                customerStatus: 'Confirmed Customer',
                approvalStatus: 'Approved',
                salesRepresentative: 'Mike Brown',
                relationshipType: 'Supplier',
                primaryContact: 'Paul Anderson',
                address: '456 Timber Mills Rd, Polokwane, 0700',
                dateCreated: '2024-03-15',
                quotesRequested: 0,
                totalQuoteValue: 0,
                ordersPlaced: 0,
                isActive: true
            },
            {
                id: 8,
                accountNo: 'PROS008',
                accountName: 'Garden Route Developments',
                companyType: 'Private Company',
                companyRegistrationNo: '2022/890123/07',
                vatRegistrationNo: '4890123456',
                phone: '+27 44 901 2345',
                email: 'info@gardenroute.co.za',
                website: 'https://www.gardenroute.co.za',
                parentAccount: null,
                accountType: 'Prospect',
                customerStatus: 'Account Under Review',
                approvalStatus: 'Payment History Review',
                salesRepresentative: 'Lisa Davis',
                relationshipType: 'Customer',
                primaryContact: 'Michelle Roberts',
                address: '123 Ocean View Dr, George, 6530',
                dateCreated: '2025-06-18',
                quotesRequested: 7,
                totalQuoteValue: 420000,
                isActive: true
            },
            {
                id: 9,
                accountNo: 'CUST009',
                accountName: 'Free State Builders',
                companyType: 'Partnership',
                companyRegistrationNo: 'P2019/901234/21',
                vatRegistrationNo: '4901234567',
                phone: '+27 51 012 3456',
                email: 'admin@fsbuilders.co.za',
                website: 'https://www.fsbuilders.co.za',
                parentAccount: null,
                accountType: 'Customer',
                customerStatus: 'Credit Approved',
                approvalStatus: 'Approved',
                salesRepresentative: 'John Smith',
                relationshipType: 'Customer',
                primaryContact: 'Kevin Miller',
                address: '789 Central Ave, Bloemfontein, 9300',
                dateCreated: '2024-01-12',
                quotesRequested: 18,
                totalQuoteValue: 1350000,
                ordersPlaced: 6,
                isActive: true
            },
            {
                id: 10,
                accountNo: 'PROS010',
                accountName: 'West Rand Properties',
                companyType: 'Private Company',
                companyRegistrationNo: '2023/012345/07',
                vatRegistrationNo: '5012345678',
                phone: '+27 11 123 4567',
                email: 'projects@westrand.co.za',
                website: null,
                parentAccount: null,
                accountType: 'Prospect',
                customerStatus: 'Prospect',
                approvalStatus: 'Pending',
                salesRepresentative: 'Mike Brown',
                relationshipType: 'Customer',
                primaryContact: 'Sandra Lewis',
                address: '321 Mining Rd, Krugersdorp, 1739',
                dateCreated: '2025-07-28',
                quotesRequested: 1,
                totalQuoteValue: 65000,
                isActive: true
            }
        ];
        
        // Load contact data
        this.contacts = [
            {
                id: 1,
                customerId: 1,
                firstName: 'Mike',
                lastName: 'Johnson',
                title: 'Project Manager',
                phone: '+27 11 234 5679',
                email: 'mike.johnson@millennium.co.za',
                isPrimary: true
            },
            {
                id: 2,
                customerId: 2,
                firstName: 'Susan',
                lastName: 'Williams',
                title: 'Development Director',
                phone: '+27 21 345 6790',
                email: 'susan@ctdevelopers.co.za',
                isPrimary: true
            },
            {
                id: 3,
                customerId: 2,
                firstName: 'James',
                lastName: 'Smith',
                title: 'Site Manager',
                phone: '+27 21 345 6791',
                email: 'james@ctdevelopers.co.za',
                isPrimary: false
            },
            {
                id: 4,
                customerId: 3,
                firstName: 'David',
                lastName: 'Thompson',
                title: 'Owner',
                phone: '+27 31 456 7891',
                email: 'david@dhb.co.za',
                isPrimary: true
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
        // Initialize enhanced data grid if not already done
        if (!this.dataGrid) {
            this.container.innerHTML = `
                <div class="customer-manager-container">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2><i class="fas fa-user-tie"></i> Customer Management</h2>
                    </div>
                    <div id="customer-grid-container"></div>
                </div>
            `;

            const gridConfig = {
                entityName: 'Customer',
                columns: [
                    { field: 'accountNo', header: 'Account No.', width: '120px' },
                    { field: 'accountName', header: 'Account Name', width: '200px' },
                    { field: 'companyType', header: 'Company Type', type: 'badge', width: '150px',
                      badgeClasses: {
                        'Private Company': 'bg-primary',
                        'Close Corporation': 'bg-info',
                        'Partnership': 'bg-success',
                        'Sole Proprietor': 'bg-warning',
                        'Public Company': 'bg-dark',
                        'Trust': 'bg-secondary',
                        'Individual': 'bg-light text-dark'
                      }
                    },
                    { field: 'phone', header: 'Phone', width: '150px' },
                    { field: 'email', header: 'Email', width: '200px' },
                    { field: 'salesRepresentative', header: 'Sales Rep', width: '120px' },
                    { field: 'accountType', header: 'Account Type', type: 'badge', width: '120px',
                      badgeClasses: {
                        'Prospect': 'bg-warning',
                        'Customer': 'bg-success',
                        'Supplier': 'bg-info',
                        'Partner': 'bg-primary',
                        'Competitor': 'bg-danger'
                      }
                    },
                    { field: 'customerStatus', header: 'Customer Status', type: 'badge', width: '150px',
                      badgeClasses: {
                        'Prospect': 'bg-warning',
                        'Confirmed Customer': 'bg-success',
                        'Account Under Review': 'bg-info',
                        'Credit Approved': 'bg-primary',
                        'Account Closed': 'bg-danger'
                      }
                    },
                    { field: 'approvalStatus', header: 'Approval Status', type: 'badge', width: '150px',
                      badgeClasses: {
                        'Pending': 'bg-warning',
                        'Credit App Required': 'bg-info',
                        'References Check': 'bg-secondary',
                        'Payment History Review': 'bg-primary',
                        'Approved': 'bg-success',
                        'Rejected': 'bg-danger'
                      }
                    },
                    { field: 'quotesRequested', header: 'Quotes', type: 'number', width: '80px' },
                    { field: 'totalQuoteValue', header: 'Quote Value', type: 'currency', width: '120px' },
                    { field: 'ordersPlaced', header: 'Orders', type: 'number', width: '80px' },
                    { field: 'dateCreated', header: 'Date Created', type: 'date', width: '120px' },
                    { field: 'isActive', header: 'Active', type: 'boolean', width: '80px' }
                ],
                onRowClick: (id) => this.editCustomer(id),
                onNew: () => this.newCustomer(),
                onDelete: (id) => this.deleteCustomer(id),
                onSelectionChange: (selectedIds) => {
                    console.log('Selected customers:', selectedIds);
                }
            };

            this.dataGrid = new EnhancedDataGrid('customer-grid-container', gridConfig);
        }
        
        // Update grid data
        this.dataGrid.setData(this.data);
    }

    renderFormView() {
        const customer = this.currentItem || this.getEmptyCustomer();
        const isEdit = this.currentItem !== null;

        this.container.innerHTML = `
            <div class="customer-form-container">
                <!-- Header -->
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
                    <h3><i class="fas fa-user-tie"></i> ${isEdit ? 'Edit Customer' : 'New Customer'}</h3>
                </div>

                <!-- Customer Form -->
                <form id="customer-form">
                    <div class="row">
                        <!-- Basic Information -->
                        <div class="col-lg-6">
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h5><i class="fas fa-id-card"></i> Basic Information</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="accountNo" class="form-label">Account No. *</label>
                                            <input type="text" class="form-control" id="accountNo" value="${customer.accountNo}" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="accountName" class="form-label">Account Name *</label>
                                            <input type="text" class="form-control" id="accountName" value="${customer.accountName}" required>
                                        </div>
                                    </div>
                                    
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="companyType" class="form-label">Company Type *</label>
                                            <input type="text" class="form-control lookup-field" id="companyType" 
                                                   value="${customer.companyType}" data-lookup="companyTypes" 
                                                   placeholder="Type to search company types..." required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="accountType" class="form-label">Account Type *</label>
                                            <input type="text" class="form-control lookup-field" id="accountType" 
                                                   value="${customer.accountType}" data-lookup="accountTypes" 
                                                   placeholder="Type to search account types..." required>
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="companyRegistrationNo" class="form-label">Company Registration No.</label>
                                            <input type="text" class="form-control" id="companyRegistrationNo" value="${customer.companyRegistrationNo}">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="vatRegistrationNo" class="form-label">VAT Registration No.</label>
                                            <input type="text" class="form-control" id="vatRegistrationNo" value="${customer.vatRegistrationNo}">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Contact Information -->
                        <div class="col-lg-6">
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h5><i class="fas fa-address-book"></i> Contact Information</h5>
                                </div>
                                <div class="card-body">
                                    <div class="mb-3">
                                        <label for="phone" class="form-label">Phone Number</label>
                                        <input type="tel" class="form-control phone-field" id="phone" value="${customer.phone}">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="email" class="form-label">Email Address</label>
                                        <input type="email" class="form-control email-field" id="email" value="${customer.email}">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="website" class="form-label">Website</label>
                                        <input type="url" class="form-control website-field" id="website" value="${customer.website}">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="enhanced-location-container" class="form-label">Address</label>
                                        <div id="enhanced-location-container"></div>
                                        <!-- Hidden field to store location data -->
                                        <input type="hidden" id="address" value="${customer.address}">
                                        <input type="hidden" id="location-data" value="">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Customer Status & Workflow -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5><i class="fas fa-chart-line"></i> Customer Status & Workflow</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4 mb-3">
                                    <label for="customerStatus" class="form-label">Customer Status *</label>
                                    <input type="text" class="form-control lookup-field" id="customerStatus" 
                                           value="${customer.customerStatus || 'Prospect'}" data-lookup="customerStatuses" 
                                           placeholder="Type to search statuses..." required>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label for="approvalStatus" class="form-label">Approval Status</label>
                                    <input type="text" class="form-control lookup-field" id="approvalStatus" 
                                           value="${customer.approvalStatus || 'Pending'}" data-lookup="approvalStatuses" 
                                           placeholder="Type to search approval status...">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label for="dateCreated" class="form-label">Date Created</label>
                                    <input type="date" class="form-control" id="dateCreated" 
                                           value="${customer.dateCreated || new Date().toISOString().split('T')[0]}">
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-3 mb-3">
                                    <label for="quotesRequested" class="form-label">Quotes Requested</label>
                                    <input type="number" class="form-control" id="quotesRequested" 
                                           value="${customer.quotesRequested || 0}" min="0">
                                </div>
                                <div class="col-md-3 mb-3">
                                    <label for="totalQuoteValue" class="form-label">Total Quote Value</label>
                                    <input type="number" class="form-control" id="totalQuoteValue" 
                                           value="${customer.totalQuoteValue || 0}" min="0" step="0.01" placeholder="R 0.00">
                                </div>
                                <div class="col-md-3 mb-3">
                                    <label for="ordersPlaced" class="form-label">Orders Placed</label>
                                    <input type="number" class="form-control" id="ordersPlaced" 
                                           value="${customer.ordersPlaced || 0}" min="0">
                                </div>
                                <div class="col-md-3 mt-4">
                                    <button type="button" class="btn btn-outline-success btn-sm" id="promote-customer-btn" 
                                            ${customer.customerStatus === 'Confirmed Customer' ? 'disabled' : ''}>
                                        <i class="fas fa-arrow-up"></i> 
                                        ${customer.customerStatus === 'Prospect' ? 'Confirm Customer' : 'Update Status'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Relationship Information -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5><i class="fas fa-users"></i> Relationship Information</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="salesRepresentative" class="form-label">Sales Representative</label>
                                    <input type="text" class="form-control lookup-field" id="salesRepresentative" 
                                           value="${customer.salesRepresentative}" data-lookup="employees" 
                                           placeholder="Type to search employees...">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="relationshipType" class="form-label">Relationship Type</label>
                                    <input type="text" class="form-control lookup-field" id="relationshipType" 
                                           value="${customer.relationshipType}" data-lookup="relationshipTypes" 
                                           placeholder="Type to search relationship types...">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="primaryContact" class="form-label">Primary Contact</label>
                                    <input type="text" class="form-control" id="primaryContact" value="${customer.primaryContact}">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="parentAccount" class="form-label">Parent Account</label>
                                    <input type="text" class="form-control lookup-field" id="parentAccount" 
                                           value="${customer.parentAccount}" data-lookup="parentAccounts" 
                                           placeholder="Type to search accounts...">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Status -->
                    <div class="card mb-4">
                        <div class="card-body">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="isActive" ${customer.isActive ? 'checked' : ''}>
                                <label class="form-check-label" for="isActive">
                                    Active Customer
                                </label>
                            </div>
                        </div>
                    </div>

                </form>
            </div>
        `;

        this.attachFormEventListeners();
    }

    attachListEventListeners() {
        // New customer button
        const newBtn = document.getElementById('new-customer-btn');
        if (newBtn) {
            newBtn.addEventListener('click', () => this.newCustomer());
        }

        // Search
        const searchInput = document.getElementById('customer-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.renderListView();
            });
        }

        // Filters
        ['account-type-filter', 'company-type-filter', 'status-filter'].forEach(id => {
            const filter = document.getElementById(id);
            if (filter) {
                filter.addEventListener('change', () => this.renderListView());
            }
        });

        // Row clicks and buttons
        this.container.addEventListener('click', (e) => {
            const row = e.target.closest('.clickable-row');
            if (row && !e.target.closest('button')) {
                const id = parseInt(row.getAttribute('data-id'));
                this.editCustomer(id);
            }

            if (e.target.closest('.edit-btn')) {
                const id = parseInt(e.target.closest('.edit-btn').getAttribute('data-id'));
                this.editCustomer(id);
            }

            if (e.target.closest('.delete-btn')) {
                const id = parseInt(e.target.closest('.delete-btn').getAttribute('data-id'));
                this.deleteCustomer(id);
            }
        });
    }

    attachFormEventListeners() {
        // Store original item state for undo functionality
        if (this.currentItem) {
            this.originalItem = JSON.parse(JSON.stringify(this.currentItem));
        } else {
            this.originalItem = null;
        }
        this.hasUnsavedChanges = false;

        const form = document.getElementById('customer-form');
        if (form) {
            // Remove default form submission, auto-save will handle saving
            form.addEventListener('submit', (e) => {
                e.preventDefault();
            });
            
            // Add change detection for auto-save
            form.addEventListener('input', () => {
                this.detectChanges();
            });
            
            form.addEventListener('change', () => {
                this.detectChanges();
            });
        }

        const backBtn = document.getElementById('back-to-list-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.handleBackToList());
        }

        const undoBtn = document.getElementById('undo-changes-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undoChanges());
        }
        
        // Initialize lookup fields
        this.initializeLookupFields();
        
        // Initialize location picker
        this.initializeLocationPicker();
        
        // Make contact fields clickable
        this.initializeClickableFields();
    }
    
    initializeLookupFields() {
        // Clear existing lookup fields
        Object.values(this.lookupFields).forEach(field => {
            if (field.dropdown && field.dropdown.parentNode) {
                field.dropdown.parentNode.removeChild(field.dropdown);
            }
        });
        this.lookupFields = {};
        
        // Company Types
        const companyTypeInput = document.getElementById('companyType');
        if (companyTypeInput) {
            this.lookupFields.companyType = createLookupField(companyTypeInput, this.companyTypes, {
                placeholder: 'Type to search company types...'
            });
        }
        
        // Account Types
        const accountTypeInput = document.getElementById('accountType');
        if (accountTypeInput) {
            this.lookupFields.accountType = createLookupField(accountTypeInput, this.accountTypes, {
                placeholder: 'Type to search account types...'
            });
        }
        
        // Customer Status
        const customerStatusInput = document.getElementById('customerStatus');
        if (customerStatusInput) {
            this.lookupFields.customerStatus = createLookupField(customerStatusInput, this.customerStatuses, {
                placeholder: 'Type to search customer statuses...'
            });
        }
        
        // Approval Status
        const approvalStatusInput = document.getElementById('approvalStatus');
        if (approvalStatusInput) {
            this.lookupFields.approvalStatus = createLookupField(approvalStatusInput, this.approvalStatuses, {
                placeholder: 'Type to search approval statuses...'
            });
        }
        
        // Sales Representative
        const salesRepInput = document.getElementById('salesRepresentative');
        if (salesRepInput) {
            this.lookupFields.salesRepresentative = createLookupField(salesRepInput, this.employees, {
                placeholder: 'Type to search employees...'
            });
        }
        
        // Relationship Types
        const relationshipInput = document.getElementById('relationshipType');
        if (relationshipInput) {
            this.lookupFields.relationshipType = createLookupField(relationshipInput, this.relationshipTypes, {
                placeholder: 'Type to search relationship types...'
            });
        }
        
        // Parent Account
        const parentAccountInput = document.getElementById('parentAccount');
        if (parentAccountInput) {
            const parentAccounts = this.data
                .filter(c => !this.currentItem || c.id !== this.currentItem.id)
                .map(c => ({ name: c.accountName, value: c.accountName }));
            
            this.lookupFields.parentAccount = createLookupField(parentAccountInput, parentAccounts, {
                placeholder: 'Type to search accounts...'
            });
        }
    }
    
    initializeLocationPicker() {
        const container = document.getElementById('enhanced-location-container');
        const addressInput = document.getElementById('address');
        const locationDataInput = document.getElementById('location-data');
        
        if (container) {
            // Initialize enhanced location field
            this.enhancedLocationField = new EnhancedLocationField('enhanced-location-container', {
                onLocationSelect: (locationData) => {
                    console.log('Location selected:', locationData);
                    
                    // Update hidden fields with location data
                    if (addressInput) {
                        addressInput.value = locationData.address || locationData.coordinates;
                    }
                    if (locationDataInput) {
                        locationDataInput.value = JSON.stringify(locationData);
                    }
                    
                    // Store location data for saving
                    this.currentLocationData = locationData;
                }
            });
            
            // Load existing location data if available
            if (this.currentItem && this.currentItem.locationData) {
                try {
                    const locationData = typeof this.currentItem.locationData === 'string' 
                        ? JSON.parse(this.currentItem.locationData) 
                        : this.currentItem.locationData;
                    
                    if (locationData.lat && locationData.lng) {
                        this.enhancedLocationField.loadSavedLocation(locationData);
                    }
                } catch (e) {
                    console.warn('Could not load saved location data:', e);
                }
            }
        }
    }
    

    
    initializeClickableFields() {
        // Add delay to ensure fields are rendered
        setTimeout(() => {
            // Only apply to specific fields, not all fields
            const phoneField = document.getElementById('phone');
            const emailField = document.getElementById('email');
            const websiteField = document.getElementById('website');
            
            if (phoneField) {
                ClickableFieldUtils.makePhoneClickable(phoneField);
            }
            if (emailField) {
                ClickableFieldUtils.makeEmailClickable(emailField);
            }
            if (websiteField) {
                ClickableFieldUtils.makeWebsiteClickable(websiteField);
            }
        }, 100);
    }
    
    updateMapDisplay(mapContainer, address) {
        if (mapContainer && address) {
            // Create a more realistic map view with pin
            mapContainer.innerHTML = `
                <div style="width: 100%; height: 150px; background: linear-gradient(135deg, #a8e6cf 0%, #88d8a3 50%, #68c182 100%); border: 2px solid #28a745; border-radius: 0.375rem; position: relative; cursor: pointer; overflow: hidden;">
                    <!-- Simulated map grid -->
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.3;">
                        <div style="position: absolute; top: 25%; left: 15%; width: 2px; height: 50%; background: #fff;"></div>
                        <div style="position: absolute; top: 40%; left: 0; width: 100%; height: 2px; background: #fff;"></div>
                        <div style="position: absolute; top: 25%; right: 20%; width: 2px; height: 50%; background: #fff;"></div>
                        <div style="position: absolute; top: 15%; left: 0; width: 100%; height: 2px; background: #fff;"></div>
                    </div>
                    
                    <!-- Location pin -->
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -100%); z-index: 3;">
                        <i class="fas fa-map-marker-alt fa-2x text-danger" style="filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));"></i>
                    </div>
                    
                    <!-- Address info overlay -->
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); color: white; padding: 8px; text-align: center;">
                        <div style="font-size: 12px; font-weight: bold; margin-bottom: 2px;">📍 Address Located</div>
                        <div style="font-size: 10px; opacity: 0.9; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${address}</div>
                        <div style="font-size: 9px; opacity: 0.7; margin-top: 2px;">
                            <i class="fas fa-external-link-alt"></i> Click to navigate
                        </div>
                    </div>
                    
                    <!-- Success indicator -->
                    <div style="position: absolute; top: 10px; right: 10px; z-index: 4;">
                        <i class="fas fa-check-circle text-success fa-lg" style="background: white; border-radius: 50%; padding: 2px;"></i>
                    </div>
                </div>
            `;
            
            // Add click handler to open Google Maps
            mapContainer.addEventListener('click', () => {
                const encodedAddress = encodeURIComponent(address);
                window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
            });
        }
    }

    getFilteredData() {
        let filtered = this.data;

        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(customer => 
                customer.accountNo.toLowerCase().includes(term) ||
                customer.accountName.toLowerCase().includes(term) ||
                customer.phone.toLowerCase().includes(term) ||
                customer.email.toLowerCase().includes(term)
            );
        }

        const accountTypeFilter = document.getElementById('account-type-filter')?.value;
        if (accountTypeFilter) {
            filtered = filtered.filter(customer => customer.accountType === accountTypeFilter);
        }

        const companyTypeFilter = document.getElementById('company-type-filter')?.value;
        if (companyTypeFilter) {
            filtered = filtered.filter(customer => customer.companyType === companyTypeFilter);
        }

        const statusFilter = document.getElementById('status-filter')?.value;
        if (statusFilter) {
            const isActive = statusFilter === 'active';
            filtered = filtered.filter(customer => customer.isActive === isActive);
        }

        return filtered;
    }

    newCustomer() {
        this.currentItem = null;
        this.originalItem = null;
        this.hasUnsavedChanges = false;
        this.currentView = 'form';
        this.render();
    }

    editCustomer(id) {
        this.currentItem = this.data.find(customer => customer.id === id);
        this.originalItem = null; // Will be set in attachFormEventListeners
        this.hasUnsavedChanges = false;
        this.currentView = 'form';
        this.render();
    }

    deleteCustomer(id) {
        const customer = this.data.find(c => c.id === id);
        if (customer && confirm(`Are you sure you want to delete customer "${customer.accountName}"?`)) {
            this.data = this.data.filter(c => c.id !== id);
            this.renderListView();
            this.showNotification('Customer deleted successfully', 'success');
        }
    }



    getFormData() {
        const locationDataInput = document.getElementById('location-data');
        let locationData = null;
        
        // Get location data if available
        if (locationDataInput && locationDataInput.value) {
            try {
                locationData = JSON.parse(locationDataInput.value);
            } catch (e) {
                console.warn('Could not parse location data:', e);
            }
        }
        
        return {
            accountNo: document.getElementById('accountNo').value,
            accountName: document.getElementById('accountName').value,
            companyType: document.getElementById('companyType').value,
            companyRegistrationNo: document.getElementById('companyRegistrationNo').value,
            vatRegistrationNo: document.getElementById('vatRegistrationNo').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            website: document.getElementById('website').value,
            parentAccount: document.getElementById('parentAccount').value,
            accountType: document.getElementById('accountType').value,
            customerStatus: document.getElementById('customerStatus').value,
            approvalStatus: document.getElementById('approvalStatus').value,
            dateCreated: document.getElementById('dateCreated').value,
            quotesRequested: parseInt(document.getElementById('quotesRequested').value) || 0,
            totalQuoteValue: parseFloat(document.getElementById('totalQuoteValue').value) || 0,
            ordersPlaced: parseInt(document.getElementById('ordersPlaced').value) || 0,
            salesRepresentative: document.getElementById('salesRepresentative').value,
            relationshipType: document.getElementById('relationshipType').value,
            primaryContact: document.getElementById('primaryContact').value,
            address: document.getElementById('address').value,
            locationData: locationData,
            isActive: document.getElementById('isActive').checked
        };
    }

    validateForm(data) {
        if (!data.accountNo || !data.accountName || !data.companyType || !data.accountType) {
            this.showNotification('Please fill in all required fields', 'error');
            return false;
        }

        // Check for duplicate account number
        const existing = this.data.find(c => 
            c.accountNo === data.accountNo && 
            (!this.currentItem || c.id !== this.currentItem.id)
        );
        
        if (existing) {
            this.showNotification('Account number already exists', 'error');
            return false;
        }

        return true;
    }

    detectChanges() {
        if (!this.originalItem && !this.currentItem) return; // New record, no changes to detect yet
        
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
            // Restore original values to form
            this.populateForm(this.originalItem);
            this.hasUnsavedChanges = false;
            this.updateUndoButtonVisibility();
            this.showAutoSaveStatus('Changes undone');
        }
    }
    
    populateForm(customer) {
        // Populate all form fields with customer data
        const fields = [
            'accountNo', 'accountName', 'companyType', 'companyRegistrationNo', 'vatRegistrationNo',
            'phone', 'email', 'website', 'parentAccount', 'accountType', 'customerStatus', 
            'approvalStatus', 'dateCreated', 'quotesRequested', 'totalQuoteValue', 'ordersPlaced',
            'salesRepresentative', 'relationshipType', 'primaryContact', 'address'
        ];
        
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = customer[field] || false;
                } else {
                    element.value = customer[field] || '';
                }
            }
        });
        
        // Update lookup fields if they exist
        Object.keys(this.lookupFields).forEach(key => {
            const lookupField = this.lookupFields[key];
            if (lookupField && customer[key]) {
                lookupField.setValue(customer[key]);
            }
        });
    }
    
    async handleBackToList() {
        if (this.hasUnsavedChanges) {
            // Auto-save before returning to list
            const success = await this.autoSave();
            if (success) {
                this.showAutoSaveStatus('Auto-saved successfully');
                setTimeout(() => this.showList(), 500); // Brief delay to show save confirmation
            } else {
                // If auto-save fails, ask user what to do
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
                // Update existing customer
                const index = this.data.findIndex(c => c.id === this.currentItem.id);
                if (index !== -1) {
                    this.data[index] = { ...this.data[index], ...formData };
                }
            } else {
                // Create new customer
                formData.id = Date.now(); // Simple ID generation
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
    
    showAutoSaveStatus(message) {
        const statusDiv = document.getElementById('auto-save-status');
        if (statusDiv) {
            statusDiv.innerHTML = `<i class="fas fa-check text-success"></i> ${message}`;
            statusDiv.style.display = 'block';
            
            // Hide after 3 seconds
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
    }

    getEmptyCustomer() {
        return {
            accountNo: '',
            accountName: '',
            companyType: '',
            companyRegistrationNo: '',
            vatRegistrationNo: '',
            phone: '',
            email: '',
            website: '',
            parentAccount: '',
            accountType: 'Prospect',
            customerStatus: 'Prospect',
            approvalStatus: 'Pending',
            dateCreated: new Date().toISOString().split('T')[0],
            quotesRequested: 0,
            totalQuoteValue: 0,
            ordersPlaced: 0,
            salesRepresentative: '',
            relationshipType: '',
            primaryContact: '',
            address: '',
            isActive: true
        };
    }
    
    renderContactsList(customerId) {
        if (!customerId) return '<div class="text-muted">Save customer first to add contacts</div>';
        
        const customerContacts = this.contacts.filter(c => c.customerId === customerId);
        
        if (customerContacts.length === 0) {
            return '<div class="text-muted">No contacts added yet</div>';
        }
        
        return customerContacts.map(contact => `
            <div class="contact-item border rounded p-3 mb-2">
                <div class="row">
                    <div class="col-md-6">
                        <strong>${contact.firstName} ${contact.lastName}</strong>
                        ${contact.isPrimary ? '<span class="badge bg-primary ms-2">Primary</span>' : ''}
                        <br>
                        <small class="text-muted">${contact.title}</small>
                    </div>
                    <div class="col-md-4">
                        <div class="small">
                            <i class="fas fa-phone"></i> ${contact.phone}<br>
                            <i class="fas fa-envelope"></i> ${contact.email}
                        </div>
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-sm btn-outline-primary edit-contact-btn" data-contact-id="${contact.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-contact-btn" data-contact-id="${contact.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
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

    showNotification(message, type) {
        // Simple notification system
        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const notification = document.createElement('div');
        notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}