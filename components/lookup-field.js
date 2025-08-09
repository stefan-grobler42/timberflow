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
}

// Interactive Google Maps Address Autocomplete Component
class AddressField {
    constructor(inputElement, options = {}) {
        this.input = inputElement;
        this.options = {
            onAddressSelect: options.onAddressSelect || (() => {}),
            showMap: options.showMap !== false,
            mapContainer: options.mapContainer || null,
            apiKey: options.apiKey || null
        };
        
        this.autocomplete = null;
        this.map = null;
        this.marker = null;
        this.isRealGoogleMaps = false;
        
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
                this.isRealGoogleMaps = true;
                resolve();
                return;
            }
            
            // For development, create enhanced interactive mock
            this.setupInteractiveMap();
            resolve();
        });
    }
    
    setupInteractiveMap() {
        window.google = {
            maps: {
                places: {
                    Autocomplete: class {
                        constructor(input) {
                            this.input = input;
                            this.listeners = {};
                            this.setupAddressAutocomplete();
                        }
                        
                        setupAddressAutocomplete() {
                            const addresses = [
                                { description: '117 Wilkins Bunting Street, Mooikloof, Pretoria, 0081', place_id: '1' },
                                { description: '234 Oak Avenue, Centurion, 0157', place_id: '2' },
                                { description: '456 Pine Street, Sandton, 2196', place_id: '3' },
                                { description: '789 Main Road, Cape Town, 8001', place_id: '4' },
                                { description: '123 Church Street, Pretoria Central, 0002', place_id: '5' },
                                { description: '567 Jan Smuts Avenue, Rosebank, 2196', place_id: '6' }
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
                                             data-address="${addr.description}">
                                            ${addr.description}
                                        </div>
                                    `).join('');
                                    
                                    dropdown.style.display = 'block';
                                    
                                    dropdown.querySelectorAll('.address-item').forEach(item => {
                                        item.addEventListener('click', () => {
                                            this.input.value = item.dataset.address;
                                            dropdown.style.display = 'none';
                                            this.triggerPlaceChanged(item.dataset.address);
                                        });
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
                            return {
                                formatted_address: address,
                                geometry: {
                                    location: {
                                        lat: () => -25.7479 + (Math.random() - 0.5) * 0.1,
                                        lng: () => 28.2293 + (Math.random() - 0.5) * 0.1
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
                        this.center = options.center || { lat: -25.7479, lng: 28.2293 };
                        this.zoom = options.zoom || 15;
                        this.markers = [];
                        this.createInteractiveMap();
                    }
                    
                    createInteractiveMap() {
                        this.element.innerHTML = `
                            <div style="width: 100%; height: 150px; background: linear-gradient(135deg, #a8e6cf 0%, #88d8a3 50%, #68c182 100%); border: 1px solid #dee2e6; border-radius: 0.375rem; position: relative; cursor: grab; overflow: hidden; user-select: none;">
                                <!-- Map grid pattern -->
                                <div class="map-grid" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.2; background-image: 
                                    linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px);
                                    background-size: 20px 20px;">
                                </div>
                                
                                <!-- Street patterns -->
                                <div style="position: absolute; top: 30%; left: 10%; width: 80%; height: 2px; background: rgba(255,255,255,0.6); border-radius: 1px;"></div>
                                <div style="position: absolute; top: 60%; left: 15%; width: 70%; height: 2px; background: rgba(255,255,255,0.6); border-radius: 1px;"></div>
                                <div style="position: absolute; top: 20%; left: 25%; width: 2px; height: 60%; background: rgba(255,255,255,0.6); border-radius: 1px;"></div>
                                <div style="position: absolute; top: 25%; left: 65%; width: 2px; height: 50%; background: rgba(255,255,255,0.6); border-radius: 1px;"></div>
                                
                                <!-- Marker container -->
                                <div class="marker-container" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none;"></div>
                                
                                <!-- Map controls -->
                                <div style="position: absolute; top: 10px; left: 10px; background: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; flex-direction: column;">
                                    <button class="zoom-in" style="border: none; background: none; padding: 6px 8px; cursor: pointer; border-bottom: 1px solid #eee;">
                                        <i class="fas fa-plus" style="font-size: 10px;"></i>
                                    </button>
                                    <button class="zoom-out" style="border: none; background: none; padding: 6px 8px; cursor: pointer;">
                                        <i class="fas fa-minus" style="font-size: 10px;"></i>
                                    </button>
                                </div>
                                
                                <!-- Map info -->
                                <div style="position: absolute; bottom: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">
                                    Zoom: <span class="zoom-level">${this.zoom}</span>
                                </div>
                                
                                <!-- Click to navigate indicator -->
                                <div style="position: absolute; bottom: 5px; left: 5px; background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 3px; font-size: 9px;">
                                    <i class="fas fa-external-link-alt"></i> Click to navigate
                                </div>
                            </div>
                        `;
                        
                        this.setupMapInteractions();
                    }
                    
                    setupMapInteractions() {
                        const mapElement = this.element.querySelector('div');
                        const zoomInBtn = this.element.querySelector('.zoom-in');
                        const zoomOutBtn = this.element.querySelector('.zoom-out');
                        const zoomLevel = this.element.querySelector('.zoom-level');
                        
                        // Zoom controls
                        zoomInBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.setZoom(Math.min(this.zoom + 1, 20));
                        });
                        
                        zoomOutBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.setZoom(Math.max(this.zoom - 1, 1));
                        });
                        
                        // Pan functionality with mouse
                        let isDragging = false;
                        let startX, startY;
                        
                        mapElement.addEventListener('mousedown', (e) => {
                            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'I') return;
                            isDragging = true;
                            startX = e.clientX;
                            startY = e.clientY;
                            mapElement.style.cursor = 'grabbing';
                        });
                        
                        mapElement.addEventListener('mousemove', (e) => {
                            if (isDragging) {
                                const deltaX = e.clientX - startX;
                                const deltaY = e.clientY - startY;
                                this.updateMapPosition(deltaX, deltaY);
                                startX = e.clientX;
                                startY = e.clientY;
                            }
                        });
                        
                        mapElement.addEventListener('mouseup', () => {
                            isDragging = false;
                            mapElement.style.cursor = 'grab';
                        });
                        
                        mapElement.addEventListener('mouseleave', () => {
                            isDragging = false;
                            mapElement.style.cursor = 'grab';
                        });
                        
                        // Click to open Google Maps
                        mapElement.addEventListener('click', (e) => {
                            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'I') return;
                            if (!isDragging && this.currentAddress) {
                                const address = encodeURIComponent(this.currentAddress);
                                window.open(`https://maps.google.com/maps?q=${address}`, '_blank');
                            }
                        });
                    }
                    
                    updateMapPosition(deltaX, deltaY) {
                        const grid = this.element.querySelector('.map-grid');
                        if (grid) {
                            const currentX = parseFloat(grid.style.backgroundPositionX) || 0;
                            const currentY = parseFloat(grid.style.backgroundPositionY) || 0;
                            grid.style.backgroundPosition = `${currentX + deltaX * 0.1}px ${currentY + deltaY * 0.1}px`;
                        }
                    }
                    
                    setCenter(location) {
                        this.center = location;
                        this.animateToLocation();
                    }
                    
                    setZoom(zoom) {
                        this.zoom = zoom;
                        const zoomLevel = this.element.querySelector('.zoom-level');
                        if (zoomLevel) {
                            zoomLevel.textContent = zoom;
                        }
                        
                        // Update grid size based on zoom
                        const grid = this.element.querySelector('.map-grid');
                        if (grid) {
                            const gridSize = Math.max(10, 30 - zoom);
                            grid.style.backgroundSize = `${gridSize}px ${gridSize}px`;
                        }
                    }
                    
                    animateToLocation() {
                        const mapElement = this.element.querySelector('div');
                        mapElement.style.transform = 'scale(0.95)';
                        mapElement.style.transition = 'transform 0.3s ease';
                        setTimeout(() => {
                            mapElement.style.transform = 'scale(1)';
                            setTimeout(() => {
                                mapElement.style.transition = '';
                            }, 300);
                        }, 100);
                    }
                },
                Marker: class {
                    constructor(options) {
                        this.options = options;
                        this.map = options.map;
                        this.position = options.position;
                        this.element = null;
                        if (this.map) {
                            this.createMarker();
                        }
                    }
                    
                    createMarker() {
                        if (this.map && this.map.element) {
                            // Remove existing marker
                            const existingMarker = this.map.element.querySelector('.map-marker');
                            if (existingMarker) {
                                existingMarker.remove();
                            }
                            
                            this.element = document.createElement('div');
                            this.element.className = 'map-marker';
                            this.element.style.cssText = `
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -100%);
                                z-index: 10;
                                pointer-events: none;
                            `;
                            
                            this.element.innerHTML = `
                                <i class="fas fa-map-marker-alt fa-2x text-danger" 
                                   style="filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.4)); animation: markerDrop 0.5s ease-out;"></i>
                            `;
                            
                            // Add CSS animations if not already present
                            if (!document.querySelector('#marker-animations')) {
                                const style = document.createElement('style');
                                style.id = 'marker-animations';
                                style.textContent = `
                                    @keyframes markerDrop {
                                        0% { transform: translate(-50%, -200%) scale(0.5); opacity: 0; }
                                        50% { transform: translate(-50%, -110%) scale(1.1); opacity: 0.8; }
                                        100% { transform: translate(-50%, -100%) scale(1); opacity: 1; }
                                    }
                                `;
                                document.head.appendChild(style);
                            }
                            
                            const markerContainer = this.map.element.querySelector('.marker-container');
                            if (markerContainer) {
                                markerContainer.appendChild(this.element);
                            }
                        }
                    }
                    
                    setPosition(location) {
                        this.position = location;
                        if (this.map) {
                            this.map.setCenter(location);
                        }
                    }
                    
                    setMap(map) {
                        if (this.element && this.element.parentNode) {
                            this.element.parentNode.removeChild(this.element);
                        }
                        
                        this.map = map;
                        if (map) {
                            this.createMarker();
                        }
                    }
                }
            }
        };
    }
    
    initAutocomplete() {
        this.autocomplete = new google.maps.places.Autocomplete(this.input);
        
        this.autocomplete.addListener('place_changed', () => {
            const place = this.autocomplete.getPlace();
            
            if (place.formatted_address) {
                this.options.onAddressSelect({
                    fullAddress: place.formatted_address,
                    location: place.geometry ? place.geometry.location : null,
                    components: this.parseAddressComponents(place.address_components)
                });
                
                if (this.map && place.geometry) {
                    this.updateMap(place.geometry.location, place.formatted_address);
                }
            }
        });
    }
    
    initMap() {
        if (!this.options.mapContainer) return;
        
        const mapOptions = {
            zoom: 15,
            center: { lat: -25.7479, lng: 28.2293 }
        };
        
        this.map = new google.maps.Map(this.options.mapContainer, mapOptions);
        this.marker = new google.maps.Marker({
            map: this.map
        });
    }
    
    updateMap(location, address) {
        if (this.map) {
            this.map.currentAddress = address;
            this.map.setCenter(location);
            this.map.setZoom(16);
            this.marker.setPosition(location);
            this.marker.setMap(this.map);
        }
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

// Utility functions
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

function createAddressField(inputElement, mapContainer = null, options = {}) {
    return new AddressField(inputElement, {
        mapContainer,
        ...options
    });
}