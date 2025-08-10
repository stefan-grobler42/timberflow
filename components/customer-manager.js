// Customer Management System - Based on Account Excel Specification
class CustomerManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.data = [];
        this.currentView = 'list';
        this.currentItem = null;
        this.searchTerm = '';
        
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
        
        // Auto-save functionality
        this.autoSaveEnabled = true;
        this.changesPending = false;
        this.lastSavedState = null;
        this.autoSaveDelay = 1000; // 1 second delay
        
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
        try {
            console.log('CustomerManager: Rendering view:', this.currentView);
            
            if (this.currentView === 'list') {
                this.renderListView();
            } else if (this.currentView === 'form') {
                this.renderFormView();
            }
        } catch (error) {
            console.error('CustomerManager render error:', error);
            this.container.innerHTML = `
                <div class="alert alert-danger">
                    <h5>Customer Management Error</h5>
                    <p>There was an error loading the customer management interface.</p>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Refresh Page</button>
                </div>
            `;
        }
    }

    renderListView() {
        this.container.innerHTML = `
            <div class="customer-manager-container">
                <!-- Header -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2><i class="fas fa-user-tie"></i> Customer Management</h2>
                    <button class="btn btn-primary" id="new-customer-btn">
                        <i class="fas fa-plus"></i> New Customer
                    </button>
                </div>

                <!-- Search and Filters -->
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <div class="input-group">
                                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                                    <input type="text" class="form-control" id="customer-search" 
                                           placeholder="Search customers..." value="${this.searchTerm}">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select" id="account-type-filter">
                                    <option value="">All Account Types</option>
                                    ${this.accountTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                                </select>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select" id="company-type-filter">
                                    <option value="">All Company Types</option>
                                    ${this.companyTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="status-filter">
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Customer List -->
                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Account No.</th>
                                        <th>Account Name</th>
                                        <th>Company Type</th>
                                        <th>Phone</th>
                                        <th>Sales Rep</th>
                                        <th>Account Type</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.getFilteredData().map(customer => `
                                        <tr class="clickable-row" data-id="${customer.id}" style="cursor: pointer;">
                                            <td><strong>${customer.accountNo}</strong></td>
                                            <td>${customer.accountName}</td>
                                            <td><span class="badge bg-info">${customer.companyType}</span></td>
                                            <td>${customer.phone}</td>
                                            <td>${customer.salesRepresentative}</td>
                                            <td><span class="badge bg-primary">${customer.accountType}</span></td>
                                            <td>
                                                <span class="badge ${customer.isActive ? 'bg-success' : 'bg-danger'}">
                                                    ${customer.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${customer.id}">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${customer.id}">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <div class="text-muted">
                                Showing ${this.getFilteredData().length} customers
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachListEventListeners();
    }

    renderFormView() {
        const customer = this.currentItem || this.getEmptyCustomer();
        const isEdit = this.currentItem !== null;

        this.container.innerHTML = `
            <div class="customer-form-container">
                <!-- Header -->
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
                        <h3><i class="fas fa-user me-2 text-primary"></i>${isEdit ? 'Edit Customer' : 'New Customer'}</h3>
                    </div>
                    <div class="auto-save-status">
                        <small class="text-muted" id="auto-save-status">
                            <i class="fas fa-circle text-success"></i> Auto-save enabled
                        </small>
                    </div>
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

                    <!-- Auto-save Status -->
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="auto-save-status">
                            <small class="text-muted" id="auto-save-status">
                                <i class="fas fa-circle text-success"></i> Auto-save enabled
                            </small>
                        </div>
                        <div class="form-actions d-flex gap-2">
                            <button type="button" class="btn btn-outline-warning" id="undo-btn" disabled>
                                <i class="fas fa-undo"></i> Undo Changes
                            </button>
                            <button type="button" class="btn btn-outline-secondary" id="back-btn">
                                <i class="fas fa-arrow-left"></i> Back to List
                            </button>
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
        const form = document.getElementById('customer-form');
        if (form) {
            // Remove form submission - auto-save handles saving
            form.addEventListener('submit', (e) => {
                e.preventDefault();
            });
            
            // Add change detection for auto-save
            form.addEventListener('input', () => this.handleFormChange());
            form.addEventListener('change', () => this.handleFormChange());
        }

        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.saveCurrentChanges().then(() => {
                    this.showList();
                });
            });
        }

        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undoChanges());
        }
        
        // Initialize lookup fields
        this.initializeLookupFields();
        
        // Initialize location picker
        this.initializeLocationPicker();
        
        // Make contact fields clickable
        this.initializeClickableFields();
        
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
        this.currentView = 'form';
        this.render();
    }

    editCustomer(id) {
        this.currentItem = this.data.find(customer => customer.id === id);
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

    saveCustomer() {
        const formData = this.getFormData();
        
        if (!this.validateForm(formData)) {
            return;
        }

        if (this.currentItem) {
            // Update existing
            const index = this.data.findIndex(c => c.id === this.currentItem.id);
            this.data[index] = { ...formData, id: this.currentItem.id };
            this.showNotification('Customer updated successfully', 'success');
        } else {
            // Create new
            const newId = Math.max(...this.data.map(c => c.id), 0) + 1;
            this.data.push({ ...formData, id: newId });
            this.showNotification('Customer created successfully', 'success');
        }

        this.showList();
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
        if (!this.validateForm()) {
            throw new Error('Validation failed');
        }
        
        const formData = this.getFormData();
        
        if (this.currentItem) {
            // Update existing item
            const index = this.data.findIndex(item => item.id === this.currentItem.id);
            if (index !== -1) {
                this.data[index] = { ...this.data[index], ...formData };
            }
        } else {
            // Create new item
            const newId = Math.max(...this.data.map(item => item.id), 0) + 1;
            formData.id = newId;
            this.data.push(formData);
            this.currentItem = formData;
        }
        
        return Promise.resolve();
    }
    
    storeCurrentState() {
        const form = document.getElementById('customer-form');
        if (form) {
            const formData = new FormData(form);
            this.lastSavedState = Object.fromEntries(formData.entries());
            
            // Also store non-form field values
            this.lastSavedState.address = document.getElementById('address')?.value || '';
            this.lastSavedState.locationData = document.getElementById('location-data')?.value || '';
        }
    }
    
    undoChanges() {
        if (!this.lastSavedState) return;
        
        // Restore form values
        Object.keys(this.lastSavedState).forEach(key => {
            const field = document.getElementById(key);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = this.lastSavedState[key] === 'on';
                } else {
                    field.value = this.lastSavedState[key] || '';
                }
            }
        });
        
        // Restore location field
        if (this.enhancedLocationField && this.lastSavedState.locationData) {
            try {
                const locationData = JSON.parse(this.lastSavedState.locationData);
                this.enhancedLocationField.loadSavedLocation(locationData);
            } catch (e) {
                console.warn('Could not restore location data:', e);
            }
        }
        
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

    showList() {
        this.currentView = 'list';
        this.currentItem = null;
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