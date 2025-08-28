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
        var alertClass = type === 'success' ? 'alert-success' : 
                        type === 'error' ? 'alert-danger' : 
                        type === 'warning' ? 'alert-warning' : 'alert-info';
        
        var notification = $('<div class="alert ' + alertClass + ' alert-dismissible fade show position-fixed" style="top: 70px; right: 20px; z-index: 9999;">' +
                           message +
                           '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' +
                           '</div>');
        
        $('body').append(notification);
        
        setTimeout(function() {
            notification.fadeOut(function() {
                $(this).remove();
            });
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
                <div>
                    <button class="btn btn-secondary btn-sm" onclick="CustomerModule.cancelForm()">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button class="btn btn-primary btn-sm ms-2" onclick="CustomerModule.saveForm()">
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
            </div>
            
            <ul class="nav nav-tabs mt-3" role="tablist">
                <li class="nav-item">
                    <a class="nav-link active" data-bs-toggle="tab" href="#general">
                        <i class="fas fa-info-circle"></i> General
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-bs-toggle="tab" href="#contact">
                        <i class="fas fa-phone"></i> Contact
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-bs-toggle="tab" href="#address">
                        <i class="fas fa-map-marker-alt"></i> Address
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-bs-toggle="tab" href="#financial">
                        <i class="fas fa-dollar-sign"></i> Financial
                    </a>
                </li>
            </ul>
            
            <div class="tab-content mt-3">
                <!-- General Tab -->
                <div class="tab-pane fade show active" id="general">
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
                                        <span class="input-group-text lookup-trigger">
                                            <i class="fas fa-hourglass-half"></i>
                                        </span>
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
                                        <span class="input-group-text lookup-trigger">
                                            <i class="fas fa-hourglass-half"></i>
                                        </span>
                                    </div>
                                    <div class="lookup-dropdown" id="salesRepDropdown"></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Primary Contact</label>
                                <input type="text" class="form-control" id="PrimaryContact">
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Contact Tab -->
                <div class="tab-pane fade" id="contact">
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
                
                <!-- Address Tab -->
                <div class="tab-pane fade" id="address">
                    <div class="mb-3">
                        <label class="form-label">Street Address</label>
                        <div class="input-group">
                            <input type="text" class="form-control" id="StreetAddress" placeholder="Start typing address...">
                            <button class="btn btn-outline-secondary" type="button" onclick="CustomerModule.useCurrentLocation()">
                                <i class="fas fa-map-marker-alt"></i> Use My Location
                            </button>
                        </div>
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
                    
                    <div class="mb-3">
                        <label class="form-label">Location Map</label>
                        <div id="locationMap" class="map-container"></div>
                    </div>
                </div>
                
                <!-- Financial Tab -->
                <div class="tab-pane fade" id="financial">
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
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Current Balance (ZAR)</label>
                                <div class="input-group">
                                    <span class="input-group-text">R</span>
                                    <input type="number" class="form-control currency-input" id="CurrentBalance" step="0.01" readonly>
                                </div>
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
        
        // Initialize Google Maps
        this.initAddressAutocomplete();
        this.initMap();
    },
    
    // Initialize lookup fields
    initLookupFields: function() {
        var companyTypes = ['Private Company', 'Close Corporation', 'Partnership', 'Sole Proprietor', 'Trust', 'Individual'];
        var salesReps = ['John Smith', 'Sarah Johnson', 'Mike Brown', 'Lisa Davis'];
        
        // Company Type lookup
        this.setupLookup('CompanyType', 'companyTypeDropdown', companyTypes);
        
        // Sales Rep lookup
        this.setupLookup('SalesRepresentative', 'salesRepDropdown', salesReps);
    },
    
    // Setup lookup field
    setupLookup: function(fieldId, dropdownId, items) {
        var $input = $('#' + fieldId);
        var $dropdown = $('#' + dropdownId);
        var $trigger = $input.siblings('.input-group').find('.lookup-trigger');
        
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
        
        // Trigger button
        $trigger.on('click', function() {
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
    
    // Initialize address autocomplete
    initAddressAutocomplete: function() {
        if (!window.googleMapsReady) {
            setTimeout(() => this.initAddressAutocomplete(), 500);
            return;
        }
        
        var input = document.getElementById('StreetAddress');
        if (!input) return;
        
        var autocomplete = new google.maps.places.Autocomplete(input, {
            componentRestrictions: { country: 'za' },
            fields: ['address_components', 'geometry', 'formatted_address']
        });
        
        autocomplete.addListener('place_changed', function() {
            var place = autocomplete.getPlace();
            if (!place.geometry) return;
            
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
            
            // Update map
            if (CustomerModule.map && CustomerModule.marker) {
                var location = place.geometry.location;
                CustomerModule.map.setCenter(location);
                CustomerModule.marker.setPosition(location);
                CustomerModule.map.setZoom(16);
            }
        });
    },
    
    // Initialize map
    initMap: function() {
        if (!window.googleMapsReady) {
            setTimeout(() => this.initMap(), 500);
            return;
        }
        
        var mapElement = document.getElementById('locationMap');
        if (!mapElement) return;
        
        // Default to Johannesburg
        var defaultLocation = { lat: -26.2041, lng: 28.0473 };
        
        this.map = new google.maps.Map(mapElement, {
            center: defaultLocation,
            zoom: 12,
            mapTypeControl: false
        });
        
        this.marker = new google.maps.Marker({
            position: defaultLocation,
            map: this.map,
            draggable: true
        });
        
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
    
    // Reverse geocode
    reverseGeocode: function(lat, lng) {
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
    
    // Use current location
    useCurrentLocation: function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;
                
                // Update map
                var location = new google.maps.LatLng(lat, lng);
                CustomerModule.map.setCenter(location);
                CustomerModule.marker.setPosition(location);
                CustomerModule.map.setZoom(16);
                
                // Reverse geocode to get address
                CustomerModule.reverseGeocode(lat, lng);
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
        MillenniumApp.showNotification('Filter functionality coming soon', 'info');
    },
    
    // Column selector
    columnSelector: function() {
        MillenniumApp.showNotification('Column selector coming soon', 'info');
    },
    
    // Export to Excel
    exportExcel: function() {
        MillenniumApp.showNotification('Export functionality coming soon', 'info');
    },
    
    // Import data
    importData: function() {
        MillenniumApp.showNotification('Import functionality coming soon', 'info');
    }
};

// Initialize app when document ready
$(document).ready(function() {
    MillenniumApp.init();
});