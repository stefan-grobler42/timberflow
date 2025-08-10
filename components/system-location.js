// System Location - Universal Location/Address Field Component
class SystemLocation {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        // Apply system defaults
        this.options = {
            ...window.SystemDefaults?.getLocationConfig(options.fieldName || 'location') || {},
            ...options
        };
        
        this.map = null;
        this.marker = null;
        this.autocomplete = null;
        this.currentLocation = null;
        
        this.init();
    }

    init() {
        if (!this.container) return;
        this.render();
        this.setupEventListeners();
        this.initializeMap();
    }

    render() {
        this.container.innerHTML = `
            <div class="system-location">
                <div class="location-input-group">
                    <div class="input-group">
                        <input type="text" 
                               class="form-control location-search" 
                               placeholder="${this.options.placeholder || 'Enter address or search location...'}"
                               data-field="${this.options.fieldName}">
                        <button class="btn btn-outline-secondary location-gps" type="button" title="Use my location">
                            <i class="fas fa-location-arrow"></i>
                        </button>
                        <button class="btn btn-outline-secondary location-clear" type="button" style="display: none;" title="Clear location">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="location-map-container mt-2" style="display: none;">
                    <div class="mini-map" style="height: 200px; border-radius: 8px; border: 1px solid #ddd;">
                        <!-- Google Map renders here -->
                    </div>
                    <div class="map-controls mt-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted location-coordinates"></small>
                            <div class="btn-group btn-group-sm">
                                <button type="button" class="btn btn-outline-primary location-navigate" title="Open in Google Maps">
                                    <i class="fas fa-external-link-alt"></i> Navigate
                                </button>
                                <button type="button" class="btn btn-outline-secondary location-hide-map" title="Hide map">
                                    <i class="fas fa-eye-slash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Hidden fields for form data -->
                <input type="hidden" class="location-formatted-address" data-field="${this.options.fieldName}_formatted">
                <input type="hidden" class="location-latitude" data-field="${this.options.fieldName}_lat">
                <input type="hidden" class="location-longitude" data-field="${this.options.fieldName}_lng">
                <input type="hidden" class="location-place-id" data-field="${this.options.fieldName}_place_id">
            </div>
        `;

        this.setupLocationEventListeners();
    }

    setupEventListeners() {
        // Listen for system location events
        document.addEventListener('system-location-refresh', (event) => {
            if (event.detail.fieldName === this.options.fieldName) {
                this.refresh();
            }
        });

        // Listen for value changes from parent forms
        document.addEventListener('system-location-set-value', (event) => {
            if (event.detail.fieldName === this.options.fieldName) {
                this.setValue(event.detail.location);
            }
        });
    }

    setupLocationEventListeners() {
        const searchInput = this.container.querySelector('.location-search');
        const gpsBtn = this.container.querySelector('.location-gps');
        const clearBtn = this.container.querySelector('.location-clear');
        const navigateBtn = this.container.querySelector('.location-navigate');
        const hideMapBtn = this.container.querySelector('.location-hide-map');

        // GPS location button
        gpsBtn.addEventListener('click', () => {
            this.getCurrentPosition();
        });

        // Clear location button
        clearBtn.addEventListener('click', () => {
            this.clearLocation();
        });

        // Navigate button
        navigateBtn.addEventListener('click', () => {
            this.openInGoogleMaps();
        });

        // Hide map button
        hideMapBtn.addEventListener('click', () => {
            this.hideMap();
        });

        // Map click for manual pin placement
        if (this.map) {
            this.map.addListener('click', (event) => {
                this.setLocationFromCoordinates(event.latLng.lat(), event.latLng.lng());
            });
        }
    }

    initializeMap() {
        if (!window.google || !window.google.maps) {
            console.warn('Google Maps not loaded for location field');
            return;
        }

        const mapContainer = this.container.querySelector('.mini-map');
        if (!mapContainer) return;

        // Initialize map
        this.map = new google.maps.Map(mapContainer, {
            zoom: this.options.maps.defaultZoom,
            center: { lat: -25.7461, lng: 28.1881 }, // Pretoria, South Africa default
            mapTypeId: this.options.maps.mapType,
            styles: this.options.maps.styles,
            zoomControl: true,
            streetViewControl: false,
            fullscreenControl: false
        });

        // Initialize autocomplete
        const searchInput = this.container.querySelector('.location-search');
        if (searchInput) {
            this.autocomplete = new google.maps.places.Autocomplete(searchInput, {
                componentRestrictions: this.options.autocomplete.componentRestrictions,
                fields: this.options.autocomplete.fields,
                types: this.options.autocomplete.types
            });

            this.autocomplete.addListener('place_changed', () => {
                this.handlePlaceChanged();
            });
        }
    }

    handlePlaceChanged() {
        const place = this.autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
            console.warn('No location data found for selected place');
            return;
        }

        this.setLocationFromPlace(place);
    }

    setLocationFromPlace(place) {
        const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            formatted_address: place.formatted_address,
            place_id: place.place_id,
            name: place.name
        };

        this.updateLocation(location);
        this.showMap();
    }

    setLocationFromCoordinates(lat, lng) {
        const geocoder = new google.maps.Geocoder();
        
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const location = {
                    lat: lat,
                    lng: lng,
                    formatted_address: results[0].formatted_address,
                    place_id: results[0].place_id
                };

                this.updateLocation(location);
                
                // Update search input
                const searchInput = this.container.querySelector('.location-search');
                if (searchInput) {
                    searchInput.value = location.formatted_address;
                }
            }
        });
    }

    getCurrentPosition() {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by this browser.');
            return;
        }

        const gpsBtn = this.container.querySelector('.location-gps');
        gpsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        gpsBtn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.setLocationFromCoordinates(
                    position.coords.latitude,
                    position.coords.longitude
                );
                
                gpsBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
                gpsBtn.disabled = false;
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Unable to retrieve your location. Please enter address manually.');
                
                gpsBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
                gpsBtn.disabled = false;
            },
            this.options.gps
        );
    }

    updateLocation(location) {
        this.currentLocation = location;

        // Update hidden fields
        const fields = {
            'location-formatted-address': location.formatted_address || '',
            'location-latitude': location.lat || '',
            'location-longitude': location.lng || '',
            'location-place-id': location.place_id || ''
        };

        Object.entries(fields).forEach(([className, value]) => {
            const field = this.container.querySelector(`.${className}`);
            if (field) {
                field.value = value;
            }
        });

        // Update map
        if (this.map && location.lat && location.lng) {
            const position = new google.maps.LatLng(location.lat, location.lng);
            
            // Center map on location
            this.map.setCenter(position);
            this.map.setZoom(this.options.maps.defaultZoom);

            // Update marker
            if (this.marker) {
                this.marker.setMap(null);
            }

            this.marker = new google.maps.Marker({
                position: position,
                map: this.map,
                title: location.formatted_address,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
                            <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25c0-8.284-6.716-15-15-15z" fill="#59AAD5"/>
                            <circle cx="15" cy="15" r="8" fill="white"/>
                            <circle cx="15" cy="15" r="4" fill="#59AAD5"/>
                        </svg>
                    `),
                    scaledSize: new google.maps.Size(30, 40),
                    anchor: new google.maps.Point(15, 40)
                }
            });
        }

        // Update coordinates display
        const coordsDisplay = this.container.querySelector('.location-coordinates');
        if (coordsDisplay && location.lat && location.lng) {
            coordsDisplay.textContent = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
        }

        // Show clear button
        const clearBtn = this.container.querySelector('.location-clear');
        if (clearBtn) {
            clearBtn.style.display = 'block';
        }

        // Dispatch change event
        this.dispatchEvent('change', {
            location: this.currentLocation
        });
    }

    showMap() {
        const mapContainer = this.container.querySelector('.location-map-container');
        if (mapContainer) {
            mapContainer.style.display = 'block';
            
            // Trigger map resize
            setTimeout(() => {
                if (this.map) {
                    google.maps.event.trigger(this.map, 'resize');
                    if (this.currentLocation) {
                        this.map.setCenter(new google.maps.LatLng(
                            this.currentLocation.lat, 
                            this.currentLocation.lng
                        ));
                    }
                }
            }, 100);
        }
    }

    hideMap() {
        const mapContainer = this.container.querySelector('.location-map-container');
        if (mapContainer) {
            mapContainer.style.display = 'none';
        }
    }

    clearLocation() {
        this.currentLocation = null;

        // Clear search input
        const searchInput = this.container.querySelector('.location-search');
        if (searchInput) {
            searchInput.value = '';
        }

        // Clear hidden fields
        this.container.querySelectorAll('input[type="hidden"]').forEach(field => {
            field.value = '';
        });

        // Clear marker
        if (this.marker) {
            this.marker.setMap(null);
            this.marker = null;
        }

        // Hide map and clear button
        this.hideMap();
        const clearBtn = this.container.querySelector('.location-clear');
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }

        // Clear coordinates display
        const coordsDisplay = this.container.querySelector('.location-coordinates');
        if (coordsDisplay) {
            coordsDisplay.textContent = '';
        }

        // Dispatch change event
        this.dispatchEvent('change', {
            location: null
        });
    }

    openInGoogleMaps() {
        if (!this.currentLocation || !this.currentLocation.lat || !this.currentLocation.lng) {
            return;
        }

        const url = `https://www.google.com/maps?q=${this.currentLocation.lat},${this.currentLocation.lng}`;
        window.open(url, '_blank');
    }

    setValue(location) {
        if (!location) {
            this.clearLocation();
            return;
        }

        this.updateLocation(location);
        
        // Update search input
        const searchInput = this.container.querySelector('.location-search');
        if (searchInput && location.formatted_address) {
            searchInput.value = location.formatted_address;
        }

        this.showMap();
    }

    getValue() {
        return this.currentLocation;
    }

    refresh() {
        // Refresh map and autocomplete
        if (this.map) {
            google.maps.event.trigger(this.map, 'resize');
        }
    }

    dispatchEvent(eventType, data = {}) {
        const event = new CustomEvent(`system-location-${eventType}`, {
            detail: {
                fieldName: this.options.fieldName,
                containerId: this.containerId,
                ...data
            }
        });
        document.dispatchEvent(event);
    }
}

// Make globally accessible
window.SystemLocation = SystemLocation;