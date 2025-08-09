// Enhanced Location Picker - Simple map-based location selection
class LocationPicker {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = options;
        this.onLocationSave = options.onLocationSave || (() => {});
        this.currentLocation = null;
        this.map = null;
        this.marker = null;
        
        // Default to Pretoria, South Africa
        this.defaultCenter = { lat: -25.7479, lng: 28.2293 };
        
        this.init();
    }
    
    init() {
        this.render();
        this.setupEventListeners();
        this.initializeMap();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="location-picker-container">
                <!-- Location Info Panel -->
                <div class="location-info-panel mb-3">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0"><i class="fas fa-map-marker-alt"></i> Location Selection</h6>
                            <div class="location-actions">
                                <button class="btn btn-sm btn-primary" id="use-current-location">
                                    <i class="fas fa-crosshairs"></i> Use My Location
                                </button>
                                <button class="btn btn-sm btn-success" id="save-location" disabled>
                                    <i class="fas fa-save"></i> Save Location
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="location-display" class="text-muted">
                                <i class="fas fa-info-circle"></i> Click on the map to mark your location or use "My Location" button
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Interactive Map -->
                <div class="map-container">
                    <div id="interactive-map" style="height: 300px; border: 2px solid #dee2e6; border-radius: 0.375rem; position: relative;">
                        <div class="map-loading" id="map-loading">
                            <div class="d-flex justify-content-center align-items-center h-100">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading map...</span>
                                </div>
                                <span class="ms-2">Loading interactive map...</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Navigation Panel -->
                <div class="navigation-panel mt-3" id="navigation-panel" style="display: none;">
                    <div class="card border-success">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <div id="saved-location-info"></div>
                                </div>
                                <div class="col-md-4 text-end">
                                    <button class="btn btn-success" id="navigate-to-location">
                                        <i class="fas fa-directions"></i> Get Directions
                                    </button>
                                    <button class="btn btn-outline-secondary" id="edit-location">
                                        <i class="fas fa-edit"></i> Change
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Use current location button
        document.getElementById('use-current-location').addEventListener('click', () => {
            this.getCurrentLocation();
        });
        
        // Save location button
        document.getElementById('save-location').addEventListener('click', () => {
            this.saveCurrentLocation();
        });
        
        // Navigate to location button
        const navigateBtn = document.getElementById('navigate-to-location');
        if (navigateBtn) {
            navigateBtn.addEventListener('click', () => {
                if (this.currentLocation) {
                    this.navigateToLocation(this.currentLocation);
                }
            });
        }
        
        // Edit location button
        const editBtn = document.getElementById('edit-location');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.showMapView();
            });
        }
    }
    
    initializeMap() {
        const mapElement = document.getElementById('interactive-map');
        const loadingElement = document.getElementById('map-loading');
        
        // Check if Google Maps is available
        if (typeof google !== 'undefined' && google.maps) {
            this.createGoogleMap(mapElement, loadingElement);
        } else {
            // Wait for Google Maps to load or use fallback
            setTimeout(() => {
                if (typeof google !== 'undefined' && google.maps) {
                    this.createGoogleMap(mapElement, loadingElement);
                } else {
                    this.createFallbackMap(mapElement, loadingElement);
                }
            }, 2000);
        }
    }
    
    createGoogleMap(mapElement, loadingElement) {
        loadingElement.style.display = 'none';
        
        // Create map with click functionality
        this.map = new google.maps.Map(mapElement, {
            center: this.defaultCenter,
            zoom: 15,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: false,
            zoomControl: true
        });
        
        // Add click listener for pin dropping
        this.map.addListener('click', (event) => {
            this.setLocation(event.latLng);
        });
        
        // Create info window for marker clicks
        this.infoWindow = new google.maps.InfoWindow();
    }
    
    createFallbackMap(mapElement, loadingElement) {
        loadingElement.innerHTML = `
            <div class="fallback-map" style="height: 100%; background: #f8f9fa; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 0.375rem;">
                <div class="text-center">
                    <i class="fas fa-map-marked-alt fa-3x text-primary mb-3"></i>
                    <h6>Map Temporarily Unavailable</h6>
                    <p class="text-muted small mb-3">Use "My Location" button for GPS positioning</p>
                    <button class="btn btn-primary btn-sm" id="fallback-current-location">
                        <i class="fas fa-crosshairs"></i> Use My GPS Location
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('fallback-current-location').addEventListener('click', () => {
            this.getCurrentLocation();
        });
    }
    
    getCurrentLocation() {
        const button = document.getElementById('use-current-location');
        const originalText = button.innerHTML;
        
        // Show loading state
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finding location...';
        button.disabled = true;
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    this.setLocation(location, 'Current Location');
                    
                    // Center map if available
                    if (this.map) {
                        this.map.setCenter(location);
                        this.map.setZoom(17);
                    }
                    
                    // Reset button
                    button.innerHTML = originalText;
                    button.disabled = false;
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    
                    let errorMessage = 'Unable to get your location. ';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage += 'Please allow location access and try again.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage += 'Location information is unavailable.';
                            break;
                        case error.TIMEOUT:
                            errorMessage += 'Location request timed out.';
                            break;
                        default:
                            errorMessage += 'An unknown error occurred.';
                            break;
                    }
                    
                    this.showLocationError(errorMessage);
                    
                    // Reset button
                    button.innerHTML = originalText;
                    button.disabled = false;
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        } else {
            this.showLocationError('Geolocation is not supported by this device/browser.');
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
    
    setLocation(location, description = null) {
        // Handle both Google Maps LatLng objects and plain objects
        const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
        const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
        
        this.currentLocation = { lat, lng };
        
        // Remove existing marker
        if (this.marker) {
            this.marker.setMap(null);
        }
        
        // Add new marker if map is available
        if (this.map && typeof google !== 'undefined') {
            this.marker = new google.maps.Marker({
                position: this.currentLocation,
                map: this.map,
                animation: google.maps.Animation.DROP,
                title: description || 'Selected Location'
            });
            
            // Add click listener to marker
            this.marker.addListener('click', () => {
                this.showMarkerInfo();
            });
        }
        
        // Update display
        this.updateLocationDisplay(lat, lng, description);
        
        // Enable save button
        document.getElementById('save-location').disabled = false;
    }
    
    updateLocationDisplay(lat, lng, description) {
        const display = document.getElementById('location-display');
        
        display.innerHTML = `
            <div class="location-details">
                <div class="location-coordinates">
                    <strong><i class="fas fa-map-pin text-success"></i> Location Selected</strong>
                </div>
                <div class="location-coords text-muted small">
                    <i class="fas fa-globe"></i> ${lat.toFixed(6)}, ${lng.toFixed(6)}
                </div>
                ${description ? `<div class="location-desc small"><i class="fas fa-tag"></i> ${description}</div>` : ''}
            </div>
        `;
    }
    
    showMarkerInfo() {
        if (this.infoWindow && this.marker && this.currentLocation) {
            const content = `
                <div class="marker-info" style="padding: 10px;">
                    <strong>Selected Location</strong><br>
                    <small class="text-muted">
                        ${this.currentLocation.lat.toFixed(6)}, ${this.currentLocation.lng.toFixed(6)}
                    </small><br>
                    <button onclick="navigator.clipboard.writeText('${this.currentLocation.lat},${this.currentLocation.lng}'); alert('Coordinates copied!')" 
                            class="btn btn-sm btn-outline-primary mt-2">
                        <i class="fas fa-copy"></i> Copy Coordinates
                    </button>
                    <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${this.currentLocation.lat},${this.currentLocation.lng}', '_blank')" 
                            class="btn btn-sm btn-primary mt-2 ms-1">
                        <i class="fas fa-directions"></i> Navigate
                    </button>
                </div>
            `;
            this.infoWindow.setContent(content);
            this.infoWindow.open(this.map, this.marker);
        }
    }
    
    saveCurrentLocation() {
        if (!this.currentLocation) {
            this.showLocationError('No location selected to save.');
            return;
        }
        
        // Show saved state
        this.showNavigationPanel();
        
        // Callback to parent with location data
        this.onLocationSave({
            lat: this.currentLocation.lat,
            lng: this.currentLocation.lng,
            coordinates: `${this.currentLocation.lat.toFixed(6)}, ${this.currentLocation.lng.toFixed(6)}`,
            timestamp: new Date().toISOString()
        });
    }
    
    showNavigationPanel() {
        const mapContainer = document.querySelector('.map-container');
        const navPanel = document.getElementById('navigation-panel');
        const savedLocationInfo = document.getElementById('saved-location-info');
        
        if (this.currentLocation) {
            savedLocationInfo.innerHTML = `
                <div>
                    <h6 class="text-success mb-1">
                        <i class="fas fa-check-circle"></i> Location Saved Successfully
                    </h6>
                    <div class="text-muted small">
                        <i class="fas fa-map-marker-alt"></i> ${this.currentLocation.lat.toFixed(6)}, ${this.currentLocation.lng.toFixed(6)}
                    </div>
                    <div class="text-muted small">
                        <i class="fas fa-clock"></i> Saved ${new Date().toLocaleString()}
                    </div>
                </div>
            `;
            
            mapContainer.style.display = 'none';
            navPanel.style.display = 'block';
        }
    }
    
    showMapView() {
        const mapContainer = document.querySelector('.map-container');
        const navPanel = document.getElementById('navigation-panel');
        
        mapContainer.style.display = 'block';
        navPanel.style.display = 'none';
    }
    
    navigateToLocation(location) {
        if (location && location.lat && location.lng) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
            window.open(url, '_blank');
        }
    }
    
    showLocationError(message) {
        const display = document.getElementById('location-display');
        display.innerHTML = `
            <div class="alert alert-warning alert-sm mb-0">
                <i class="fas fa-exclamation-triangle"></i> ${message}
            </div>
        `;
    }
    
    // Method to set location from external source (e.g., saved customer data)
    loadSavedLocation(locationData) {
        if (locationData && locationData.lat && locationData.lng) {
            this.setLocation(locationData, 'Saved Location');
            
            if (this.map) {
                this.map.setCenter(locationData);
                this.map.setZoom(16);
            }
            
            this.showNavigationPanel();
        }
    }
    
    // Method to get current location data
    getLocationData() {
        return this.currentLocation;
    }
    
    // Method to clear location
    clearLocation() {
        this.currentLocation = null;
        
        if (this.marker) {
            this.marker.setMap(null);
            this.marker = null;
        }
        
        document.getElementById('save-location').disabled = true;
        document.getElementById('location-display').innerHTML = `
            <i class="fas fa-info-circle"></i> Click on the map to mark your location or use "My Location" button
        `;
        
        this.showMapView();
    }
}