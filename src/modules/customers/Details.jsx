// Customers Module - Customer Details Component (Form View)
// Copied and adapted from components/customer-manager.js
import { LocationField } from '../../platform/components/LocationField.jsx';
import { Lookup } from '../../platform/components/Lookup.jsx';
import { db } from '../../platform/services/db.js';

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
        
        if (!this.container) {
            console.error('CustomerDetails: Container not found:', containerId);
            return;
        }
        
        this.init();
    }

    async init() {
        console.log('CustomerDetails: Initializing...');
        await this.loadCustomer();
        this.render();
        console.log('CustomerDetails: Ready');
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
                        <button class="btn btn-success" id="save-customer-btn">
                            <i class="fas fa-save"></i> Save
                        </button>
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

                            <!-- Contact Details -->
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h5><i class="fas fa-phone"></i> Contact Details</h5>
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

                        <!-- Status & Relationship -->
                        <div class="col-lg-6">
                            <div class="card mb-4">
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
                                            <label for="customerStatus" class="form-label">Customer Status</label>
                                            <input type="text" class="form-control" id="customerStatus" value="${customer.customerStatus}">
                                        </div>
                                    </div>
                                    
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="approvalStatus" class="form-label">Approval Status</label>
                                            <input type="text" class="form-control" id="approvalStatus" value="${customer.approvalStatus}">
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

                            <!-- Address -->
                            <div class="card mb-4">
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
    }

    setupEventListeners() {
        // Back to list
        const backBtn = document.getElementById('back-to-list-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.hash = '/customers';
            });
        }

        // Save button
        const saveBtn = document.getElementById('save-customer-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveCustomer();
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
}

// Make globally accessible for compatibility
window.CustomerDetails = CustomerDetails;

export default CustomerDetails;