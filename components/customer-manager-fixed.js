// Customer Management System - Fixed Version
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
        try {
            console.log('CustomerManager: Initializing...');
            this.loadSampleData();
            this.render();
            console.log('CustomerManager: Ready');
        } catch (error) {
            console.error('CustomerManager init error:', error);
            this.container.innerHTML = `
                <div class="alert alert-danger">
                    <h5>Customer Manager Error</h5>
                    <p>Failed to initialize customer management.</p>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Refresh Page</button>
                </div>
            `;
        }
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
                website: 'www.millennium.co.za',
                address: '123 Main Street, Johannesburg, 2000',
                salesRepresentative: 'John Smith',
                accountType: 'Customer',
                customerStatus: 'Confirmed Customer',
                approvalStatus: 'Approved',
                creditLimit: 500000,
                paymentTerms: 30,
                relationshipType: 'Customer',
                parentAccount: '',
                notes: 'Key client for roofing projects',
                isActive: true,
                createdDate: '2024-01-15',
                lastModified: '2024-08-10'
            },
            {
                id: 2,
                accountNo: 'DEV002',
                accountName: 'Cape Town Developers',
                companyType: 'Private Company',
                companyRegistrationNo: '2019/987654/07',
                vatRegistrationNo: '4987654321',
                phone: '+27 21 345 6789',
                email: 'contact@ctdevelopers.co.za',
                website: 'www.ctdevelopers.co.za',
                address: '456 Waterfront Drive, Cape Town, 8001',
                salesRepresentative: 'Sarah Johnson',
                accountType: 'Customer',
                customerStatus: 'Confirmed Customer',
                approvalStatus: 'Approved',
                creditLimit: 1000000,
                paymentTerms: 45,
                relationshipType: 'Customer',
                parentAccount: '',
                notes: 'Large scale residential developments',
                isActive: true,
                createdDate: '2024-02-20',
                lastModified: '2024-08-09'
            },
            {
                id: 3,
                accountNo: 'CONT003',
                accountName: 'DHB Contractors',
                companyType: 'Close Corporation',
                companyRegistrationNo: '2020/555666/23',
                vatRegistrationNo: '4555666777',
                phone: '+27 31 456 7890',
                email: 'admin@dhb.co.za',
                website: 'www.dhbcontractors.co.za',
                address: '789 Industrial Road, Durban, 4001',
                salesRepresentative: 'Mike Brown',
                accountType: 'Customer',
                customerStatus: 'Confirmed Customer',
                approvalStatus: 'Approved',
                creditLimit: 750000,
                paymentTerms: 30,
                relationshipType: 'Customer',
                parentAccount: '',
                notes: 'Commercial and industrial roofing specialist',
                isActive: true,
                createdDate: '2024-03-10',
                lastModified: '2024-08-08'
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
        try {
            console.log('CustomerManager: Rendering list view...');
            this.container.innerHTML = `
                <div class="customer-manager-container">
                    <!-- Header -->
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div class="d-flex align-items-center">
                            <h2><i class="fas fa-user-tie me-2"></i>Customer Management</h2>
                            <div class="btn-group ms-3" role="group">
                                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="millenniumERP.showCustomerViewChoice()">
                                    <i class="fas fa-exchange-alt me-1"></i>Switch View
                                </button>
                            </div>
                        </div>
                        <button class="btn btn-primary" id="new-customer-btn">
                            <i class="fas fa-plus me-1"></i>New Customer
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
        } catch (error) {
            console.error('CustomerManager renderListView error:', error);
            this.container.innerHTML = `
                <div class="alert alert-danger">
                    <h5>Customer List Error</h5>
                    <p>Failed to render customer list view.</p>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Refresh Page</button>
                </div>
            `;
        }
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
                                            <input type="text" class="form-control" id="accountNo" name="accountNo" value="${customer.accountNo}" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="accountName" class="form-label">Account Name *</label>
                                            <input type="text" class="form-control" id="accountName" name="accountName" value="${customer.accountName}" required>
                                        </div>
                                    </div>
                                    
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="companyType" class="form-label">Company Type *</label>
                                            <select class="form-select" id="companyType" name="companyType" required>
                                                <option value="">Select Company Type</option>
                                                ${this.companyTypes.map(type => 
                                                    `<option value="${type}" ${customer.companyType === type ? 'selected' : ''}>${type}</option>`
                                                ).join('')}
                                            </select>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="accountType" class="form-label">Account Type *</label>
                                            <select class="form-select" id="accountType" name="accountType" required>
                                                <option value="">Select Account Type</option>
                                                ${this.accountTypes.map(type => 
                                                    `<option value="${type}" ${customer.accountType === type ? 'selected' : ''}>${type}</option>`
                                                ).join('')}
                                            </select>
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="phone" class="form-label">Phone *</label>
                                            <input type="tel" class="form-control" id="phone" name="phone" value="${customer.phone}" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="email" class="form-label">Email *</label>
                                            <input type="email" class="form-control" id="email" name="email" value="${customer.email}" required>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Additional Details -->
                        <div class="col-lg-6">
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h5><i class="fas fa-cogs"></i> Additional Details</h5>
                                </div>
                                <div class="card-body">
                                    <div class="mb-3">
                                        <label for="website" class="form-label">Website</label>
                                        <input type="url" class="form-control" id="website" name="website" value="${customer.website}">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="address" class="form-label">Address</label>
                                        <textarea class="form-control" id="address" name="address" rows="3">${customer.address}</textarea>
                                    </div>

                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="salesRepresentative" class="form-label">Sales Representative</label>
                                            <select class="form-select" id="salesRepresentative" name="salesRepresentative">
                                                <option value="">Select Sales Rep</option>
                                                ${this.employees.map(emp => 
                                                    `<option value="${emp}" ${customer.salesRepresentative === emp ? 'selected' : ''}>${emp}</option>`
                                                ).join('')}
                                            </select>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="customerStatus" class="form-label">Customer Status</label>
                                            <select class="form-select" id="customerStatus" name="customerStatus">
                                                <option value="">Select Status</option>
                                                ${this.customerStatuses.map(status => 
                                                    `<option value="${status}" ${customer.customerStatus === status ? 'selected' : ''}>${status}</option>`
                                                ).join('')}
                                            </select>
                                        </div>
                                    </div>

                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="isActive" name="isActive" ${customer.isActive ? 'checked' : ''}>
                                        <label class="form-check-label" for="isActive">
                                            Active Customer
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        `;

        this.attachFormEventListeners();
    }

    attachListEventListeners() {
        const searchInput = document.getElementById('customer-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.renderListView();
            });
        }

        const newCustomerBtn = document.getElementById('new-customer-btn');
        if (newCustomerBtn) {
            newCustomerBtn.addEventListener('click', () => this.newCustomer());
        }

        // Row click events
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
            form.addEventListener('submit', (e) => {
                e.preventDefault();
            });
            
            form.addEventListener('input', () => this.handleFormChange());
            form.addEventListener('change', () => this.handleFormChange());
        }

        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.saveCurrentChanges().then(() => {
                    this.showList();
                }).catch(error => {
                    console.error('Error saving changes:', error);
                    this.showList();
                });
            });
        }

        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undoChanges());
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
        if (confirm('Are you sure you want to delete this customer?')) {
            this.data = this.data.filter(customer => customer.id !== id);
            this.renderListView();
            
            // Record audit trail
            if (window.universalAuditSystem) {
                window.universalAuditSystem.recordEvent({
                    module: 'customer',
                    recordType: 'customer',
                    recordId: id,
                    action: 'DELETE',
                    changes: { deletedAt: new Date().toISOString() },
                    metadata: {
                        component: 'CustomerManager'
                    }
                });
            }
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
            address: '',
            salesRepresentative: '',
            accountType: '',
            customerStatus: '',
            approvalStatus: '',
            creditLimit: 0,
            paymentTerms: 30,
            relationshipType: '',
            parentAccount: '',
            notes: '',
            isActive: true
        };
    }

    getFormData() {
        try {
            const form = document.getElementById('customer-form');
            if (!form) return {};
            
            const data = {};
            const formElements = form.querySelectorAll('input, select, textarea');
            
            formElements.forEach(element => {
                if (element.name || element.id) {
                    const key = element.name || element.id;
                    if (element.type === 'checkbox') {
                        data[key] = element.checked;
                    } else {
                        data[key] = element.value || '';
                    }
                }
            });
            
            return data;
        } catch (error) {
            console.error('Error getting form data:', error);
            return {};
        }
    }

    async saveCurrentChanges() {
        try {
            const formData = this.getFormData();
            
            if (this.currentItem) {
                // Update existing item
                const index = this.data.findIndex(item => item.id === this.currentItem.id);
                if (index !== -1) {
                    this.data[index] = { ...this.data[index], ...formData };
                }
                
                // Record audit trail for updates
                if (window.universalAuditSystem) {
                    window.universalAuditSystem.recordEvent({
                        module: 'customer',
                        recordType: 'customer',
                        recordId: this.currentItem.id,
                        action: 'UPDATE',
                        changes: formData,
                        metadata: {
                            component: 'CustomerManager'
                        }
                    });
                }
            } else {
                // Create new item
                const newId = Math.max(...this.data.map(item => item.id), 0) + 1;
                formData.id = newId;
                this.data.push(formData);
                this.currentItem = formData;
                
                // Record audit trail for creates
                if (window.universalAuditSystem) {
                    window.universalAuditSystem.recordEvent({
                        module: 'customer',
                        recordType: 'customer',
                        recordId: newId,
                        action: 'CREATE',
                        changes: formData,
                        metadata: {
                            component: 'CustomerManager'
                        }
                    });
                }
            }
            
            this.changesPending = false;
            console.log('Customer saved successfully');
        } catch (error) {
            console.error('Error saving customer:', error);
            throw error;
        }
    }

    handleFormChange() {
        this.changesPending = true;
        
        // Enable undo button
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.disabled = false;
        }
        
        // Auto-save after delay
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            if (this.changesPending) {
                this.saveCurrentChanges().catch(error => {
                    console.error('Auto-save failed:', error);
                });
            }
        }, this.autoSaveDelay);
    }

    undoChanges() {
        if (this.currentItem) {
            // Reload the form with original data
            this.renderFormView();
        }
        this.changesPending = false;
    }

    showList() {
        this.currentView = 'list';
        this.currentItem = null;
        this.render();
    }
}