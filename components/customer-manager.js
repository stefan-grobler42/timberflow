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
        this.accountTypes = ['Customer', 'Prospect', 'Supplier', 'Partner', 'Competitor'];
        this.relationshipTypes = ['Customer', 'Subsidiary', 'Parent Company', 'Joint Venture', 'Supplier', 'Partner'];
        this.employees = ['John Smith', 'Sarah Johnson', 'Mike Brown', 'Lisa Davis'];
        
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
                accountNo: 'ACC001',
                accountName: 'Millennium Construction Ltd',
                companyType: 'Private Company',
                companyRegistrationNo: '2018/123456/07',
                vatRegistrationNo: '4123456789',
                phone: '+27 11 234 5678',
                email: 'info@millennium.co.za',
                website: 'https://www.millennium.co.za',
                parentAccount: null,
                accountType: 'Customer',
                salesRepresentative: 'John Smith',
                relationshipType: 'Customer',
                primaryContact: 'Mike Johnson',
                address: '123 Construction Ave, Johannesburg, 2001',
                isActive: true
            },
            {
                id: 2,
                accountNo: 'ACC002',
                accountName: 'Cape Town Developers',
                companyType: 'Private Company',
                companyRegistrationNo: '2019/234567/07',
                vatRegistrationNo: '4234567890',
                phone: '+27 21 345 6789',
                email: 'projects@ctdevelopers.co.za',
                website: 'https://www.ctdevelopers.co.za',
                parentAccount: null,
                accountType: 'Customer',
                salesRepresentative: 'Sarah Johnson',
                relationshipType: 'Customer',
                primaryContact: 'Susan Williams',
                address: '456 Development St, Cape Town, 8001',
                isActive: true
            },
            {
                id: 3,
                accountNo: 'ACC003',
                accountName: 'Durban Home Builders',
                companyType: 'Close Corporation',
                companyRegistrationNo: 'CK2020/345678/23',
                vatRegistrationNo: '4345678901',
                phone: '+27 31 456 7890',
                email: 'admin@dhb.co.za',
                website: 'https://www.dhb.co.za',
                parentAccount: null,
                accountType: 'Customer',
                salesRepresentative: 'Mike Brown',
                relationshipType: 'Customer',
                primaryContact: 'David Thompson',
                address: '789 Builder Road, Durban, 4001',
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
                    <h3><i class="fas fa-user-tie"></i> ${isEdit ? 'Edit Customer' : 'New Customer'}</h3>
                    <button class="btn btn-outline-secondary" id="back-to-list-btn">
                        <i class="fas fa-arrow-left"></i> Back to List
                    </button>
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
                                        <input type="tel" class="form-control" id="phone" value="${customer.phone}">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="email" class="form-label">Email Address</label>
                                        <input type="email" class="form-control" id="email" value="${customer.email}">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="website" class="form-label">Website</label>
                                        <input type="url" class="form-control" id="website" value="${customer.website}">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="address" class="form-label">Address</label>
                                        <input type="text" class="form-control" id="address" 
                                               value="${customer.address}" placeholder="Start typing address...">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <div id="address-map" style="height: 150px; border-radius: 0.375rem;"></div>
                                    </div>
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
                                <div class="col-md-3 mb-3">
                                    <label for="salesRepresentative" class="form-label">Sales Representative</label>
                                    <input type="text" class="form-control lookup-field" id="salesRepresentative" 
                                           value="${customer.salesRepresentative}" data-lookup="employees" 
                                           placeholder="Type to search employees...">
                                </div>
                                <div class="col-md-3 mb-3">
                                    <label for="relationshipType" class="form-label">Relationship Type</label>
                                    <input type="text" class="form-control lookup-field" id="relationshipType" 
                                           value="${customer.relationshipType}" data-lookup="relationshipTypes" 
                                           placeholder="Type to search relationship types...">
                                </div>
                                <div class="col-md-3 mb-3">
                                    <label for="primaryContact" class="form-label">Primary Contact</label>
                                    <input type="text" class="form-control" id="primaryContact" value="${customer.primaryContact}">
                                </div>
                                <div class="col-md-3 mb-3">
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

                    <!-- Form Actions -->
                    <div class="d-flex justify-content-end gap-2">
                        <button type="button" class="btn btn-outline-secondary" id="cancel-btn">Cancel</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> ${isEdit ? 'Update Customer' : 'Save Customer'}
                        </button>
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
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveCustomer();
            });
        }

        const backBtn = document.getElementById('back-to-list-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showList());
        }

        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.showList());
        }
        
        // Initialize lookup fields
        this.initializeLookupFields();
        
        // Initialize address field
        this.initializeAddressField();
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
    
    initializeAddressField() {
        const addressInput = document.getElementById('address');
        const mapContainer = document.getElementById('address-map');
        
        if (addressInput && mapContainer) {
            this.addressField = createAddressField(addressInput, mapContainer, {
                onAddressSelect: (addressData) => {
                    console.log('Address selected:', addressData);
                    // You can update additional fields here if needed
                }
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
            salesRepresentative: document.getElementById('salesRepresentative').value,
            relationshipType: document.getElementById('relationshipType').value,
            primaryContact: document.getElementById('primaryContact').value,
            address: document.getElementById('address').value,
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
            accountType: '',
            salesRepresentative: '',
            relationshipType: '',
            primaryContact: '',
            address: '',
            isActive: true
        };
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