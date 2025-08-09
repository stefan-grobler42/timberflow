// Enhanced Location Field - Combines Google autocomplete with interactive map
class EnhancedLocationField {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = options;
        this.onLocationSelect = options.onLocationSelect || (() => {});
        this.currentLocation = null;
        this.map = null;
        this.marker = null;
        this.autocomplete = null;
        
        // Default to Pretoria, South Africa
        this.defaultCenter = { lat: -25.7479, lng: 28.2293 };
        
        this.init();
    }
    
    init() {
        this.render();
        this.setupEventListeners();
        this.initializeComponents();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="enhanced-location-field">
                <!-- Address Input with Autocomplete -->
                <div class="address-input-section mb-3">
                    <div class="input-group">
                        <input type="text" class="form-control" id="location-address-input" 
                               placeholder="Type address...">
                        <button class="btn btn-outline-primary" type="button" id="use-current-location-btn">
                            <i class="fas fa-crosshairs"></i> My Location
                        </button>
                        <button class="btn btn-outline-secondary" type="button" id="clear-location-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="form-text text-muted">
                        <i class="fas fa-info-circle"></i> Type to search addresses or click "My Location" for GPS positioning
                    </div>
                </div>

                <!-- Interactive Map -->
                <div class="map-section">
                    <div id="enhanced-location-map" style="height: 250px; border: 2px solid #dee2e6; border-radius: 0.375rem; position: relative;">
                        <div class="map-loading d-flex justify-content-center align-items-center h-100" id="map-loading">
                            <div class="text-center">
                                <div class="spinner-border text-primary mb-2" role="status"></div>
                                <div class="small">Loading map...</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Map Controls -->
                    <div class="map-controls mt-2 d-flex justify-content-between">
                        <div class="location-info">
                            <small class="text-muted" id="location-coordinates">Click on map to drop pin</small>
                        </div>
                        <div class="map-actions">
                            <button type="button" class="btn btn-sm btn-outline-success" id="save-location-btn" disabled>
                                <i class="fas fa-save"></i> Save Location
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Saved Location Display -->
                <div class="saved-location-section mt-3" id="saved-location-display" style="display: none;">
                    <div class="alert alert-success">
                        <div class="row align-items-center">
                            <div class="col">
                                <strong><i class="fas fa-map-marker-alt"></i> Location Saved</strong>
                                <div id="saved-location-text" class="small"></div>
                            </div>
                            <div class="col-auto">
                                <button type="button" class="btn btn-sm btn-success" id="navigate-btn">
                                    <i class="fas fa-directions"></i> Navigate
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-secondary" id="edit-location-btn">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Use current location button
        document.getElementById('use-current-location-btn').addEventListener('click', () => {
            this.getCurrentLocation();
        });
        
        // Clear location button
        document.getElementById('clear-location-btn').addEventListener('click', () => {
            this.clearLocation();
        });
        
        // Save location button
        document.getElementById('save-location-btn').addEventListener('click', () => {
            this.saveLocation();
        });
        
        // Navigate button
        document.getElementById('navigate-btn').addEventListener('click', () => {
            this.navigateToLocation();
        });
        
        // Edit location button
        document.getElementById('edit-location-btn').addEventListener('click', () => {
            this.showEditMode();
        });
    }
    
    initializeComponents() {
        // Wait for Google Maps to load
        if (typeof google !== 'undefined' && google.maps) {
            this.initializeMap();
            this.initializeAutocomplete();
        } else {
            // Queue initialization for when Google Maps loads
            setTimeout(() => {
                if (typeof google !== 'undefined' && google.maps) {
                    this.initializeMap();
                    this.initializeAutocomplete();
                } else {
                    this.showMapError();
                }
            }, 3000);
        }
    }
    
    initializeMap() {
        const mapContainer = document.getElementById('enhanced-location-map');
        const loadingElement = document.getElementById('map-loading');
        
        loadingElement.style.display = 'none';
        
        this.map = new google.maps.Map(mapContainer, {
            center: this.defaultCenter,
            zoom: 13,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: false,
            zoomControl: true
        });
        
        // Click to drop pin
        this.map.addListener('click', (event) => {
            this.dropPin(event.latLng);
        });
    }
    
    initializeAutocomplete() {
        const addressInput = document.getElementById('location-address-input');
        
        this.autocomplete = new google.maps.places.Autocomplete(addressInput, {
            componentRestrictions: { country: 'za' }, // South Africa
            fields: ['place_id', 'geometry', 'name', 'formatted_address', 'address_components']
        });
        
        // Bind to map bounds
        if (this.map) {
            this.autocomplete.bindTo('bounds', this.map);
        }
        
        // Handle place selection
        this.autocomplete.addListener('place_changed', () => {
            const place = this.autocomplete.getPlace();
            if (place.geometry) {
                this.selectPlace(place);
            }
        });
    }
    
    selectPlace(place) {
        const location = place.geometry.location;
        const address = place.formatted_address || place.name;
        
        // Center map and zoom in
        this.map.setCenter(location);
        this.map.setZoom(16);
        
        // Drop pin at location
        this.dropPin(location, address);
        
        // Update input field
        document.getElementById('location-address-input').value = address;
    }
    
    dropPin(latLng, address = null) {
        // Remove existing marker
        if (this.marker) {
            this.marker.setMap(null);
        }
        
        // Get coordinates
        const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
        const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
        
        // Create new marker
        this.marker = new google.maps.Marker({
            position: { lat, lng },
            map: this.map,
            animation: google.maps.Animation.DROP,
            title: 'Selected Location'
        });
        
        // Store location data
        this.currentLocation = {
            lat: lat,
            lng: lng,
            address: address
        };
        
        // Update coordinates display
        document.getElementById('location-coordinates').textContent = 
            `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        // Enable save button
        document.getElementById('save-location-btn').disabled = false;
        
        // Get address if not provided
        if (!address) {
            this.reverseGeocode(lat, lng);
        }
        
        // Add click listener to marker
        this.marker.addListener('click', () => {
            this.showMarkerInfo();
        });
    }
    
    reverseGeocode(lat, lng) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const address = results[0].formatted_address;
                this.currentLocation.address = address;
                document.getElementById('location-address-input').value = address;
            }
        });
    }
    
    getCurrentLocation() {
        const button = document.getElementById('use-current-location-btn');
        const originalContent = button.innerHTML;
        
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finding...';
        button.disabled = true;
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    // Center map and drop pin
                    this.map.setCenter(location);
                    this.map.setZoom(17);
                    this.dropPin(location);
                    
                    // Reset button
                    button.innerHTML = originalContent;
                    button.disabled = false;
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    this.showLocationError('Could not get your location. Please ensure location access is enabled.');
                    
                    // Reset button
                    button.innerHTML = originalContent;
                    button.disabled = false;
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        } else {
            this.showLocationError('Geolocation is not supported by this browser.');
            button.innerHTML = originalContent;
            button.disabled = false;
        }
    }
    
    clearLocation() {
        // Clear input
        document.getElementById('location-address-input').value = '';
        
        // Remove marker
        if (this.marker) {
            this.marker.setMap(null);
            this.marker = null;
        }
        
        // Clear location data
        this.currentLocation = null;
        
        // Reset displays
        document.getElementById('location-coordinates').textContent = 'Click on map to drop pin';
        document.getElementById('save-location-btn').disabled = true;
        
        // Hide saved location display
        this.hideSavedLocation();
        
        // Reset map to default center
        if (this.map) {
            this.map.setCenter(this.defaultCenter);
            this.map.setZoom(13);
        }
    }
    
    saveLocation() {
        if (!this.currentLocation) {
            this.showLocationError('No location selected to save.');
            return;
        }
        
        const locationData = {
            ...this.currentLocation,
            coordinates: `${this.currentLocation.lat.toFixed(6)}, ${this.currentLocation.lng.toFixed(6)}`,
            timestamp: new Date().toISOString()
        };
        
        this.showSavedLocation(locationData);
        this.onLocationSelect(locationData);
    }
    
    showSavedLocation(locationData) {
        const savedSection = document.getElementById('saved-location-display');
        const savedText = document.getElementById('saved-location-text');
        
        savedText.innerHTML = `
            <div>${locationData.address || locationData.coordinates}</div>
            <div class="text-muted">${locationData.coordinates}</div>
        `;
        
        // Show saved confirmation but keep map visible
        savedSection.style.display = 'block';
        
        // Update save button text to show saved status
        const saveBtn = document.getElementById('save-location-btn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Location Saved!';
        saveBtn.classList.replace('btn-primary', 'btn-success');
        
        // Reset button after 2 seconds
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.classList.replace('btn-success', 'btn-primary');
        }, 2000);
    }
    
    showEditMode() {
        // Show input/map sections and hide saved section only if user wants to edit
        document.querySelector('.address-input-section').style.display = 'block';
        document.querySelector('.map-section').style.display = 'block';
        // Keep saved location visible if it exists, just allow editing alongside it
        if (!this.currentLocation) {
            document.getElementById('saved-location-display').style.display = 'none';
        }
    }
    
    hideSavedLocation() {
        document.getElementById('saved-location-display').style.display = 'none';
        document.querySelector('.address-input-section').style.display = 'block';
        document.querySelector('.map-section').style.display = 'block';
    }
    
    navigateToLocation() {
        if (this.currentLocation) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${this.currentLocation.lat},${this.currentLocation.lng}`;
            window.open(url, '_blank');
        }
    }
    
    showMarkerInfo() {
        if (this.currentLocation && this.marker) {
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="padding: 10px;">
                        <strong>Selected Location</strong><br>
                        <small>${this.currentLocation.address || 'Custom Location'}</small><br>
                        <small class="text-muted">${this.currentLocation.lat.toFixed(6)}, ${this.currentLocation.lng.toFixed(6)}</small><br>
                        <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${this.currentLocation.lat},${this.currentLocation.lng}', '_blank')" 
                                class="btn btn-sm btn-primary mt-2">
                            <i class="fas fa-directions"></i> Navigate
                        </button>
                    </div>
                `
            });
            infoWindow.open(this.map, this.marker);
        }
    }
    
    showLocationError(message) {
        // Create temporary error alert
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-warning alert-dismissible fade show mt-2';
        errorAlert.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        this.container.appendChild(errorAlert);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorAlert.parentNode) {
                errorAlert.remove();
            }
        }, 5000);
    }
    
    showMapError() {
        document.getElementById('enhanced-location-map').innerHTML = `
            <div class="d-flex justify-content-center align-items-center h-100 bg-light">
                <div class="text-center">
                    <i class="fas fa-exclamation-circle fa-2x text-warning mb-2"></i>
                    <div>Map temporarily unavailable</div>
                    <small class="text-muted">Use "My Location" for GPS positioning</small>
                </div>
            </div>
        `;
    }
    
    // Public methods for external use
    loadSavedLocation(locationData) {
        if (locationData && locationData.lat && locationData.lng) {
            this.currentLocation = locationData;
            
            if (this.map) {
                this.map.setCenter({ lat: locationData.lat, lng: locationData.lng });
                this.map.setZoom(16);
                this.dropPin({ lat: locationData.lat, lng: locationData.lng }, locationData.address);
            }
            
            if (locationData.address) {
                document.getElementById('location-address-input').value = locationData.address;
            }
            
            this.showSavedLocation(locationData);
        }
    }
    
    getLocationData() {
        return this.currentLocation;
    }
}