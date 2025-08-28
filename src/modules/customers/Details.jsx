// Customers Module - Customer Details Component (Form View)
// Copied and adapted from components/customer-manager.js
import { LocationField } from '../../platform/components/LocationField.jsx';
import { Lookup } from '../../platform/components/Lookup.jsx';
import { db } from '../../platform/services/db.js';
import { useCommands } from '../../platform/components/CommandRegistry.js';

class CustomerDetails {
    constructor(containerId, customerId = null) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.customerId = customerId;
        this.currentItem = null;
        this.originalItem = null;
        this.hasUnsavedChanges = false;
        
        // Reference data for lookups
        this.companyTypes = ['Sole Proprietor', 'Private Company', 'Public Company', 'Close Corporation', 'Partnership', 'Trust', 'Individual'];
        this.accountTypes = ['Prospect', 'Customer', 'Supplier', 'Partner', 'Competitor'];
        this.customerStatuses = ['Prospect', 'Confirmed Customer', 'Account Under Review', 'Credit Approved', 'Account Closed'];
        this.approvalStatuses = ['Pending', 'Credit App Required', 'References Check', 'Payment History Review', 'Approved', 'Rejected'];
        this.relationshipTypes = ['Customer', 'Subsidiary', 'Parent Company', 'Joint Venture', 'Supplier', 'Partner'];
        this.employees = ['John Smith', 'Sarah Johnson', 'Mike Brown', 'Lisa Davis'];
        
        // Lookup field instances
        this.lookupFields = {};
        this.enhancedLocationField = null;
        
        // Command registry for action bar
        this.commands = useCommands('customer-details');
        this.activeTab = 'basic';
        
        if (!this.container) {
            console.error('CustomerDetails: Container not found:', containerId);
            return;
        }
        
