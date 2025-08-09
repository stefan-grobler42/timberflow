// Keyboard-driven lookup field component
class LookupField {
    constructor(inputElement, options = {}) {
        this.input = inputElement;
        this.options = {
            data: options.data || [],
            placeholder: options.placeholder || 'Type to search...',
            maxResults: options.maxResults || 10,
            onSelect: options.onSelect || (() => {}),
            searchFields: options.searchFields || ['name', 'value'],
            displayField: options.displayField || 'name',
            valueField: options.valueField || 'value'
        };
        
        this.isOpen = false;
        this.selectedIndex = -1;
        this.filteredData = [];
        this.dropdown = null;
        
        this.init();
    }
    
    init() {
        this.input.setAttribute('autocomplete', 'off');
        this.input.setAttribute('role', 'combobox');
        this.input.setAttribute('aria-expanded', 'false');
        this.input.setAttribute('aria-autocomplete', 'list');
        
        this.wrapInputWithSearchIcon();
        this.attachEventListeners();
        this.createDropdown();
    }
    
    wrapInputWithSearchIcon() {
        // Wrap input in input-group with search icon
        const parent = this.input.parentNode;
        const wrapper = document.createElement('div');
        wrapper.className = 'input-group';
        
        parent.insertBefore(wrapper, this.input);
        wrapper.appendChild(this.input);
        
        // Add search icon button
        const searchBtn = document.createElement('button');
        searchBtn.className = 'btn btn-outline-secondary';
        searchBtn.type = 'button';
        searchBtn.innerHTML = '<i class="fas fa-search"></i>';
        searchBtn.title = 'Browse all options';
        
        wrapper.appendChild(searchBtn);
        
        // Add click handler for search button
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openSearchModal();
        });
        
        this.searchButton = searchBtn;
    }
    
    attachEventListeners() {
        // Input events
        this.input.addEventListener('input', (e) => this.handleInput(e));
        this.input.addEventListener('focus', (e) => this.handleFocus(e));
        this.input.addEventListener('blur', (e) => this.handleBlur(e));
        this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Document click to close dropdown
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.dropdown.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }
    
    createDropdown() {
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'lookup-dropdown';
        this.dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #dee2e6;
            border-top: none;
            border-radius: 0 0 0.375rem 0.375rem;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        `;
        
        // Position dropdown relative to input group
        const container = this.input.closest('.input-group') || this.input.parentNode;
        container.style.position = 'relative';
        container.appendChild(this.dropdown);
    }
    
    handleInput(e) {
        const value = e.target.value;
        this.filterData(value);
        
        if (value.length > 0) {
            this.openDropdown();
        } else {
            this.closeDropdown();
        }
    }
    
    handleFocus(e) {
        if (this.input.value.length > 0) {
            this.filterData(this.input.value);
            this.openDropdown();
        } else {
            // Show initial suggestions
            this.filteredData = this.options.data.slice(0, this.options.maxResults);
            this.renderDropdown();
            this.openDropdown();
        }
    }
    
    handleBlur(e) {
        // Delay to allow click on dropdown items
        setTimeout(() => {
            this.closeDropdown();
        }, 150);
    }
    
    handleKeydown(e) {
        if (!this.isOpen) {
            if (e.key === 'ArrowDown' && this.input.value.length === 0) {
                e.preventDefault();
                this.filteredData = this.options.data.slice(0, this.options.maxResults);
                this.renderDropdown();
                this.openDropdown();
                return;
            }
            return;
        }
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredData.length - 1);
                this.updateSelection();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection();
                break;
                
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.selectItem(this.filteredData[this.selectedIndex]);
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                this.closeDropdown();
                break;
                
            case 'Tab':
                this.closeDropdown();
                break;
        }
    }
    
    filterData(searchTerm) {
        const term = searchTerm.toLowerCase();
        
        this.filteredData = this.options.data.filter(item => {
            return this.options.searchFields.some(field => {
                const value = item[field];
                return value && value.toString().toLowerCase().includes(term);
            });
        }).slice(0, this.options.maxResults);
        
        this.selectedIndex = -1;
        this.renderDropdown();
    }
    
    renderDropdown() {
        if (this.filteredData.length === 0) {
            this.dropdown.innerHTML = '<div class="lookup-item no-results">No results found</div>';
            return;
        }
        
        this.dropdown.innerHTML = this.filteredData.map((item, index) => {
            const displayValue = item[this.options.displayField];
            const isSelected = index === this.selectedIndex;
            
            return `
                <div class="lookup-item ${isSelected ? 'selected' : ''}" 
                     data-index="${index}"
                     style="padding: 8px 12px; cursor: pointer; ${isSelected ? 'background-color: #0d6efd; color: white;' : ''}"
                     onmouseover="this.style.backgroundColor = '#f8f9fa'; this.style.color = '#000';"
                     onmouseout="this.style.backgroundColor = '${isSelected ? '#0d6efd' : 'transparent'}'; this.style.color = '${isSelected ? 'white' : '#000'}';"
                     onclick="this.closest('.lookup-dropdown').lookupField.selectItemByIndex(${index})">
                    ${displayValue}
                </div>
            `;
        }).join('');
        
        // Store reference for onclick handler
        this.dropdown.lookupField = this;
    }
    
    updateSelection() {
        const items = this.dropdown.querySelectorAll('.lookup-item');
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
                item.style.backgroundColor = '#0d6efd';
                item.style.color = 'white';
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
                item.style.backgroundColor = 'transparent';
                item.style.color = '#000';
            }
        });
    }
    
    selectItemByIndex(index) {
        this.selectItem(this.filteredData[index]);
    }
    
    selectItem(item) {
        if (!item) return;
        
        const displayValue = item[this.options.displayField];
        const value = item[this.options.valueField];
        
        this.input.value = displayValue;
        this.input.setAttribute('data-value', value);
        
        this.closeDropdown();
        this.options.onSelect(item, value);
        
        // Trigger change event
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    openSearchModal() {
        // Create modal for browsing all options
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.style.zIndex = '1055';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Select ${this.options.placeholder.replace('Type to search', '').replace('...', '')}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <input type="text" class="form-control" id="modal-search" placeholder="Search options...">
                        </div>
                        <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                            <table class="table table-hover">
                                <thead class="table-light sticky-top">
                                    <tr>
                                        <th>Option</th>
                                        <th width="80">Select</th>
                                    </tr>
                                </thead>
                                <tbody id="modal-options-body">
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Initialize modal
        const bsModal = new bootstrap.Modal(modal);
        const modalSearch = modal.querySelector('#modal-search');
        const modalBody = modal.querySelector('#modal-options-body');
        
        // Render initial options
        this.renderModalOptions(modalBody, this.options.data);
        
        // Search functionality
        modalSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = this.options.data.filter(item => {
                return this.options.searchFields.some(field => {
                    const value = item[field];
                    return value && value.toString().toLowerCase().includes(term);
                });
            });
            this.renderModalOptions(modalBody, filtered);
        });
        
        // Show modal
        bsModal.show();
        
        // Clean up when modal is hidden
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
        
        // Focus search input when modal is shown
        modal.addEventListener('shown.bs.modal', () => {
            modalSearch.focus();
        });
    }
    
    renderModalOptions(tbody, data) {
        tbody.innerHTML = data.map(item => {
            const displayValue = item[this.options.displayField];
            return `
                <tr style="cursor: pointer;" onclick="this.selectOption()">
                    <td>${displayValue}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); this.parentNode.parentNode.selectOption();">
                            <i class="fas fa-check"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Add selection handlers
        tbody.querySelectorAll('tr').forEach((row, index) => {
            row.selectOption = () => {
                this.selectItem(data[index]);
                const modal = row.closest('.modal');
                bootstrap.Modal.getInstance(modal).hide();
            };
        });
    }
    
    openDropdown() {
        this.isOpen = true;
        this.dropdown.style.display = 'block';
        this.input.setAttribute('aria-expanded', 'true');
    }
    
    closeDropdown() {
        this.isOpen = false;
        this.dropdown.style.display = 'none';
        this.selectedIndex = -1;
        this.input.setAttribute('aria-expanded', 'false');
    }
    
    setValue(value) {
        const item = this.options.data.find(item => item[this.options.valueField] === value);
        if (item) {
            this.input.value = item[this.options.displayField];
            this.input.setAttribute('data-value', value);
        }
    }
    
    getValue() {
        return this.input.getAttribute('data-value') || '';
    }
    
    updateData(newData) {
        this.options.data = newData;
        if (this.isOpen) {
            this.filterData(this.input.value);
        }
    }
}

