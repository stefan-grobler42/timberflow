// Millennium Timber Roof ERP - Single Page Application

// Global app namespace
var MillenniumApp = {
    currentModule: null,
    selectedRecords: [],
    dataTable: null,
    
    // Initialize the application
    init: function() {
        this.bindEvents();
        this.initSidebar();
    },
    
    // Bind global events
    bindEvents: function() {
        // Sidebar navigation
        $('.sidebar-link').on('click', function(e) {
            e.preventDefault();
            var module = $(this).data('module');
            MillenniumApp.loadModule(module);
            
            // Update active state
            $('.sidebar-link').removeClass('active');
            $(this).addClass('active');
        });
        
        // Module cards on welcome screen
        $('.module-card').on('click', function() {
            var module = $(this).data('module');
            MillenniumApp.loadModule(module);
            $('.sidebar-link[data-module="' + module + '"]').addClass('active');
        });
        
        // Sidebar toggle
        $('#sidebarToggle, #sidebarCollapse').on('click', function() {
            $('#sidebar').toggleClass('collapsed');
            localStorage.setItem('sidebarCollapsed', $('#sidebar').hasClass('collapsed'));
        });
        
        // Restore sidebar state
        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            $('#sidebar').addClass('collapsed');
        }
    },
    
    // Initialize sidebar
    initSidebar: function() {
        // Handle sidebar hover for collapsed state
        $('#sidebar').on('mouseenter', function() {
            if ($(this).hasClass('collapsed')) {
                $(this).removeClass('collapsed');
            }
        }).on('mouseleave', function() {
            if (localStorage.getItem('sidebarCollapsed') === 'true') {
                $(this).addClass('collapsed');
            }
        });
    },
    
    // Load module content
    loadModule: function(module) {
        this.currentModule = module;
        
        switch(module) {
            case 'customer':
                CustomerModule.loadList();
                break;
            default:
                this.showComingSoon(module);
        }
    },
    
    // Show coming soon message
    showComingSoon: function(module) {
        var html = '<div class="text-center py-5">' +
                   '<i class="fas fa-tools fa-5x text-muted mb-3"></i>' +
                   '<h3>Module Under Construction</h3>' +
                   '<p class="text-muted">The ' + module + ' module is coming soon!</p>' +
                   '</div>';
        $('#mainContent').html(html);
    },
    
    // Show notification
    showNotification: function(message, type) {
        type = type || 'info';
        var alertClass = 'alert-' + (type === 'error' ? 'danger' : type);
        
        var alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show" style="position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            <strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`;
        
        $('body').append(alertHtml);
        
        // Auto dismiss after 5 seconds
        setTimeout(function() {
            $('.alert').last().alert('close');
        }, 5000);
    },
    
    // Format currency
    formatCurrency: function(amount) {
        return 'R ' + parseFloat(amount || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
};

// Customer Module
var CustomerModule = {
    customers: [],
    selectedId: null,
    currentFilters: null,
    importedData: null,
    
    // Load customer list view
    loadList: function() {
        var template = $('#customerListTemplate').html();
        $('#mainContent').html(template);
        
        // Initialize DataTable
        this.initDataTable();
        
        // Bind events
        this.bindListEvents();
        
        // Load data
        this.loadData();
    },
    
    // Initialize DataTable
    initDataTable: function() {
        MillenniumApp.dataTable = $('#customerGrid').DataTable({
            columns: [
                { 
                    data: null,
                    orderable: false,
                    render: function(data, type, row) {
                        return '<input type="checkbox" class="form-check-input row-select" value="' + row.Id + '">';
                    }
                },
                { data: 'AccountNo' },
                { data: 'AccountName' },
                { data: 'CompanyType' },
                { data: 'Phone' },
                { data: 'Email' },
                { 
                    data: 'CustomerStatus',
                    render: function(data) {
                        var badgeClass = 'badge-status ';
                        if (data === 'Confirmed Customer') badgeClass += 'active';
                        else if (data === 'Credit Approved') badgeClass += 'approved';
                        else if (data === 'Account Closed') badgeClass += 'inactive';
                        else badgeClass += 'pending';
                        return '<span class="' + badgeClass + '">' + data + '</span>';
                    }
                },
                { data: 'SalesRepresentative' },
                { 
                    data: 'CreditLimit',
                    render: function(data) {
                        return MillenniumApp.formatCurrency(data);
                    }
                },
                { 
                    data: 'CurrentBalance',
                    render: function(data) {
                        return MillenniumApp.formatCurrency(data);
                    }
                }
            ],
            dom: 'rtip',
            pageLength: 25,
            order: [[1, 'asc']],
            language: {
                emptyTable: "No customers found",
                info: "Showing _START_ to _END_ of _TOTAL_ customers",
                infoEmpty: "No customers to show",
                infoFiltered: "(filtered from _MAX_ total)"
            }
        });
    },
    
    // Bind list events
    bindListEvents: function() {
        // Search
        $('#customerSearch').on('keyup', function() {
            MillenniumApp.dataTable.search(this.value).draw();
        });
        
        // Select all
        $('#selectAll').on('change', function() {
            $('.row-select').prop('checked', this.checked);
            CustomerModule.updateButtonState();
        });
        
        // Row selection
        $(document).on('change', '.row-select', function() {
            CustomerModule.updateButtonState();
        });
        
        // Double click to edit
        $('#customerGrid tbody').on('dblclick', 'tr', function() {
            var data = MillenniumApp.dataTable.row(this).data();
            if (data) {
                CustomerModule.editRecord(data.Id);
            }
        });
    },
    
    // Load customer data
    loadData: function() {
        $.get('/api/customer', function(data) {
            CustomerModule.customers = data;
            MillenniumApp.dataTable.clear().rows.add(data).draw();
        }).fail(function() {
            MillenniumApp.showNotification('Failed to load customers', 'error');
        });
    },
    
    // Update button state
    updateButtonState: function() {
        var selected = $('.row-select:checked');
        $('#btnEdit').prop('disabled', selected.length !== 1);
        $('#btnDelete').prop('disabled', selected.length === 0);
        
        if (selected.length === 1) {
            this.selectedId = selected.val();
        }
    },
    
    // New customer record
    newRecord: function() {
        this.selectedId = null;
        this.loadForm();
    },
    
    // Edit customer record
    editRecord: function(id) {
        if (!id) {
            var selected = $('.row-select:checked');
            if (selected.length !== 1) return;
            id = selected.val();
        }
        
        this.selectedId = id;
        this.loadForm(id);
    },
    
    // Load customer form
    loadForm: function(id) {
        var formHtml = this.getFormTemplate();
        $('#mainContent').html(formHtml);
        
        // Initialize form components
        this.initFormComponents();
        
        // Load data if editing
        if (id) {
            $.get('/api/customer/' + id, function(customer) {
                CustomerModule.populateForm(customer);
            });
        }
        
        // Bind form events
        this.bindFormEvents();
    },
    
    // Get form template
    getFormTemplate: function() {
        return `
        <div class="form-container">
            <div class="form-header d-flex justify-content-between align-items-center">
                <h3><i class="fas fa-user-tie"></i> ${this.selectedId ? 'Edit' : 'New'} Customer</h3>
            </div>
            
            <!-- Standard Command Bar -->
            <div class="millennium-action-bar" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 1px solid #dee2e6; border-radius: 6px; padding: 10px 16px; margin: 10px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-primary btn-sm" onclick="CustomerModule.saveForm()">
                            <i class="fas fa-save"></i> Save
                        </button>
                        <button class="btn btn-outline-primary btn-sm" onclick="CustomerModule.saveAndNew()">
                            <i class="fas fa-plus"></i> Save & New
                        </button>
                        <div class="action-separator" style="width: 1px; height: 20px; background: #dee2e6; margin: 0 8px;"></div>
                        <button class="btn btn-outline-secondary btn-sm" onclick="CustomerModule.cancelForm()">
                            <i class="fas fa-arrow-left"></i> Back to List
                        </button>
                        ${this.selectedId ? '<div class="action-separator" style="width: 1px; height: 20px; background: #dee2e6; margin: 0 8px;"></div><button class="btn btn-outline-warning btn-sm" onclick="CustomerModule.requestStatusChange()"><i class="fas fa-key"></i> Request Status Change</button>' : ''}
                        ${this.selectedId ? '<button class="btn btn-outline-danger btn-sm ms-2" onclick="CustomerModule.deleteForm()"><i class="fas fa-trash"></i> Delete</button>' : ''}
                    </div>
                </div>
            </div>
            
            <ul class="nav nav-tabs mt-3" role="tablist">
                <li class="nav-item">
                    <a class="nav-link active" data-bs-toggle="tab" href="#basic-info">
                        <i class="fas fa-info-circle"></i> Basic Information
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-bs-toggle="tab" href="#contact">
                        <i class="fas fa-address-book"></i> Contact
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-bs-toggle="tab" href="#address">
                        <i class="fas fa-map-marker-alt"></i> Address
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-bs-toggle="tab" href="#status-relationship">
                        <i class="fas fa-shield-alt"></i> Status & Relationship
                    </a>
                </li>
            </ul>
            
            <div class="tab-content mt-3">
                <!-- Basic Information Tab -->
                <div class="tab-pane fade show active" id="basic-info">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Account Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="AccountName" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Account Number</label>
                                <input type="text" class="form-control" id="AccountNo" readonly>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Company Type</label>
                                <div class="lookup-field">
                                    <div class="input-group">
                                        <input type="text" class="form-control lookup-input" id="CompanyType" 
                                               placeholder="Type to search..." data-lookup="companyType">
                                        <button class="btn btn-outline-secondary lookup-trigger" type="button">
                                            <i class="fas fa-search"></i>
                                        </button>
                                    </div>
                                    <div class="lookup-dropdown" id="companyTypeDropdown"></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Customer Status</label>
                                <select class="form-select" id="CustomerStatus">
                                    <option value="Prospect">Prospect</option>
                                    <option value="Confirmed Customer">Confirmed Customer</option>
                                    <option value="Credit Approved">Credit Approved</option>
                                    <option value="Account Under Review">Account Under Review</option>
                                    <option value="Account Closed">Account Closed</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Company Registration No</label>
                                <input type="text" class="form-control" id="CompanyRegistrationNo">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">VAT Registration No</label>
                                <input type="text" class="form-control" id="VatRegistrationNo">
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Sales Representative</label>
                                <div class="lookup-field">
                                    <div class="input-group">
                                        <input type="text" class="form-control lookup-input" id="SalesRepresentative" 
                                               placeholder="Type to search..." data-lookup="salesRep">
                                        <button class="btn btn-outline-secondary lookup-trigger" type="button">
                                            <i class="fas fa-search"></i>
                                        </button>
                                    </div>
                                    <div class="lookup-dropdown" id="salesRepDropdown"></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Notes</label>
                                <textarea class="form-control" id="Notes" rows="2" placeholder="Additional notes about this customer..."></textarea>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Contact Tab -->
                <div class="tab-pane fade" id="contact">
                    <!-- Primary Contact Section -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-user"></i> Primary Contact</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Contact Name</label>
                                        <input type="text" class="form-control" id="PrimaryContactName">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Position/Title</label>
                                        <input type="text" class="form-control" id="PrimaryContactTitle">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Phone</label>
                                        <input type="tel" class="form-control" id="Phone">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Mobile</label>
                                        <input type="tel" class="form-control" id="Mobile">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Email</label>
                                        <input type="email" class="form-control" id="Email">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Website</label>
                                        <input type="url" class="form-control" id="Website" placeholder="https://">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Additional Contacts Section -->
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="fas fa-address-book"></i> Additional Contacts</h5>
                            <button class="btn btn-sm btn-primary" onclick="CustomerModule.addContact()">
                                <i class="fas fa-plus"></i> Add Contact
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="contact-search mb-3">
                                <div class="input-group">
                                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                                    <input type="text" class="form-control" placeholder="Search contacts..." id="contactSearch">
                                    <button class="btn btn-outline-secondary" onclick="CustomerModule.clearContactSearch()">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="contacts-grid">
                                <table class="table table-hover" id="contactsTable">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Title</th>
                                            <th>Phone</th>
                                            <th>Email</th>
                                            <th width="100">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="contactsTableBody">
                                        <!-- Contacts will be loaded here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Status & Relationship Tab -->
                <div class="tab-pane fade" id="status-relationship">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Customer Status <i class="fas fa-lock text-warning" title="Locked field - requires approval"></i></label>
                                <select class="form-select" id="CustomerStatus" disabled>
                                    <option value="Prospect">Prospect</option>
                                    <option value="Confirmed Customer">Confirmed Customer</option>
                                    <option value="Credit Approved">Credit Approved</option>
                                    <option value="Account Under Review">Account Under Review</option>
                                    <option value="Account Closed">Account Closed</option>
                                </select>
                                <small class="text-muted">Status changes require approval from authorized personnel</small>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Account Type</label>
                                <div class="lookup-field">
                                    <div class="input-group">
                                        <input type="text" class="form-control lookup-input" id="AccountType" 
                                               placeholder="Type to search..." data-lookup="accountType">
                                        <button class="btn btn-outline-secondary lookup-trigger" type="button">
                                            <i class="fas fa-search"></i>
                                        </button>
                                    </div>
                                    <div class="lookup-dropdown" id="accountTypeDropdown"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Credit Limit (ZAR)</label>
                                <div class="input-group">
                                    <span class="input-group-text">R</span>
                                    <input type="number" class="form-control currency-input" id="CreditLimit" step="0.01">
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Payment Terms</label>
                                <select class="form-select" id="PaymentTerms">
                                    <option value="COD">Cash on Delivery</option>
                                    <option value="7 Days">7 Days</option>
                                    <option value="15 Days">15 Days</option>
                                    <option value="30 Days" selected>30 Days</option>
                                    <option value="45 Days">45 Days</option>
                                    <option value="60 Days">60 Days</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Discount %</label>
                                <input type="number" class="form-control" id="Discount" min="0" max="100" step="0.01">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3 mt-4">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="TaxExempt">
                                    <label class="form-check-label" for="TaxExempt">
                                        Tax Exempt (VAT Rate: 15%)
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Address Tab -->
                <div class="tab-pane fade" id="address">
                    <div class="mb-3">
                        <label class="form-label">Street Address</label>
                        <input type="text" class="form-control" id="StreetAddress" placeholder="Start typing an address to search...">
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">City</label>
                                <input type="text" class="form-control" id="City">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Province</label>
                                <input type="text" class="form-control" id="Province">
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Postal Code</label>
                                <input type="text" class="form-control" id="PostalCode">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Country</label>
                                <input type="text" class="form-control" id="Country" value="South Africa">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    },
    
    // Initialize form components
    initFormComponents: function() {
        // Initialize lookup fields
        this.initLookupFields();
        
        // Initialize OpenStreetMap address autocomplete
        this.initAddressAutocomplete();
    },
    
    // Initialize lookup fields
    initLookupFields: function() {
        // Load company types from API
        $.get('/api/LookupsApi/company-types', function(data) {
            var items = data.map(item => item.Name);
            CustomerModule.setupLookup('CompanyType', 'companyTypeDropdown', items);
        }).fail(function() {
            // Fallback to static data
            var companyTypes = ['Private Company', 'Close Corporation', 'Partnership', 'Sole Proprietor', 'Trust', 'Individual'];
            CustomerModule.setupLookup('CompanyType', 'companyTypeDropdown', companyTypes);
        });
        
        // Load account types from API
        $.get('/api/LookupsApi/account-types', function(data) {
            var items = data.map(item => item.Name);
            CustomerModule.setupLookup('AccountType', 'accountTypeDropdown', items);
        }).fail(function() {
            var accountTypes = ['Prospect', 'Customer', 'Partner'];
            CustomerModule.setupLookup('AccountType', 'accountTypeDropdown', accountTypes);
        });
        
        // Load sales representatives from API
        $.get('/api/UsersApi/sales-representatives', function(data) {
            var items = data.map(item => item.FullName);
            CustomerModule.setupLookup('SalesRepresentative', 'salesRepDropdown', items);
        }).fail(function() {
            // Fallback to static data  
            var salesReps = ['John Smith', 'Sarah Johnson', 'Mike Brown', 'Lisa Davis'];
            CustomerModule.setupLookup('SalesRepresentative', 'salesRepDropdown', salesReps);
        });
    },
    
    // Setup lookup field
    setupLookup: function(fieldId, dropdownId, items) {
        var $input = $('#' + fieldId);
        var $dropdown = $('#' + dropdownId);
        
        // Input event
        $input.on('input', function() {
            var value = $(this).val().toLowerCase();
            var filtered = items.filter(item => item.toLowerCase().includes(value));
            CustomerModule.showLookupDropdown($dropdown, filtered, $input);
        });
        
        // Focus event
        $input.on('focus', function() {
            if ($(this).val() === '') {
                CustomerModule.showLookupDropdown($dropdown, items, $input);
            }
        });
        
        // Trigger button - fix selector
        var $lookupField = $input.closest('.lookup-field');
        $lookupField.find('.lookup-trigger').on('click', function(e) {
            e.preventDefault();
            CustomerModule.showLookupDialog(fieldId, items);
        });
        
        // Hide dropdown on click outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.lookup-field').length) {
                $('.lookup-dropdown').removeClass('show');
            }
        });
    },
    
    // Show lookup dropdown
    showLookupDropdown: function($dropdown, items, $input) {
        $dropdown.empty();
        
        if (items.length > 0) {
            items.forEach(function(item) {
                var $item = $('<div class="lookup-item">' + item + '</div>');
                $item.on('click', function() {
                    $input.val(item);
                    $dropdown.removeClass('show');
                });
                $dropdown.append($item);
            });
            $dropdown.addClass('show');
        } else {
            $dropdown.removeClass('show');
        }
    },
    
    // Show lookup dialog
    showLookupDialog: function(fieldId, items) {
        var modalHtml = `
        <div class="modal fade" id="lookupModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Select ${fieldId.replace(/([A-Z])/g, ' $1').trim()}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <input type="text" class="form-control mb-3" id="lookupSearch" placeholder="Search...">
                        <div class="list-group" id="lookupList" style="max-height: 400px; overflow-y: auto;">
                            ${items.map(item => `<a href="#" class="list-group-item list-group-item-action" data-value="${item}">${item}</a>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        
        $('body').append(modalHtml);
        var modal = new bootstrap.Modal(document.getElementById('lookupModal'));
        
        // Search functionality
        $('#lookupSearch').on('input', function() {
            var search = $(this).val().toLowerCase();
            $('#lookupList .list-group-item').each(function() {
                $(this).toggle($(this).text().toLowerCase().includes(search));
            });
        });
        
        // Selection
        $('#lookupList .list-group-item').on('click', function(e) {
            e.preventDefault();
            $('#' + fieldId).val($(this).data('value'));
            modal.hide();
        });
        
        // Cleanup
        $('#lookupModal').on('hidden.bs.modal', function() {
            $(this).remove();
        });
        
        modal.show();
    },
    
    // Initialize OpenStreetMap/Nominatim address autocomplete
    initAddressAutocomplete: function() {
        console.log('Initializing OpenStreetMap address autocomplete...');
        
        var input = document.getElementById('StreetAddress');
        if (!input) {
            console.log('Street Address input not found - retrying in 500ms');
            setTimeout(() => CustomerModule.initAddressAutocomplete(), 500);
            return;
        }
        
        console.log('Street Address input found, setting up autocomplete');
        
        var searchTimeout = null;
        var dropdown = null;
        
        // Create dropdown for suggestions
        dropdown = document.createElement('div');
        dropdown.className = 'address-suggestions-dropdown';
        dropdown.style.cssText = 'position: absolute; width: 100%; background: white; border: 1px solid #ddd; border-radius: 4px; max-height: 300px; overflow-y: auto; z-index: 1000; display: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1);';
        input.parentNode.style.position = 'relative';
        input.parentNode.appendChild(dropdown);
        
        // Search function using Nominatim API
        function searchAddresses(query) {
            console.log('Searching for addresses with query:', query);
            if (query.length < 3) {
                dropdown.style.display = 'none';
                return;
            }
            
            console.log('Making API request to OpenStreetMap Nominatim...');
            // Use Nominatim API (OpenStreetMap) - free and no API key required
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=za&limit=5&addressdetails=1`)
                .then(response => response.json())
                .then(data => {
                    dropdown.innerHTML = '';
                    if (data.length === 0) {
                        dropdown.innerHTML = '<div style="padding: 10px; color: #999;">No addresses found</div>';
                        dropdown.style.display = 'block';
                        return;
                    }
                    
                    data.forEach(function(place) {
                        var item = document.createElement('div');
                        item.style.cssText = 'padding: 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0;';
                        item.textContent = place.display_name;
                        
                        item.onmouseover = function() {
                            this.style.backgroundColor = '#f5f5f5';
                        };
                        item.onmouseout = function() {
                            this.style.backgroundColor = 'white';
                        };
                        
                        item.onclick = function() {
                            // Fill in the address fields
                            var addr = place.address || {};
                            
                            // Set street address
                            var streetParts = [];
                            if (addr.house_number) streetParts.push(addr.house_number);
                            if (addr.road) streetParts.push(addr.road);
                            if (streetParts.length > 0) {
                                $('#StreetAddress').val(streetParts.join(' '));
                            } else {
                                $('#StreetAddress').val(place.display_name.split(',')[0]);
                            }
                            
                            // Set city
                            $('#City').val(addr.city || addr.town || addr.village || addr.municipality || '');
                            
                            // Set province/state
                            $('#Province').val(addr.state || addr.province || '');
                            
                            // Set postal code
                            $('#PostalCode').val(addr.postcode || '');
                            
                            // Set country
                            $('#Country').val(addr.country || 'South Africa');
                            
                            // Store coordinates
                            if (place.lat && place.lon) {
                                CustomerModule.currentLatitude = parseFloat(place.lat);
                                CustomerModule.currentLongitude = parseFloat(place.lon);
                            }
                            
                            dropdown.style.display = 'none';
                        };
                        
                        dropdown.appendChild(item);
                    });
                    
                    dropdown.style.display = 'block';
                })
                .catch(error => {
                    console.error('Address search error:', error);
                    dropdown.style.display = 'none';
                });
        }
        
        // Add input event listener
        input.addEventListener('input', function(e) {
            console.log('Address input changed:', e.target.value);
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function() {
                searchAddresses(e.target.value);
            }, 300); // Debounce for 300ms
        });
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
        
        // Focus event - show suggestions if there's text
        input.addEventListener('focus', function(e) {
            if (e.target.value.length >= 3) {
                searchAddresses(e.target.value);
            }
        });
    },
    
    
    // Map display removed - using address autocomplete only
    initMap_removed: function() {
        var mapElement = document.getElementById('locationMap');
        if (!mapElement) return;
        
        // Check if Google Maps is available
        if (window.googleMapsError || (typeof google === 'undefined' || !google.maps)) {
            // Show fallback message
            mapElement.innerHTML = `
                <div class="alert alert-info m-3">
                    <i class="fas fa-map-marked-alt"></i> Map view is currently unavailable.
                    <br>You can still enter addresses manually.
                </div>`;
            mapElement.style.height = '150px';
            return;
        }
        
        if (!window.googleMapsReady) {
            setTimeout(() => this.initMap(), 500);
            return;
        }
        
        // Default to Johannesburg
        var defaultLocation = { lat: -26.2041, lng: 28.0473 };
        
        try {
            // Map display removed - only using autocomplete
                center: defaultLocation,
                zoom: 12,
                mapTypeControl: false
            });
            
            // Marker removed - only using autocomplete
                position: defaultLocation,
                map: this.map,
                draggable: true
            });
        } catch (error) {
            console.log('Could not initialize map:', error);
            mapElement.innerHTML = `
                <div class="alert alert-warning m-3">
                    <i class="fas fa-exclamation-triangle"></i> Unable to load map.
                    <br>Please enter address manually.
                </div>`;
            return;
        }
        
        // Update address when marker is dragged
        this.marker.addListener('dragend', function() {
            var position = CustomerModule.marker.getPosition();
            CustomerModule.reverseGeocode(position.lat(), position.lng());
        });
        
        // Click on map to move marker
        this.map.addListener('click', function(e) {
            CustomerModule.marker.setPosition(e.latLng);
            CustomerModule.reverseGeocode(e.latLng.lat(), e.latLng.lng());
        });
    },
    
    // Removed reverse geocode
    reverseGeocode_removed: function(lat, lng) {
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat: lat, lng: lng } }, function(results, status) {
            if (status === 'OK' && results[0]) {
                var place = results[0];
                
                // Parse address components
                var streetNumber = '';
                var streetName = '';
                var city = '';
                var province = '';
                var postalCode = '';
                
                place.address_components.forEach(function(component) {
                    var types = component.types;
                    if (types.includes('street_number')) {
                        streetNumber = component.long_name;
                    } else if (types.includes('route')) {
                        streetName = component.long_name;
                    } else if (types.includes('locality')) {
                        city = component.long_name;
                    } else if (types.includes('administrative_area_level_1')) {
                        province = component.long_name;
                    } else if (types.includes('postal_code')) {
                        postalCode = component.long_name;
                    }
                });
                
                // Update form fields
                $('#StreetAddress').val(streetNumber + ' ' + streetName);
                $('#City').val(city);
                $('#Province').val(province);
                $('#PostalCode').val(postalCode);
            }
        });
    },
    
    // Removed location feature
    useCurrentLocation_removed: function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;
                
                // Check if map is available
                if (CustomerModule.map && CustomerModule.marker && window.google && google.maps) {
                    // Update map
                    var location = new google.maps.LatLng(lat, lng);
                    CustomerModule.map.setCenter(location);
                    CustomerModule.marker.setPosition(location);
                    CustomerModule.map.setZoom(16);
                    
                    // Reverse geocode to get address
                    CustomerModule.reverseGeocode(lat, lng);
                } else {
                    // Just show coordinates if map is not available
                    MillenniumApp.showNotification(`Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 'info');
                }
            }, function(error) {
                MillenniumApp.showNotification('Unable to get current location', 'warning');
            });
        } else {
            MillenniumApp.showNotification('Geolocation is not supported by this browser', 'warning');
        }
    },
    
    // Bind form events
    bindFormEvents: function() {
        // Currency formatting
        $('.currency-input').on('blur', function() {
            var value = parseFloat($(this).val() || 0);
            $(this).val(value.toFixed(2));
        });
    },
    
    // Populate form with customer data
    populateForm: function(customer) {
        Object.keys(customer).forEach(function(key) {
            var $field = $('#' + key);
            if ($field.length) {
                if ($field.attr('type') === 'checkbox') {
                    $field.prop('checked', customer[key]);
                } else {
                    $field.val(customer[key]);
                }
            }
        });
        
        // Update map if coordinates exist
        if (customer.Latitude && customer.Longitude && this.map) {
            var location = new google.maps.LatLng(customer.Latitude, customer.Longitude);
            this.map.setCenter(location);
            this.marker.setPosition(location);
            this.map.setZoom(16);
        }
    },
    
    // Save form
    saveForm: function() {
        var customer = {
            AccountName: $('#AccountName').val(),
            CompanyType: $('#CompanyType').val(),
            CompanyRegistrationNo: $('#CompanyRegistrationNo').val(),
            VatRegistrationNo: $('#VatRegistrationNo').val(),
            CustomerStatus: $('#CustomerStatus').val(),
            SalesRepresentative: $('#SalesRepresentative').val(),
            PrimaryContact: $('#PrimaryContact').val(),
            Phone: $('#Phone').val(),
            Mobile: $('#Mobile').val(),
            Email: $('#Email').val(),
            Website: $('#Website').val(),
            StreetAddress: $('#StreetAddress').val(),
            City: $('#City').val(),
            Province: $('#Province').val(),
            PostalCode: $('#PostalCode').val(),
            Country: $('#Country').val(),
            CreditLimit: parseFloat($('#CreditLimit').val() || 0),
            PaymentTerms: $('#PaymentTerms').val(),
            Discount: parseFloat($('#Discount').val() || 0),
            TaxExempt: $('#TaxExempt').is(':checked')
        };
        
        // Get map coordinates
        if (this.marker) {
            var position = this.marker.getPosition();
            customer.Latitude = position.lat();
            customer.Longitude = position.lng();
        }
        
        // Validation
        if (!customer.AccountName) {
            MillenniumApp.showNotification('Account Name is required', 'warning');
            return;
        }
        
        // Save via API
        var url = this.selectedId ? '/api/customer/' + this.selectedId : '/api/customer';
        var method = this.selectedId ? 'PUT' : 'POST';
        
        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify(customer),
            success: function() {
                MillenniumApp.showNotification('Customer saved successfully', 'success');
                CustomerModule.loadList();
            },
            error: function() {
                MillenniumApp.showNotification('Failed to save customer', 'error');
            }
        });
    },
    
    // Cancel form
    cancelForm: function() {
        this.loadList();
    },
    
    // Save and New
    saveAndNew: function() {
        var customer = this.getFormData();
        if (!customer) return false;
        
        var url = this.selectedId ? '/api/customer/' + this.selectedId : '/api/customer';
        var method = this.selectedId ? 'PUT' : 'POST';
        
        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify(customer),
            success: function() {
                MillenniumApp.showNotification('Customer saved successfully. Ready for new customer.', 'success');
                CustomerModule.selectedId = null;
                CustomerModule.loadForm();
            },
            error: function() {
                MillenniumApp.showNotification('Failed to save customer', 'error');
            }
        });
        return true;
    },
    
    // Get form data
    getFormData: function() {
        var customer = {
            AccountName: $('#AccountName').val(),
            CompanyType: $('#CompanyType').val(),
            CompanyRegistrationNo: $('#CompanyRegistrationNo').val(),
            VatRegistrationNo: $('#VatRegistrationNo').val(),
            CustomerStatus: $('#CustomerStatus').val(),
            SalesRepresentative: $('#SalesRepresentative').val(),
            PrimaryContactName: $('#PrimaryContactName').val(),
            PrimaryContactTitle: $('#PrimaryContactTitle').val(),
            Phone: $('#Phone').val(),
            Mobile: $('#Mobile').val(),
            Email: $('#Email').val(),
            Website: $('#Website').val(),
            StreetAddress: $('#StreetAddress').val(),
            City: $('#City').val(),
            Province: $('#Province').val(),
            PostalCode: $('#PostalCode').val(),
            Country: $('#Country').val(),
            AccountType: $('#AccountType').val(),
            CreditLimit: parseFloat($('#CreditLimit').val() || 0),
            PaymentTerms: $('#PaymentTerms').val(),
            Discount: parseFloat($('#Discount').val() || 0),
            TaxExempt: $('#TaxExempt').is(':checked'),
            Notes: $('#Notes').val()
        };
        
        // Get map coordinates
        if (this.marker) {
            var position = this.marker.getPosition();
            customer.Latitude = position.lat();
            customer.Longitude = position.lng();
        }
        
        // Validation
        if (!customer.AccountName) {
            MillenniumApp.showNotification('Account Name is required', 'warning');
            return null;
        }
        
        return customer;
    },
    
    // Delete form
    deleteForm: function() {
        if (this.selectedId && confirm('Are you sure you want to delete this customer?')) {
            $.ajax({
                url: '/api/customer/' + this.selectedId,
                method: 'DELETE',
                success: function() {
                    MillenniumApp.showNotification('Customer deleted successfully', 'success');
                    CustomerModule.cancelForm();
                },
                error: function() {
                    MillenniumApp.showNotification('Error deleting customer', 'error');
                }
            });
        }
    },
    
    // Request status change
    requestStatusChange: function() {
        var currentStatus = $('#CustomerStatus').val();
        MillenniumApp.showNotification('Status change request functionality will be implemented with approval workflow', 'info');
    },
    
    // Add contact
    addContact: function() {
        MillenniumApp.showNotification('Contact management functionality will be implemented with full CRUD operations', 'info');
    },
    
    // Clear contact search
    clearContactSearch: function() {
        $('#contactSearch').val('');
    },
    
    // Delete record
    deleteRecord: function() {
        var selected = $('.row-select:checked');
        if (selected.length === 0) return;
        
        if (!confirm('Are you sure you want to delete the selected customer(s)?')) return;
        
        selected.each(function() {
            var id = $(this).val();
            $.ajax({
                url: '/api/customer/' + id,
                method: 'DELETE',
                success: function() {
                    MillenniumApp.showNotification('Customer deleted successfully', 'success');
                    CustomerModule.loadData();
                }
            });
        });
    },
    
    // Refresh grid
    refreshGrid: function() {
        this.loadData();
        MillenniumApp.showNotification('Data refreshed', 'info');
    },
    
    // Show filter
    showFilter: function() {
        var modalHtml = `
        <div class="modal fade" id="filterModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="fas fa-filter"></i> Filter Customers</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Account Name</label>
                                    <input type="text" class="form-control" id="filterAccountName">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Company Type</label>
                                    <select class="form-select" id="filterCompanyType">
                                        <option value="">All</option>
                                        <option value="Private Company">Private Company</option>
                                        <option value="Close Corporation">Close Corporation</option>
                                        <option value="Partnership">Partnership</option>
                                        <option value="Sole Proprietor">Sole Proprietor</option>
                                        <option value="Trust">Trust</option>
                                        <option value="Individual">Individual</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Customer Status</label>
                                    <select class="form-select" id="filterStatus">
                                        <option value="">All</option>
                                        <option value="Prospect">Prospect</option>
                                        <option value="Confirmed Customer">Confirmed Customer</option>
                                        <option value="Credit Approved">Credit Approved</option>
                                        <option value="Account Under Review">Account Under Review</option>
                                        <option value="Account Closed">Account Closed</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Sales Representative</label>
                                    <input type="text" class="form-control" id="filterSalesRep">
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Credit Limit (Min)</label>
                                    <div class="input-group">
                                        <span class="input-group-text">R</span>
                                        <input type="number" class="form-control" id="filterCreditMin" step="0.01">
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Credit Limit (Max)</label>
                                    <div class="input-group">
                                        <span class="input-group-text">R</span>
                                        <input type="number" class="form-control" id="filterCreditMax" step="0.01">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">City</label>
                                    <input type="text" class="form-control" id="filterCity">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Province</label>
                                    <input type="text" class="form-control" id="filterProvince">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="CustomerModule.clearFilters()">Clear</button>
                        <button type="button" class="btn btn-primary" onclick="CustomerModule.applyFilters()">Apply Filters</button>
                    </div>
                </div>
            </div>
        </div>`;
        
        $('body').append(modalHtml);
        var modal = new bootstrap.Modal(document.getElementById('filterModal'));
        
        // Load current filters if any
        if (this.currentFilters) {
            $('#filterAccountName').val(this.currentFilters.accountName || '');
            $('#filterCompanyType').val(this.currentFilters.companyType || '');
            $('#filterStatus').val(this.currentFilters.status || '');
            $('#filterSalesRep').val(this.currentFilters.salesRep || '');
            $('#filterCreditMin').val(this.currentFilters.creditMin || '');
            $('#filterCreditMax').val(this.currentFilters.creditMax || '');
            $('#filterCity').val(this.currentFilters.city || '');
            $('#filterProvince').val(this.currentFilters.province || '');
        }
        
        // Cleanup
        $('#filterModal').on('hidden.bs.modal', function() {
            $(this).remove();
        });
        
        modal.show();
    },
    
    // Apply filters
    applyFilters: function() {
        this.currentFilters = {
            accountName: $('#filterAccountName').val(),
            companyType: $('#filterCompanyType').val(),
            status: $('#filterStatus').val(),
            salesRep: $('#filterSalesRep').val(),
            creditMin: $('#filterCreditMin').val(),
            creditMax: $('#filterCreditMax').val(),
            city: $('#filterCity').val(),
            province: $('#filterProvince').val()
        };
        
        // Apply filters to data
        var filteredData = this.customers.filter(customer => {
            if (this.currentFilters.accountName && !customer.AccountName.toLowerCase().includes(this.currentFilters.accountName.toLowerCase())) return false;
            if (this.currentFilters.companyType && customer.CompanyType !== this.currentFilters.companyType) return false;
            if (this.currentFilters.status && customer.CustomerStatus !== this.currentFilters.status) return false;
            if (this.currentFilters.salesRep && !customer.SalesRepresentative.toLowerCase().includes(this.currentFilters.salesRep.toLowerCase())) return false;
            if (this.currentFilters.creditMin && customer.CreditLimit < parseFloat(this.currentFilters.creditMin)) return false;
            if (this.currentFilters.creditMax && customer.CreditLimit > parseFloat(this.currentFilters.creditMax)) return false;
            if (this.currentFilters.city && !customer.City.toLowerCase().includes(this.currentFilters.city.toLowerCase())) return false;
            if (this.currentFilters.province && !customer.Province.toLowerCase().includes(this.currentFilters.province.toLowerCase())) return false;
            return true;
        });
        
        // Update table
        MillenniumApp.dataTable.clear().rows.add(filteredData).draw();
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('filterModal')).hide();
        
        // Show notification
        var filterCount = Object.values(this.currentFilters).filter(v => v).length;
        if (filterCount > 0) {
            MillenniumApp.showNotification(`Filters applied (${filterCount} active)`, 'success');
        }
    },
    
    // Clear filters
    clearFilters: function() {
        this.currentFilters = null;
        $('#filterAccountName').val('');
        $('#filterCompanyType').val('');
        $('#filterStatus').val('');
        $('#filterSalesRep').val('');
        $('#filterCreditMin').val('');
        $('#filterCreditMax').val('');
        $('#filterCity').val('');
        $('#filterProvince').val('');
        
        // Reset table to show all data
        MillenniumApp.dataTable.clear().rows.add(this.customers).draw();
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('filterModal')).hide();
        
        MillenniumApp.showNotification('Filters cleared', 'info');
    },
    
    // Column selector
    columnSelector: function() {
        var columns = MillenniumApp.dataTable.columns();
        var modalHtml = `
        <div class="modal fade" id="columnModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="fas fa-columns"></i> Column Visibility</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="list-group">`;
        
        columns.every(function(index) {
            if (index > 0) { // Skip checkbox column
                var column = this;
                var header = $(column.header()).text();
                var isVisible = column.visible();
                modalHtml += `
                    <label class="list-group-item">
                        <input class="form-check-input me-2" type="checkbox" 
                               data-column="${index}" ${isVisible ? 'checked' : ''}>
                        ${header}
                    </label>`;
            }
        });
        
        modalHtml += `
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="CustomerModule.resetColumns()">Reset to Default</button>
                        <button type="button" class="btn btn-primary" onclick="CustomerModule.applyColumnVisibility()">Apply</button>
                    </div>
                </div>
            </div>
        </div>`;
        
        $('body').append(modalHtml);
        var modal = new bootstrap.Modal(document.getElementById('columnModal'));
        
        // Cleanup
        $('#columnModal').on('hidden.bs.modal', function() {
            $(this).remove();
        });
        
        modal.show();
    },
    
    // Apply column visibility
    applyColumnVisibility: function() {
        $('#columnModal input[data-column]').each(function() {
            var column = MillenniumApp.dataTable.column($(this).data('column'));
            column.visible($(this).is(':checked'));
        });
        
        // Save preferences to localStorage
        var columnVisibility = {};
        $('#columnModal input[data-column]').each(function() {
            columnVisibility[$(this).data('column')] = $(this).is(':checked');
        });
        localStorage.setItem('customerColumnVisibility', JSON.stringify(columnVisibility));
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('columnModal')).hide();
        
        MillenniumApp.showNotification('Column visibility updated', 'success');
    },
    
    // Reset columns to default
    resetColumns: function() {
        $('#columnModal input[data-column]').prop('checked', true);
        this.applyColumnVisibility();
    },
    
    // Export to Excel
    exportExcel: function() {
        var modalHtml = `
        <div class="modal fade" id="exportModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="fas fa-file-excel"></i> Export Customers</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Export Format</label>
                            <select class="form-select" id="exportFormat">
                                <option value="csv">CSV (Comma Separated)</option>
                                <option value="excel">Excel (XLSX)</option>
                                <option value="json">JSON</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Data to Export</label>
                            <select class="form-select" id="exportScope">
                                <option value="all">All Records</option>
                                <option value="filtered">Filtered Records Only</option>
                                <option value="selected">Selected Records Only</option>
                                <option value="visible">Current Page Only</option>
                            </select>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" id="includeHeaders" checked>
                            <label class="form-check-label" for="includeHeaders">
                                Include Column Headers
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-success" onclick="CustomerModule.performExport()">Export</button>
                    </div>
                </div>
            </div>
        </div>`;
        
        $('body').append(modalHtml);
        var modal = new bootstrap.Modal(document.getElementById('exportModal'));
        
        // Check if any records are selected
        var selectedCount = $('.row-select:checked').length;
        if (selectedCount === 0) {
            $('#exportScope option[value="selected"]').prop('disabled', true).text('Selected Records Only (None selected)');
        } else {
            $('#exportScope option[value="selected"]').text(`Selected Records Only (${selectedCount} records)`);
        }
        
        // Cleanup
        $('#exportModal').on('hidden.bs.modal', function() {
            $(this).remove();
        });
        
        modal.show();
    },
    
    // Perform export
    performExport: function() {
        var format = $('#exportFormat').val();
        var scope = $('#exportScope').val();
        var includeHeaders = $('#includeHeaders').is(':checked');
        
        // Get data based on scope
        var dataToExport = [];
        switch (scope) {
            case 'all':
                dataToExport = this.customers;
                break;
            case 'filtered':
                dataToExport = MillenniumApp.dataTable.rows({search: 'applied'}).data().toArray();
                break;
            case 'selected':
                var selectedIds = $('.row-select:checked').map(function() { return $(this).val(); }).get();
                dataToExport = this.customers.filter(c => selectedIds.includes(c.Id.toString()));
                break;
            case 'visible':
                dataToExport = MillenniumApp.dataTable.rows({page: 'current'}).data().toArray();
                break;
        }
        
        if (dataToExport.length === 0) {
            MillenniumApp.showNotification('No data to export', 'warning');
            return;
        }
        
        var filename = `customers_${new Date().toISOString().split('T')[0]}`;
        
        switch (format) {
            case 'csv':
                this.exportToCSV(dataToExport, includeHeaders, filename);
                break;
            case 'excel':
                this.exportToExcelFile(dataToExport, includeHeaders, filename);
                break;
            case 'json':
                this.exportToJSON(dataToExport, filename);
                break;
        }
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('exportModal')).hide();
        
        MillenniumApp.showNotification(`Successfully exported ${dataToExport.length} records`, 'success');
    },
    
    // Export to CSV
    exportToCSV: function(data, includeHeaders, filename) {
        var csv = [];
        
        // Headers
        if (includeHeaders) {
            csv.push(['Account No', 'Account Name', 'Company Type', 'Phone', 'Email', 'Status', 'Sales Rep', 'Credit Limit', 'Balance'].join(','));
        }
        
        // Data
        data.forEach(row => {
            csv.push([
                row.AccountNo || '',
                '"' + (row.AccountName || '').replace(/"/g, '""') + '"',
                '"' + (row.CompanyType || '').replace(/"/g, '""') + '"',
                row.Phone || '',
                row.Email || '',
                row.CustomerStatus || '',
                '"' + (row.SalesRepresentative || '').replace(/"/g, '""') + '"',
                row.CreditLimit || 0,
                row.CurrentBalance || 0
            ].join(','));
        });
        
        // Download
        var blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename + '.csv';
        link.click();
    },
    
    // Export to Excel file
    exportToExcelFile: function(data, includeHeaders, filename) {
        // For now, export as CSV with .xls extension
        // In production, you would use a library like SheetJS
        this.exportToCSV(data, includeHeaders, filename);
    },
    
    // Export to JSON
    exportToJSON: function(data, filename) {
        var json = JSON.stringify(data, null, 2);
        var blob = new Blob([json], { type: 'application/json' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename + '.json';
        link.click();
    },
    
    // Import data
    importData: function() {
        var modalHtml = `
        <div class="modal fade" id="importModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="fas fa-file-import"></i> Import Customers</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Select File to Import</label>
                            <input type="file" class="form-control" id="importFile" accept=".csv,.xlsx,.xls,.json">
                            <div class="form-text">Supported formats: CSV, Excel (XLSX/XLS), JSON</div>
                        </div>
                        
                        <div class="alert alert-info">
                            <h6>File Format Requirements:</h6>
                            <ul class="mb-0">
                                <li><strong>CSV/Excel:</strong> First row should contain column headers</li>
                                <li><strong>Required columns:</strong> AccountName</li>
                                <li><strong>Optional columns:</strong> CompanyType, Phone, Email, CustomerStatus, SalesRepresentative, CreditLimit, etc.</li>
                                <li><strong>JSON:</strong> Array of customer objects with matching field names</li>
                            </ul>
                        </div>
                        
                        <div id="importPreview" style="display: none;">
                            <h6 class="mt-3">Preview (First 5 Records)</h6>
                            <div class="table-responsive">
                                <table class="table table-sm" id="previewTable">
                                    <thead></thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div class="mt-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="updateExisting">
                                <label class="form-check-label" for="updateExisting">
                                    Update existing records (match by Account Name)
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="skipDuplicates" checked>
                                <label class="form-check-label" for="skipDuplicates">
                                    Skip duplicate records
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="importBtn" onclick="CustomerModule.performImport()" disabled>
                            <i class="fas fa-upload"></i> Import
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
        
        $('body').append(modalHtml);
        var modal = new bootstrap.Modal(document.getElementById('importModal'));
        
        // File change handler
        $('#importFile').on('change', function(e) {
            var file = e.target.files[0];
            if (file) {
                CustomerModule.previewImport(file);
            }
        });
        
        // Cleanup
        $('#importModal').on('hidden.bs.modal', function() {
            $(this).remove();
        });
        
        modal.show();
    },
    
    // Preview import file
    previewImport: function(file) {
        var reader = new FileReader();
        var extension = file.name.split('.').pop().toLowerCase();
        
        reader.onload = function(e) {
            var content = e.target.result;
            var data = [];
            
            try {
                if (extension === 'json') {
                    data = JSON.parse(content);
                } else if (extension === 'csv') {
                    data = CustomerModule.parseCSV(content);
                } else {
                    MillenniumApp.showNotification('Excel import requires additional library', 'warning');
                    return;
                }
                
                // Store parsed data
                CustomerModule.importedData = data;
                
                // Show preview
                CustomerModule.showImportPreview(data.slice(0, 5));
                
                // Enable import button
                $('#importBtn').prop('disabled', false);
                
            } catch (error) {
                MillenniumApp.showNotification('Failed to parse file: ' + error.message, 'error');
            }
        };
        
        if (extension === 'json' || extension === 'csv') {
            reader.readAsText(file);
        } else {
            MillenniumApp.showNotification('Excel files require additional processing', 'info');
        }
    },
    
    // Parse CSV content
    parseCSV: function(content) {
        var lines = content.split('\n');
        var headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        var data = [];
        
        for (var i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                var values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                var row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }
        
        return data;
    },
    
    // Show import preview
    showImportPreview: function(data) {
        if (data.length === 0) return;
        
        var headers = Object.keys(data[0]);
        var thead = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
        var tbody = data.map(row => 
            '<tr>' + headers.map(h => `<td>${row[h] || ''}</td>`).join('') + '</tr>'
        ).join('');
        
        $('#previewTable thead').html(thead);
        $('#previewTable tbody').html(tbody);
        $('#importPreview').show();
    },
    
    // Perform import
    performImport: function() {
        if (!this.importedData || this.importedData.length === 0) {
            MillenniumApp.showNotification('No data to import', 'warning');
            return;
        }
        
        var updateExisting = $('#updateExisting').is(':checked');
        var skipDuplicates = $('#skipDuplicates').is(':checked');
        
        var imported = 0;
        var skipped = 0;
        var updated = 0;
        
        this.importedData.forEach(row => {
            // Map fields
            var customer = {
                AccountName: row.AccountName || row.Name || row.Customer || '',
                CompanyType: row.CompanyType || row.Type || '',
                Phone: row.Phone || row.Tel || '',
                Email: row.Email || '',
                CustomerStatus: row.CustomerStatus || row.Status || 'Prospect',
                SalesRepresentative: row.SalesRepresentative || row.SalesRep || '',
                CreditLimit: parseFloat(row.CreditLimit || 0),
                CurrentBalance: parseFloat(row.CurrentBalance || row.Balance || 0)
            };
            
            // Check for duplicates
            var existing = this.customers.find(c => 
                c.AccountName.toLowerCase() === customer.AccountName.toLowerCase()
            );
            
            if (existing) {
                if (updateExisting) {
                    // Update existing record
                    Object.assign(existing, customer);
                    updated++;
                } else if (skipDuplicates) {
                    skipped++;
                } else {
                    // Add as new with modified name
                    customer.AccountName += ' (Imported)';
                    customer.Id = Math.max(...this.customers.map(c => c.Id || 0)) + 1;
                    this.customers.push(customer);
                    imported++;
                }
            } else {
                // Add new record
                customer.Id = Math.max(...this.customers.map(c => c.Id || 0)) + 1;
                customer.AccountNo = 'ACC' + String(customer.Id).padStart(4, '0');
                this.customers.push(customer);
                imported++;
            }
        });
        
        // Refresh table
        MillenniumApp.dataTable.clear().rows.add(this.customers).draw();
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('importModal')).hide();
        
        // Show results
        var message = `Import complete: ${imported} added`;
        if (updated > 0) message += `, ${updated} updated`;
        if (skipped > 0) message += `, ${skipped} skipped`;
        
        MillenniumApp.showNotification(message, 'success');
    }
};

// Initialize app when document ready
$(document).ready(function() {
    MillenniumApp.init();
});