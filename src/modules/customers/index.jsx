// Customers Module - Main Component (List View)
// Copied and adapted from components/customer-manager.js
import { DataGrid } from '../../platform/components/DataGrid.jsx';
import { db } from '../../platform/services/db.js';
import { defaults } from '../../platform/services/defaults.js';

class CustomersIndex {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.data = [];
        this.currentView = 'list';
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
        
        if (!this.container) {
            console.error('CustomersIndex: Container not found:', containerId);
            return;
        }
        
        this.init();
    }

    init() {
        console.log('CustomersIndex: Initializing...');
        this.loadData();
        this.render();
        console.log('CustomersIndex: Ready');
    }

    async loadData() {
        try {
            // Try to load from platform database service
            this.data = await db.getCustomers();
            if (!this.data || this.data.length === 0) {
                // Fallback to sample data
                this.loadSampleData();
            }
        } catch (error) {
            console.warn('Failed to load customers from database, using sample data:', error);
            this.loadSampleData();
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
    }

    render() {
        this.renderListView();
    }

    renderListView() {
        // Initialize enhanced data grid if not already done
        if (!this.dataGrid) {
            this.container.innerHTML = `
                <div class="customer-manager-container">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2><i class="fas fa-user-tie"></i> Customer Management</h2>
                        <div>
                            <button class="btn btn-primary" id="new-customer-btn">
                                <i class="fas fa-plus"></i> New Customer
                            </button>
                        </div>
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
                    }
                ],
                onRowClick: (customer) => {
                    this.viewCustomer(customer);
                },
                onRowDoubleClick: (customer) => {
                    this.editCustomer(customer);
                },
                showSearch: true,
                showExport: true,
                showColumnToggle: true
            };

            this.dataGrid = new DataGrid('customer-grid-container', gridConfig);
            this.dataGrid.setData(this.getFilteredData());

            // Event listeners
            const newButton = document.getElementById('new-customer-btn');
            if (newButton) {
                newButton.addEventListener('click', () => this.newCustomer());
            }
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

        return filtered;
    }

    viewCustomer(customer) {
        // Navigate to customer details
        window.location.hash = `/customers/${customer.id}`;
    }

    editCustomer(customer) {
        // Navigate to customer edit
        window.location.hash = `/customers/${customer.id}/edit`;
    }

    newCustomer() {
        // Navigate to new customer form
        window.location.hash = '/customers/new';
    }
}

// Make globally accessible for compatibility
window.CustomersIndex = CustomersIndex;

export default CustomersIndex;