        this.init();
    }

    async init() {
        console.log('CustomerDetails: Initializing...');
        await this.loadCustomer();
        this.setupCommands();
        this.render();
        console.log('CustomerDetails: Ready');
    }

    setupCommands() {
        const isEdit = this.currentItem !== null && this.customerId !== 'new';
        
        const actions = [
            {
                id: 'save',
                label: 'Save',
                icon: 'fas fa-save',
                variant: 'success',
                group: 'file',
                action: () => this.saveCustomer()
            },
            {
                id: 'save-and-new',
                label: 'Save & New',
                icon: 'fas fa-plus-square',
                variant: 'primary',
                group: 'file',
                action: () => this.saveAndNew()
            },
            {
                id: 'cancel',
                label: 'Cancel',
                icon: 'fas fa-times',
                variant: 'outline-secondary',
                group: 'file',
                action: () => this.cancelChanges()
            }
        ];

        if (isEdit) {
            actions.push({
                id: 'delete',
                label: 'Delete',
                icon: 'fas fa-trash',
                variant: 'outline-danger',
                group: 'edit',
                action: () => this.deleteCustomer()
            });
        }

        this.commands.set(actions);
    }

    async loadCustomer() {
        if (this.customerId && this.customerId !== 'new') {
            try {
                this.currentItem = await db.getCustomer(this.customerId);
                this.originalItem = { ...this.currentItem };
            } catch (error) {
                console.warn('Failed to load customer, using sample data:', error);
                // Fallback to sample data
                this.currentItem = this.getSampleCustomer(parseInt(this.customerId));
                this.originalItem = { ...this.currentItem };
            }
        }
    }

    getSampleCustomer(id) {
        const sampleCustomers = [
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
            }
        ];
        
        return sampleCustomers.find(c => c.id === id) || this.getEmptyCustomer();
    }

    getEmptyCustomer() {
        return {
            id: null,
            accountNo: '',
            accountName: '',
            companyType: '',
            companyRegistrationNo: '',
            vatRegistrationNo: '',
            phone: '',
            email: '',
            website: '',
            parentAccount: null,
            accountType: '',
            customerStatus: '',
            approvalStatus: '',
            salesRepresentative: '',
            relationshipType: '',
            primaryContact: '',
            address: '',
            dateCreated: new Date().toISOString().split('T')[0],
            quotesRequested: 0,
            totalQuoteValue: 0,
            ordersPlaced: 0,
            isActive: true
        };
    }

    render() {
        this.renderFormView();
    }

    renderFormView() {
        const customer = this.currentItem || this.getEmptyCustomer();
        const isEdit = this.currentItem !== null && this.customerId !== 'new';

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
                    <div class="d-flex align-items-center gap-2">
                        <h3><i class="fas fa-user-tie"></i> ${isEdit ? 'Edit Customer' : 'New Customer'}</h3>
                    </div>
                </div>

                <!-- Tabs Navigation -->
                <ul class="nav nav-tabs mb-4" id="customer-tabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link ${this.activeTab === 'basic' ? 'active' : ''}" id="basic-tab" 
                                data-bs-toggle="tab" data-bs-target="#basic-pane" type="button" role="tab" 
                                aria-controls="basic-pane" aria-selected="${this.activeTab === 'basic'}">
                            <i class="fas fa-id-card"></i> Basic Information
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link ${this.activeTab === 'contact' ? 'active' : ''}" id="contact-tab" 
                                data-bs-toggle="tab" data-bs-target="#contact-pane" type="button" role="tab" 
                                aria-controls="contact-pane" aria-selected="${this.activeTab === 'contact'}">
                            <i class="fas fa-address-book"></i> Contact
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link ${this.activeTab === 'status' ? 'active' : ''}" id="status-tab" 
                                data-bs-toggle="tab" data-bs-target="#status-pane" type="button" role="tab" 
                                aria-controls="status-pane" aria-selected="${this.activeTab === 'status'}">
                            <i class="fas fa-chart-line"></i> Status & Relationship
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link ${this.activeTab === 'address' ? 'active' : ''}" id="address-tab" 
                                data-bs-toggle="tab" data-bs-target="#address-pane" type="button" role="tab" 
                                aria-controls="address-pane" aria-selected="${this.activeTab === 'address'}">
                            <i class="fas fa-map-marker-alt"></i> Address
                        </button>
                    </li>
                </ul>

                <!-- Tab Content -->
                <form id="customer-form">
                    <div class="tab-content" id="customer-tab-content">
                        <!-- Basic Information Tab -->
                        <div class="tab-pane fade ${this.activeTab === 'basic' ? 'show active' : ''}" id="basic-pane" 
                             role="tabpanel" aria-labelledby="basic-tab">
                            <div class="card">
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
                                            <input type="text" class="form-control" id="companyType" value="${customer.companyType}" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="companyRegistrationNo" class="form-label">Registration No.</label>
                                            <input type="text" class="form-control" id="companyRegistrationNo" value="${customer.companyRegistrationNo}">
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="vatRegistrationNo" class="form-label">VAT Registration No.</label>
                                        <input type="text" class="form-control" id="vatRegistrationNo" value="${customer.vatRegistrationNo}">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Contact Tab -->
                        <div class="tab-pane fade ${this.activeTab === 'contact' ? 'show active' : ''}" id="contact-pane" 
                             role="tabpanel" aria-labelledby="contact-tab">
                            <div class="row">
                                <div class="col-lg-6">
                                    <!-- Company Contact Details -->
                                    <div class="card mb-4">
                                        <div class="card-header">
                                            <h5><i class="fas fa-building"></i> Company Contact Details</h5>
                                        </div>
                                        <div class="card-body">
                                            <div class="mb-3">
                                                <label for="phone" class="form-label">Phone</label>
                                                <input type="tel" class="form-control" id="phone" value="${customer.phone}">
                                            </div>
                                            <div class="mb-3">
                                                <label for="email" class="form-label">Email</label>
                                                <input type="email" class="form-control" id="email" value="${customer.email}">
                                            </div>
                                            <div class="mb-3">
                                                <label for="website" class="form-label">Website</label>
                                                <input type="url" class="form-control" id="website" value="${customer.website}">
                                            </div>
                                            <div class="mb-3">
                                                <label for="primaryContact" class="form-label">Primary Contact</label>
                                                <input type="text" class="form-control" id="primaryContact" value="${customer.primaryContact}">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <!-- Contacts Grid -->
                                    <div class="card">
                                        <div class="card-header d-flex justify-content-between align-items-center">
                                            <h5><i class="fas fa-users"></i> Contacts</h5>
                                            <div class="btn-group btn-group-sm" role="group">
                                                <button type="button" class="btn btn-outline-primary" id="add-contact-btn">
                                                    <i class="fas fa-plus"></i> Add
                                                </button>
                                                <button type="button" class="btn btn-outline-secondary" id="edit-contact-btn" disabled>
                                                    <i class="fas fa-edit"></i> Edit
                                                </button>
                                                <button type="button" class="btn btn-outline-danger" id="delete-contact-btn" disabled>
                                                    <i class="fas fa-trash"></i> Delete
                                                </button>
                                            </div>
                                        </div>
                                        <div class="card-body p-0">
                                            <!-- Search and Filter -->
                                            <div class="p-3 border-bottom">
                                                <div class="row g-2">
                                                    <div class="col-md-6">
                                                        <input type="text" class="form-control form-control-sm" 
                                                               id="contact-search" placeholder="Search contacts...">
                                                    </div>
                                                    <div class="col-md-6">
                                                        <select class="form-select form-select-sm" id="contact-filter">
                                                            <option value="">All Contacts</option>
                                                            <option value="primary">Primary Only</option>
                                                            <option value="active">Active Only</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <!-- Contacts Table -->
                                            <div class="table-responsive">
                                                <table class="table table-sm table-hover mb-0" id="contacts-table">
                                                    <thead class="table-light">
                                                        <tr>
                                                            <th style="width: 30px;">
                                                                <input type="checkbox" class="form-check-input" id="select-all-contacts">
                                                            </th>
                                                            <th>Name</th>
                                                            <th>Title</th>
                                                            <th>Email</th>
                                                            <th>Phone</th>
                                                            <th style="width: 80px;">Primary</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody id="contacts-tbody">
                                                        <tr>
                                                            <td colspan="6" class="text-center text-muted py-4">
                                                                <i class="fas fa-user-plus fa-2x mb-2"></i><br>
                                                                No contacts added yet. Click "Add" to create the first contact.
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Status & Relationship Tab -->
                        <div class="tab-pane fade ${this.activeTab === 'status' ? 'show active' : ''}" id="status-pane" 
                             role="tabpanel" aria-labelledby="status-tab">
                            <div class="card">
                                <div class="card-header">
                                    <h5><i class="fas fa-chart-line"></i> Status & Relationship</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="accountType" class="form-label">Account Type *</label>
                                            <input type="text" class="form-control" id="accountType" value="${customer.accountType}" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="customerStatus" class="form-label">Customer Status
                                                <i class="fas fa-lock text-warning ms-1" title="Locked field - requires permissions"></i>
                                            </label>
                                            <div class="input-group">
                                                <input type="text" class="form-control" id="customerStatus" value="${customer.customerStatus}" readonly>
                                                <button class="btn btn-outline-primary" type="button" id="submit-for-approval-btn" 
                                                        ${customer.customerStatus !== 'Prospect' ? 'disabled' : ''}>
                                                    <i class="fas fa-paper-plane"></i> Submit for Approval
                                                </button>
                                            </div>
                                            <div class="form-text">Status can only be changed through approval process</div>
                                        </div>
                                    </div>
                                    
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="approvalStatus" class="form-label">Approval Status</label>
                                            <input type="text" class="form-control" id="approvalStatus" value="${customer.approvalStatus}" readonly>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="salesRepresentative" class="form-label">Sales Representative</label>
                                            <input type="text" class="form-control" id="salesRepresentative" value="${customer.salesRepresentative}">
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="relationshipType" class="form-label">Relationship Type</label>
                                        <input type="text" class="form-control" id="relationshipType" value="${customer.relationshipType}">
                                    </div>
                                    
                                    <div class="form-check mb-3">
                                        <input class="form-check-input" type="checkbox" id="isActive" ${customer.isActive ? 'checked' : ''}>
                                        <label class="form-check-label" for="isActive">
                                            Account Active
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Address Tab -->
                        <div class="tab-pane fade ${this.activeTab === 'address' ? 'show active' : ''}" id="address-pane" 
                             role="tabpanel" aria-labelledby="address-tab">
                            <div class="card">
                                <div class="card-header">
                                    <h5><i class="fas fa-map-marker-alt"></i> Address</h5>
                                </div>
                                <div class="card-body">
                                    <div class="mb-3">
                                        <label for="address" class="form-label">Address</label>
                                        <textarea class="form-control" id="address" rows="3">${customer.address}</textarea>
                                    </div>
                                    <div id="enhanced-location-container"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        `;

        this.setupEventListeners();
        this.initializeLookupFields();
        this.initializeLocationField();
        this.setupTabHandlers();
        this.initializeContactsGrid();
    }

    setupEventListeners() {
        // Back to list
        const backBtn = document.getElementById('back-to-list-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.hash = '/customers';
            });
        }

        // Submit for approval button
        const submitApprovalBtn = document.getElementById('submit-for-approval-btn');
        if (submitApprovalBtn) {
            submitApprovalBtn.addEventListener('click', () => {
                this.submitForApproval();
            });
        }

        // Contact grid buttons
        const addContactBtn = document.getElementById('add-contact-btn');
        if (addContactBtn) {
            addContactBtn.addEventListener('click', () => {
                this.addContact();
            });
        }

        const editContactBtn = document.getElementById('edit-contact-btn');
        if (editContactBtn) {
            editContactBtn.addEventListener('click', () => {
                this.editContact();
            });
        }

        const deleteContactBtn = document.getElementById('delete-contact-btn');
        if (deleteContactBtn) {
            deleteContactBtn.addEventListener('click', () => {
                this.deleteContact();
            });
        }

        // Contact search and filter
        const contactSearch = document.getElementById('contact-search');
        if (contactSearch) {
            contactSearch.addEventListener('input', () => {
                this.filterContacts();
            });
        }

        const contactFilter = document.getElementById('contact-filter');
        if (contactFilter) {
            contactFilter.addEventListener('change', () => {
                this.filterContacts();
            });
        }

        // Form change detection
        const form = document.getElementById('customer-form');
        if (form) {
            form.addEventListener('input', () => {
                this.hasUnsavedChanges = true;
                this.updateUndoButtonVisibility();
            });
        }
    }

    initializeLookupFields() {
        // Initialize lookup fields for dropdowns
        // Note: This would use the Lookup platform component
        // For now, we'll keep the basic inputs as implemented above
    }

    initializeLocationField() {
        // Initialize enhanced location field
        if (window.EnhancedLocationField) {
            this.enhancedLocationField = new LocationField('enhanced-location-container', {
                onLocationSelect: (location) => {
                    if (location.address) {
                        document.getElementById('address').value = location.address;
                    }
                }
            });
        }
    }

    updateUndoButtonVisibility() {
        const undoBtn = document.getElementById('undo-changes-btn');
        if (undoBtn) {
            undoBtn.style.display = this.hasUnsavedChanges ? 'inline-block' : 'none';
        }
    }

    getFormData() {
        return {
            accountNo: document.getElementById('accountNo')?.value || '',
            accountName: document.getElementById('accountName')?.value || '',
            companyType: document.getElementById('companyType')?.value || '',
            companyRegistrationNo: document.getElementById('companyRegistrationNo')?.value || '',
            vatRegistrationNo: document.getElementById('vatRegistrationNo')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            email: document.getElementById('email')?.value || '',
            website: document.getElementById('website')?.value || '',
            primaryContact: document.getElementById('primaryContact')?.value || '',
            accountType: document.getElementById('accountType')?.value || '',
            customerStatus: document.getElementById('customerStatus')?.value || '',
            approvalStatus: document.getElementById('approvalStatus')?.value || '',
            salesRepresentative: document.getElementById('salesRepresentative')?.value || '',
            relationshipType: document.getElementById('relationshipType')?.value || '',
            address: document.getElementById('address')?.value || '',
            isActive: document.getElementById('isActive')?.checked || false
        };
    }

    async saveCustomer() {
        try {
            const formData = this.getFormData();
            
            if (!this.validateForm(formData)) {
                return;
            }

            if (this.currentItem && this.customerId !== 'new') {
                // Update existing customer
                const updatedCustomer = await db.updateCustomer(this.customerId, formData);
                this.showNotification('Customer updated successfully', 'success');
            } else {
                // Create new customer
                const newCustomer = await db.createCustomer(formData);
                this.showNotification('Customer created successfully', 'success');
                // Redirect to the new customer's details
                window.location.hash = `/customers/${newCustomer.id}`;
            }
            
            this.hasUnsavedChanges = false;
            this.updateUndoButtonVisibility();
            
        } catch (error) {
            console.error('Failed to save customer:', error);
            this.showNotification('Failed to save customer: ' + error.message, 'error');
        }
    }

    validateForm(data) {
        if (!data.accountNo || !data.accountName || !data.companyType || !data.accountType) {
            this.showNotification('Please fill in all required fields', 'error');
            return false;
        }
        return true;
    }

    setupTabHandlers() {
        // Handle tab switching
        const tabButtons = document.querySelectorAll('#customer-tabs button[data-bs-toggle="tab"]');
        tabButtons.forEach(button => {
            button.addEventListener('shown.bs.tab', (event) => {
                const tabId = event.target.getAttribute('aria-controls');
                this.activeTab = tabId.replace('-pane', '');
            });
        });
    }

    initializeContactsGrid() {
        this.contacts = [];
        this.selectedContacts = [];
        this.loadContacts();
    }

    loadContacts() {
        // Mock data for now - will be replaced with API call
        this.contacts = [
            {
                id: 1,
                firstName: 'Mike',
                lastName: 'Johnson',
                title: 'Project Manager',
                email: 'mike.johnson@millennium.co.za',
                phone: '+27 11 234 5679',
                isPrimary: true,
                isActive: true
            },
            {
                id: 2,
                firstName: 'Sarah',
                lastName: 'Smith',
                title: 'Operations Director',
                email: 'sarah.smith@millennium.co.za',
                phone: '+27 11 234 5680',
                isPrimary: false,
                isActive: true
            }
        ];
        this.renderContactsGrid();
    }

    renderContactsGrid() {
        const tbody = document.getElementById('contacts-tbody');
        if (!tbody) return;

        if (this.contacts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-user-plus fa-2x mb-2"></i><br>
                        No contacts added yet. Click "Add" to create the first contact.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.contacts.map(contact => `
            <tr class="contact-row" data-contact-id="${contact.id}">
                <td>
                    <input type="checkbox" class="form-check-input contact-checkbox" 
                           value="${contact.id}">
                </td>
                <td>${contact.firstName} ${contact.lastName}</td>
                <td>${contact.title || ''}</td>
                <td>${contact.email || ''}</td>
                <td>${contact.phone || ''}</td>
                <td>
                    ${contact.isPrimary ? '<span class="badge bg-primary">Primary</span>' : ''}
                </td>
            </tr>
        `).join('');

        // Add click handler for row selection
        tbody.querySelectorAll('.contact-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox') {
                    const checkbox = row.querySelector('.contact-checkbox');
                    checkbox.checked = !checkbox.checked;
                    this.toggleContactSelection(parseInt(checkbox.value));
                }
            });
        });
    }

    toggleContactSelection(contactId) {
        const index = this.selectedContacts.indexOf(contactId);
        if (index > -1) {
            this.selectedContacts.splice(index, 1);
        } else {
            this.selectedContacts.push(contactId);
        }
        this.updateContactButtons();
    }

    updateContactButtons() {
        const editBtn = document.getElementById('edit-contact-btn');
        const deleteBtn = document.getElementById('delete-contact-btn');
        
        if (editBtn) editBtn.disabled = this.selectedContacts.length !== 1;
        if (deleteBtn) deleteBtn.disabled = this.selectedContacts.length === 0;
    }

    filterContacts() {
        const searchTerm = document.getElementById('contact-search')?.value.toLowerCase() || '';
        const filterValue = document.getElementById('contact-filter')?.value || '';
        
        const rows = document.querySelectorAll('.contact-row');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const contactId = parseInt(row.getAttribute('data-contact-id'));
            const contact = this.contacts.find(c => c.id === contactId);
            
            let visible = text.includes(searchTerm);
            
            if (visible && filterValue) {
                switch (filterValue) {
                    case 'primary':
                        visible = contact?.isPrimary;
                        break;
                    case 'active':
                        visible = contact?.isActive;
                        break;
                }
            }
            
            row.style.display = visible ? '' : 'none';
        });
    }

    addContact() {
        // TODO: Implement contact modal/form
        this.showNotification('Contact management coming soon', 'info');
    }

    editContact() {
        if (this.selectedContacts.length !== 1) return;
        // TODO: Implement contact editing
        this.showNotification('Contact editing coming soon', 'info');
    }

    deleteContact() {
        if (this.selectedContacts.length === 0) return;
        if (confirm(`Delete ${this.selectedContacts.length} contact(s)?`)) {
            // TODO: Implement contact deletion
            this.showNotification('Contact deletion coming soon', 'info');
        }
    }

    submitForApproval() {
        if (confirm('Submit this customer for approval? This will change the status to "Pending Approval".')) {
            // TODO: Implement approval workflow
            this.showNotification('Approval workflow coming soon', 'info');
        }
    }

    saveAndNew() {
        this.saveCustomer().then(() => {
            window.location.hash = '/customers/new';
        });
    }

    cancelChanges() {
        if (this.hasUnsavedChanges) {
            if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                window.location.hash = '/customers';
            }
        } else {
            window.location.hash = '/customers';
        }
    }

    deleteCustomer() {
        if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            // TODO: Implement customer deletion
            this.showNotification('Customer deletion coming soon', 'info');
        }
    }

    showNotification(message, type = 'info') {
        // Simple notification implementation
        const alertClass = type === 'error' ? 'alert-danger' : type === 'success' ? 'alert-success' : 'alert-info';
        const notification = document.createElement('div');
        notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // Cleanup method
    destroy() {
        if (this.commands) {
            this.commands.clear();
        }
        
        if (this.enhancedLocationField) {
            this.enhancedLocationField.destroy?.();
        }
        
        // Clean up lookup fields
        Object.values(this.lookupFields).forEach(field => {
            if (field.destroy) {
                field.destroy();
            }
        });
    }
}

// Make globally accessible for compatibility
window.CustomerDetails = CustomerDetails;

export default CustomerDetails;