// Google Maps Address Autocomplete Component
class AddressField {
    constructor(inputElement, options = {}) {
        this.input = inputElement;
        this.options = {
            onAddressSelect: options.onAddressSelect || (() => {}),
            showMap: options.showMap !== false,
            mapContainer: options.mapContainer || null
        };
        
        this.autocomplete = null;
        this.map = null;
        this.marker = null;
        
        this.init();
    }
    
    init() {
        this.loadGoogleMapsAPI().then(() => {
            this.initAutocomplete();
            if (this.options.showMap && this.options.mapContainer) {
                this.initMap();
            }
        });
    }
    
    loadGoogleMapsAPI() {
        return new Promise((resolve) => {
            if (window.google && window.google.maps && window.google.maps.places) {
                // Real Google Maps API is already loaded
                resolve();
                return;
            }
            
            // Only use mock if real API is not available
            console.warn('Google Maps API not available, using mock implementation');
            window.google = {
                maps: {
                    places: {
                        Autocomplete: class {
                            constructor(input) {
                                this.input = input;
                                this.listeners = {};
                                this.setupMockAutocomplete();
                            }
                            
                            setupMockAutocomplete() {
                                // Mock address suggestions with coordinates
                                const addresses = [
                                    { 
                                        description: '117 Wilkins Bunting Street, Mooikloof, Pretoria, 0081', 
                                        place_id: '1',
                                        lat: -25.8707788, 
                                        lng: 28.3665748 
                                    },
                                    { 
                                        description: '234 Oak Avenue, Centurion, 0157', 
                                        place_id: '2',
                                        lat: -25.8619, 
                                        lng: 28.1880 
                                    },
                                    { 
                                        description: '456 Pine Street, Sandton, 2196', 
                                        place_id: '3',
                                        lat: -26.1076, 
                                        lng: 28.0567 
                                    },
                                    { 
                                        description: '789 Main Road, Cape Town, 8001', 
                                        place_id: '4',
                                        lat: -33.9249, 
                                        lng: 18.4241 
                                    }
                                ];
                                
                                const dropdown = document.createElement('div');
                                dropdown.className = 'address-dropdown';
                                dropdown.style.cssText = `
                                    position: absolute;
                                    top: 100%;
                                    left: 0;
                                    right: 0;
                                    background: white;
                                    border: 1px solid #dee2e6;
                                    border-radius: 0.375rem;
                                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
                                    max-height: 200px;
                                    overflow-y: auto;
                                    z-index: 1000;
                                    display: none;
                                `;
                                
                                this.input.parentNode.style.position = 'relative';
                                this.input.parentNode.appendChild(dropdown);
                                
                                this.input.addEventListener('input', (e) => {
                                    const value = e.target.value.toLowerCase();
                                    if (value.length < 3) {
                                        dropdown.style.display = 'none';
                                        return;
                                    }
                                    
                                    const filtered = addresses.filter(addr => 
                                        addr.description.toLowerCase().includes(value)
                                    );
                                    
                                    if (filtered.length > 0) {
                                        dropdown.innerHTML = filtered.map(addr => `
                                            <div class="address-item" 
                                                 style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;"
                                                 onmouseover="this.style.backgroundColor = '#f8f9fa'"
                                                 onmouseout="this.style.backgroundColor = 'white'"
                                                 onclick="this.selectAddress('${addr.description}')">
                                                ${addr.description}
                                            </div>
                                        `).join('');
                                        
                                        dropdown.style.display = 'block';
                                        
                                        // Add click handlers
                                        dropdown.querySelectorAll('.address-item').forEach((item, index) => {
                                            item.selectAddress = (address) => {
                                                this.input.value = address;
                                                dropdown.style.display = 'none';
                                                this.triggerPlaceChanged(address);
                                            };
                                        });
                                    } else {
                                        dropdown.style.display = 'none';
                                    }
                                });
                                
                                document.addEventListener('click', (e) => {
                                    if (!this.input.contains(e.target) && !dropdown.contains(e.target)) {
                                        dropdown.style.display = 'none';
                                    }
                                });
                            }
                            
                            addListener(event, callback) {
                                this.listeners[event] = callback;
                            }
                            
                            triggerPlaceChanged(address) {
                                if (this.listeners.place_changed) {
                                    this.listeners.place_changed();
                                }
                            }
                            
                            getPlace() {
                                const address = this.input.value;
                                
                                // Find matching address with coordinates
                                const mockAddresses = [
                                    { 
                                        description: '117 Wilkins Bunting Street, Mooikloof, Pretoria, 0081', 
                                        lat: -25.8707788, 
                                        lng: 28.3665748 
                                    },
                                    { 
                                        description: '234 Oak Avenue, Centurion, 0157', 
                                        lat: -25.8619, 
                                        lng: 28.1880 
                                    },
                                    { 
                                        description: '456 Pine Street, Sandton, 2196', 
                                        lat: -26.1076, 
                                        lng: 28.0567 
                                    },
                                    { 
                                        description: '789 Main Road, Cape Town, 8001', 
                                        lat: -33.9249, 
                                        lng: 18.4241 
                                    }
                                ];
                                
                                const match = mockAddresses.find(addr => 
                                    addr.description.toLowerCase().includes(address.toLowerCase()) ||
                                    address.toLowerCase().includes(addr.description.toLowerCase())
                                );
                                
                                const coordinates = match ? { lat: match.lat, lng: match.lng } : { lat: -25.7479, lng: 28.2293 };
                                
                                // Mock place object with real coordinates
                                return {
                                    formatted_address: address,
                                    geometry: {
                                        location: {
                                            lat: () => coordinates.lat,
                                            lng: () => coordinates.lng
                                        }
                                    },
                                    address_components: [
                                        { long_name: address.split(',')[0], types: ['street_number', 'route'] },
                                        { long_name: address.split(',')[1] || 'Suburb', types: ['sublocality'] },
                                        { long_name: address.split(',')[2] || 'City', types: ['locality'] },
                                        { long_name: address.split(',')[3] || '0000', types: ['postal_code'] }
                                    ]
                                };
                            }
                        }
                    },
                    Map: class {
                        constructor(element, options) {
                            this.element = element;
                            this.options = options;
                            this.element.innerHTML = `
                                <div class="map-placeholder" style="width: 100%; height: 150px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                                    <div style="text-align: center;">
                                        <i class="fas fa-map-marker-alt fa-2x text-muted mb-2"></i>
                                        <div class="text-muted">Click to view in Google Maps</div>
                                    </div>
                                </div>
                            `;
                            this.mapPlaceholder = this.element.querySelector('.map-placeholder');
                        }
                        
                        setCenter(location) {
                            // Mock implementation
                        }
                        
                        setZoom(zoom) {
                            // Mock implementation
                        }
                    },
                    Marker: class {
                        constructor(options) {
                            this.options = options;
                        }
                        
                        setPosition(location) {
                            // Mock implementation
                        }
                        
                        setMap(map) {
                            // Mock implementation
                        }
                    }
                }
            };
            
            resolve();
        });
    }
    
    initAutocomplete() {
        // Configure autocomplete for South Africa
        this.autocomplete = new google.maps.places.Autocomplete(this.input, {
            componentRestrictions: { country: 'za' },
            fields: ['place_id', 'geometry', 'formatted_address', 'address_components']
        });
        
        this.autocomplete.addListener('place_changed', () => {
            const place = this.autocomplete.getPlace();
            
            if (place.formatted_address) {
                // Handle Google Maps LatLng object properly
                let locationData = null;
                if (place.geometry && place.geometry.location) {
                    const location = place.geometry.location;
                    locationData = {
                        lat: typeof location.lat === 'function' ? location.lat() : location.lat,
                        lng: typeof location.lng === 'function' ? location.lng() : location.lng
                    };
                }
                
                this.options.onAddressSelect({
                    fullAddress: place.formatted_address,
                    location: locationData,
                    components: this.parseAddressComponents(place.address_components)
                });
                
                if (this.map && place.geometry) {
                    this.updateMap(place.geometry.location);
                }
            }
        });
    }
    
    initMap() {
        if (!this.options.mapContainer) return;
        
        const mapOptions = {
            zoom: 15,
            center: { lat: -25.7479, lng: 28.2293 } // Default to Pretoria
        };
        
        this.map = new google.maps.Map(this.options.mapContainer, mapOptions);
        this.marker = new google.maps.Marker({
            map: this.map
        });
        
        // Add click handler to open Google Maps
        this.options.mapContainer.addEventListener('click', () => {
            const address = encodeURIComponent(this.input.value);
            window.open(`https://maps.google.com/maps?q=${address}`, '_blank');
        });
    }
    
    updateMap(location) {
        if (!this.map || !location) {
            // Update placeholder to show address is selected
            if (this.mapPlaceholder && this.input.value) {
                this.mapPlaceholder.innerHTML = `
                    <div style="text-align: center;">
                        <i class="fas fa-map-marker-alt fa-2x text-success mb-2"></i>
                        <div class="text-success"><strong>Address Located</strong></div>
                        <div class="text-muted small">${this.input.value}</div>
                        <div class="text-muted small">Click to view in Google Maps</div>
                    </div>
                `;
            }
            return;
        }
        
        this.map.setCenter(location);
        this.map.setZoom(16);
        this.marker.setPosition(location);
        this.marker.setMap(this.map);
    }
    
    parseAddressComponents(components) {
        const result = {};
        
        if (!components) return result;
        
        components.forEach(component => {
            const types = component.types;
            
            if (types.includes('street_number') || types.includes('route')) {
                result.street = component.long_name;
            } else if (types.includes('sublocality')) {
                result.suburb = component.long_name;
            } else if (types.includes('locality')) {
                result.city = component.long_name;
            } else if (types.includes('postal_code')) {
                result.postalCode = component.long_name;
            }
        });
        
        return result;
    }
}

// Utility function to create lookup fields
function createLookupField(inputElement, data, options = {}) {
    const lookupData = data.map(item => {
        if (typeof item === 'string') {
            return { name: item, value: item };
        }
        return item;
    });
    
    return new LookupField(inputElement, {
        data: lookupData,
        ...options
    });
}

// Utility function to create address fields
function createAddressField(inputElement, mapContainer = null, options = {}) {
    return new AddressField(inputElement, {
        mapContainer,
        ...options
    });
}