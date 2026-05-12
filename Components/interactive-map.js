// Interactive Map Component with Google Maps
class InteractiveMap {
    constructor(element, options = {}) {
        this.element = element;
        this.options = options;
        this.center = options.center || { lat: -25.7479, lng: 28.2293 };
        this.zoom = options.zoom || 15;
        
        // Ensure center coordinates are always valid numbers
        this.center.lat = isNaN(this.center.lat) ? -25.7479 : this.center.lat;
        this.center.lng = isNaN(this.center.lng) ? 28.2293 : this.center.lng;
        this.markers = [];
        this.map = null;
        this.currentMarker = null;
        this.onLocationSelect = options.onLocationSelect || (() => {});
        this.initGoogleMap();
    }
    
    async initGoogleMap() {
        // Check if Google Maps is available
        if (window.googleMapsLoaded && typeof google !== 'undefined') {
            this.createGoogleMap();
        } else {
            // Queue the initialization for when Google Maps loads
            if (!window.mapInitQueue) window.mapInitQueue = [];
            window.mapInitQueue.push(() => this.createGoogleMap());
        }
    }
    
    createGoogleMap() {
        this.element.innerHTML = `
            <div class="google-map-container" style="width: 100%; height: 200px; border: 1px solid #dee2e6; border-radius: 0.375rem; position: relative;">
                <div id="google-map-${Date.now()}" style="width: 100%; height: 100%; border-radius: 0.375rem;"></div>
                
                <!-- Search box overlay -->
                <div class="map-search-overlay" style="position: absolute; top: 10px; left: 10px; z-index: 10; background: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <input type="text" class="form-control form-control-sm" placeholder="Search locations..." style="width: 200px; font-size: 12px; border: none; outline: none; padding: 8px;">
                </div>
                
                <!-- Info panel -->
                <div class="map-info" style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); color: white; padding: 8px; font-size: 12px; text-align: center; z-index: 10;">
                    <div class="coordinates">Click on map to select location</div>
                </div>
            </div>
        `;
        
        const mapElement = this.element.querySelector('[id^="google-map-"]');
        const searchInput = this.element.querySelector('.map-search-overlay input');
        this.coordinatesDisplay = this.element.querySelector('.coordinates');
        
        // Initialize Google Map
        this.map = new google.maps.Map(mapElement, {
            center: this.center,
            zoom: this.zoom,
            mapTypeControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.TOP_RIGHT,
            },
            streetViewControl: true,
            fullscreenControl: false,
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER
            }
        });
        
        // Add click listener for pin dropping
        this.map.addListener('click', (event) => {
            this.dropPin(event.latLng);
        });
        
        // Add info window for navigation
        this.infoWindow = new google.maps.InfoWindow();
        
        // Setup autocomplete for search
        const autocomplete = new google.maps.places.Autocomplete(searchInput, {
            componentRestrictions: { country: 'za' }, // Restrict to South Africa
            fields: ['place_id', 'geometry', 'name', 'formatted_address']
        });
        autocomplete.bindTo('bounds', this.map);
        
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry) {
                this.map.setCenter(place.geometry.location);
                this.map.setZoom(17);
                this.dropPin(place.geometry.location, place.formatted_address);
            }
        });
    }
    
    initMockMap() {
        this.element.innerHTML = `
            <div class="interactive-map" style="width: 100%; height: 200px; border: 1px solid #dee2e6; border-radius: 0.375rem; position: relative; overflow: hidden; cursor: crosshair;">
                <div class="map-container" style="width: 300%; height: 300%; background-image: url('data:image/svg+xml,${this.generateMapTiles()}'); background-size: 400px 400px; background-repeat: repeat; position: absolute; transition: transform 0.3s ease; transform: translate(-100px, -100px) scale(1);">
                    <!-- Street grid overlay -->
                    <div class="street-grid" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.8;">
                        ${this.generateStreetGrid()}
                    </div>
                    <!-- Buildings overlay -->
                    <div class="buildings" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.9;">
                        ${this.generateBuildings()}
                    </div>
                    <!-- Satellite overlay toggle -->
                    <div class="satellite-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url('data:image/svg+xml,${this.generateSatelliteOverlay()}'); background-size: 300px 300px; background-repeat: repeat; opacity: 0; transition: opacity 0.3s ease;">
                    </div>
                </div>
                
                <!-- Map type toggle -->
                <div class="map-controls" style="position: absolute; top: 10px; right: 10px; z-index: 10;">
                    <div style="background: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); padding: 5px;">
                        <button class="zoom-in btn btn-sm btn-light" title="Zoom In">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="zoom-out btn btn-sm btn-light" title="Zoom Out">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="map-type-toggle btn btn-sm btn-light" title="Toggle View">
                            <i class="fas fa-satellite"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Location search box -->
                <div class="map-search" style="position: absolute; top: 10px; left: 10px; z-index: 10;">
                    <input type="text" class="form-control form-control-sm" placeholder="Search location..." style="width: 200px;">
                </div>
                
                <!-- Info panel -->
                <div class="map-info" style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); color: white; padding: 8px; font-size: 12px; text-align: center;">
                    <div class="coordinates">Lat: ${this.center.lat.toFixed(6)}, Lng: ${this.center.lng.toFixed(6)}</div>
                    <div style="font-size: 10px; opacity: 0.8; margin-top: 2px;">Click to drop pin • Scroll to zoom • Drag to pan</div>
                </div>
            </div>
        `;
        
        this.mapContainer = this.element.querySelector('.map-container');
        this.coordinatesDisplay = this.element.querySelector('.coordinates');
        this.searchInput = this.element.querySelector('.map-search input');
        this.attachMockMapEvents();
    }
    
    generateMapTiles() {
        // Create realistic satellite imagery background
        return encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
                <defs>
                    <!-- Satellite terrain texture -->
                    <radialGradient id="terrain1" cx="0.3" cy="0.3" r="0.7">
                        <stop offset="0%" stop-color="#7BA05B"/>
                        <stop offset="50%" stop-color="#8FBC8F"/>
                        <stop offset="100%" stop-color="#6B8E23"/>
                    </radialGradient>
                    <radialGradient id="terrain2" cx="0.7" cy="0.6" r="0.8">
                        <stop offset="0%" stop-color="#98D982"/>
                        <stop offset="50%" stop-color="#7BA05B"/>
                        <stop offset="100%" stop-color="#5F7F3F"/>
                    </radialGradient>
                    
                    <!-- Urban areas -->
                    <pattern id="urban" patternUnits="userSpaceOnUse" width="40" height="40">
                        <rect width="40" height="40" fill="#C4A484"/>
                        <rect x="5" y="5" width="8" height="8" fill="#A0826D" opacity="0.8"/>
                        <rect x="20" y="15" width="12" height="6" fill="#8B6F47" opacity="0.7"/>
                        <rect x="15" y="25" width="6" height="10" fill="#A0826D" opacity="0.9"/>
                    </pattern>
                    
                    <!-- Water bodies -->
                    <radialGradient id="water" cx="0.5" cy="0.5" r="0.8">
                        <stop offset="0%" stop-color="#4682B4"/>
                        <stop offset="70%" stop-color="#2F4F4F"/>
                        <stop offset="100%" stop-color="#1C3A3A"/>
                    </radialGradient>
                </defs>
                
                <!-- Base terrain -->
                <rect width="800" height="800" fill="url(#terrain1)"/>
                
                <!-- Terrain variations -->
                <ellipse cx="200" cy="150" rx="120" ry="80" fill="url(#terrain2)" opacity="0.7"/>
                <ellipse cx="600" cy="400" rx="150" ry="100" fill="url(#terrain1)" opacity="0.8"/>
                <ellipse cx="400" cy="650" rx="180" ry="120" fill="url(#terrain2)" opacity="0.6"/>
                
                <!-- Urban areas -->
                <rect x="300" y="200" width="200" height="300" fill="url(#urban)" opacity="0.9"/>
                <rect x="100" y="450" width="150" height="200" fill="url(#urban)" opacity="0.8"/>
                <rect x="550" y="100" width="180" height="180" fill="url(#urban)" opacity="0.7"/>
                
                <!-- Water features -->
                <ellipse cx="150" cy="300" rx="60" ry="40" fill="url(#water)" opacity="0.9"/>
                <ellipse cx="650" cy="600" rx="80" ry="50" fill="url(#water)" opacity="0.8"/>
                
                <!-- Forest patches -->
                <circle cx="100" cy="100" r="40" fill="#228B22" opacity="0.6"/>
                <circle cx="700" cy="200" r="50" fill="#006400" opacity="0.7"/>
                <circle cx="200" cy="700" r="35" fill="#32CD32" opacity="0.5"/>
                <circle cx="600" cy="750" r="45" fill="#228B22" opacity="0.6"/>
            </svg>
        `);
    }
    
    generateStreetGrid() {
        let grid = '';
        // Major roads - vertical
        for (let i = 0; i < 8; i++) {
            const left = 8 + (i * 35);
            const width = i % 2 === 0 ? 4 : 2;
            grid += `<div style="position: absolute; left: ${left}%; top: 0; width: ${width}px; height: 100%; background: #ddd; border: 1px solid #bbb;"></div>`;
        }
        // Major roads - horizontal
        for (let i = 0; i < 6; i++) {
            const top = 8 + (i * 30);
            const height = i % 2 === 0 ? 4 : 2;
            grid += `<div style="position: absolute; top: ${top}%; left: 0; height: ${height}px; width: 100%; background: #ddd; border: 1px solid #bbb;"></div>`;
        }
        
        // Minor streets
        for (let i = 0; i < 15; i++) {
            const left = 15 + (i * 18);
            grid += `<div style="position: absolute; left: ${left}%; top: 0; width: 1px; height: 100%; background: #eee; opacity: 0.8;"></div>`;
        }
        for (let i = 0; i < 12; i++) {
            const top = 15 + (i * 20);
            grid += `<div style="position: absolute; top: ${top}%; left: 0; height: 1px; width: 100%; background: #eee; opacity: 0.8;"></div>`;
        }
        return grid;
    }
    
    generateBuildings() {
        let buildings = '';
        const buildingPositions = [
            {left: 18, top: 22, width: 8, height: 6, color: '#8b4513'},
            {left: 38, top: 18, width: 6, height: 10, color: '#696969'},
            {left: 58, top: 28, width: 12, height: 8, color: '#2f4f4f'},
            {left: 28, top: 48, width: 10, height: 7, color: '#8b4513'},
            {left: 68, top: 58, width: 8, height: 6, color: '#696969'},
            {left: 48, top: 68, width: 6, height: 8, color: '#2f4f4f'},
            {left: 78, top: 38, width: 5, height: 12, color: '#8b4513'},
            {left: 12, top: 72, width: 14, height: 5, color: '#696969'},
            {left: 85, top: 15, width: 7, height: 9, color: '#2f4f4f'},
            {left: 15, top: 55, width: 9, height: 8, color: '#8b4513'}
        ];
        
        buildingPositions.forEach(building => {
            buildings += `
                <div style="position: absolute; left: ${building.left}%; top: ${building.top}%; width: ${building.width}%; height: ${building.height}%; 
                     background: ${building.color}; border: 1px solid #333; box-shadow: 2px 2px 4px rgba(0,0,0,0.3); border-radius: 1px;"></div>
            `;
        });
        
        // Add some trees/parks
        const parkPositions = [
            {left: 30, top: 35, size: 4},
            {left: 60, top: 45, size: 6},
            {left: 45, top: 25, size: 3},
            {left: 20, top: 60, size: 5}
        ];
        
        parkPositions.forEach(park => {
            buildings += `
                <div style="position: absolute; left: ${park.left}%; top: ${park.top}%; width: ${park.size}%; height: ${park.size}%; 
                     background: #228b22; border-radius: 50%; opacity: 0.7;"></div>
            `;
        });
        
        return buildings;
    }
    
    generateSatelliteOverlay() {
        // Satellite view with more realistic aerial imagery textures
        return encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
                <defs>
                    <radialGradient id="sat1" cx="0.4" cy="0.3" r="0.9">
                        <stop offset="0%" stop-color="#8B7355"/>
                        <stop offset="40%" stop-color="#6B5B47"/>
                        <stop offset="100%" stop-color="#4A3F35"/>
                    </radialGradient>
                    <radialGradient id="sat2" cx="0.6" cy="0.7" r="0.8">
                        <stop offset="0%" stop-color="#7A9B7A"/>
                        <stop offset="60%" stop-color="#5B7A5B"/>
                        <stop offset="100%" stop-color="#3D5A3D"/>
                    </radialGradient>
                </defs>
                
                <!-- Satellite base -->
                <rect width="300" height="300" fill="url(#sat1)"/>
                
                <!-- Vegetation patterns -->
                <ellipse cx="80" cy="60" rx="40" ry="25" fill="url(#sat2)" opacity="0.8"/>
                <ellipse cx="220" cy="180" rx="50" ry="35" fill="url(#sat2)" opacity="0.7"/>
                <ellipse cx="150" cy="250" rx="35" ry="20" fill="url(#sat2)" opacity="0.9"/>
                
                <!-- Built-up areas -->
                <rect x="120" y="100" width="60" height="80" fill="#8B8680" opacity="0.9"/>
                <rect x="50" y="150" width="40" height="60" fill="#9B9590" opacity="0.8"/>
                <rect x="200" y="80" width="50" height="50" fill="#7B7670" opacity="0.85"/>
                
                <!-- Road networks (visible from satellite) -->
                <path d="M0,120 L300,120" stroke="#B0A090" stroke-width="3" opacity="0.7"/>
                <path d="M150,0 L150,300" stroke="#B0A090" stroke-width="3" opacity="0.7"/>
                <path d="M0,200 L300,200" stroke="#A59585" stroke-width="2" opacity="0.6"/>
                <path d="M80,0 L80,300" stroke="#A59585" stroke-width="2" opacity="0.6"/>
                <path d="M220,0 L220,300" stroke="#A59585" stroke-width="2" opacity="0.6"/>
                
                <!-- Shadow effects -->
                <ellipse cx="140" cy="120" rx="25" ry="15" fill="#000" opacity="0.1"/>
                <ellipse cx="70" cy="170" rx="20" ry="12" fill="#000" opacity="0.1"/>
                <ellipse cx="210" cy="100" rx="22" ry="14" fill="#000" opacity="0.1"/>
            </svg>
        `);
    }
    
    dropPin(latLng, address = null) {
        // Remove existing marker
        if (this.currentMarker) {
            this.currentMarker.setMap(null);
        }
        
        if (this.map && typeof google !== 'undefined') {
            // Google Maps marker
            this.currentMarker = new google.maps.Marker({
                position: latLng,
                map: this.map,
                animation: google.maps.Animation.DROP,
                title: 'Selected Location'
            });
            
            // Handle both Google Maps LatLng objects and plain objects
            const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
            const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
            
            // Update coordinates display
            this.coordinatesDisplay.textContent = `Selected: Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
            
            // Add click listener to marker for navigation
            this.currentMarker.addListener('click', () => {
                const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                const infoContent = `
                    <div style="padding: 5px;">
                        <strong>Selected Location</strong><br>
                        <small>Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</small><br>
                        <button onclick="window.open('${navigationUrl}', '_blank')" class="btn btn-sm btn-primary mt-2">
                            <i class="fas fa-directions"></i> Navigate Here
                        </button>
                        <button onclick="this.parentElement.parentElement.parentElement.style.display='none'" class="btn btn-sm btn-secondary mt-2 ms-1">
                            <i class="fas fa-times"></i> Close
                        </button>
                    </div>
                `;
                this.infoWindow.setContent(infoContent);
                this.infoWindow.open(this.map, this.currentMarker);
            });
            
            // Get address if not provided
            if (!address) {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: latLng }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        address = results[0].formatted_address;
                        this.onLocationSelect({
                            lat: lat,
                            lng: lng,
                            address: address
                        });
                    } else {
                        this.onLocationSelect({
                            lat: lat,
                            lng: lng,
                            address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
                        });
                    }
                });
            } else {
                this.onLocationSelect({
                    lat: lat,
                    lng: lng,
                    address: address
                });
            }
        } else {
            // Fallback to mock map
            this.initMockMap();
        }
    }
    
    // Method to center map on coordinates (called from address field)
    setCenter(location) {
        if (this.map && location && location.lat && location.lng) {
            try {
                const position = new google.maps.LatLng(location.lat, location.lng);
                this.map.setCenter(position);
                this.map.setZoom(16);
                
                // Drop a pin at the location
                setTimeout(() => {
                    this.dropPin(position);
                }, 300);
            } catch (error) {
                console.error('Error setting map center:', error);
            }
        }
    }
    
    dropMockPin(x, y) {
        // Remove existing pins
        this.element.querySelectorAll('.map-pin').forEach(pin => pin.remove());
        
        // Create new pin
        const pin = document.createElement('div');
        pin.className = 'map-pin';
        pin.style.cssText = `
            position: absolute;
            left: ${x}%;
            top: ${y}%;
            transform: translate(-50%, -100%);
            z-index: 20;
            color: #dc3545;
            font-size: 24px;
            filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.5));
            animation: pinDrop 0.5s ease-out;
            cursor: pointer;
        `;
        pin.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
        pin.title = 'Click to remove pin';
        
        // Add pin removal
        pin.addEventListener('click', (e) => {
            e.stopPropagation();
            pin.remove();
            this.coordinatesDisplay.textContent = `Lat: ${this.center.lat.toFixed(6)}, Lng: ${this.center.lng.toFixed(6)}`;
        });
        
        const mapElement = this.element.querySelector('.interactive-map');
        if (mapElement) {
            mapElement.appendChild(pin);
        }
        
        // Update coordinates (mock calculation)
        const lat = this.center.lat + (y - 50) * 0.001;
        const lng = this.center.lng + (x - 50) * 0.001;
        this.coordinatesDisplay.textContent = `📍 Pin: Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
        
        // Generate address from coordinates
        const address = this.generateAddressFromCoords(lat, lng);
        
        // Trigger callback
        this.onLocationSelect({
            lat: lat,
            lng: lng,
            address: address
        });
    }
    
    attachMockMapEvents() {
        const mapDiv = this.element.querySelector('.interactive-map');
        const zoomInBtn = this.element.querySelector('.zoom-in');
        const zoomOutBtn = this.element.querySelector('.zoom-out');
        
        let isDragging = false;
        let lastX, lastY;
        let currentTransform = { x: -100, y: -100, scale: 1 };
        
        // Pan functionality
        mapDiv.addEventListener('mousedown', (e) => {
            if (e.target.closest('.map-controls') || e.target.closest('.map-search')) return;
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            mapDiv.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - lastX;
            const deltaY = e.clientY - lastY;
            
            currentTransform.x += deltaX;
            currentTransform.y += deltaY;
            
            // Constrain movement
            currentTransform.x = Math.max(-300, Math.min(100, currentTransform.x));
            currentTransform.y = Math.max(-300, Math.min(100, currentTransform.y));
            
            this.updateMapTransform(currentTransform);
            
            lastX = e.clientX;
            lastY = e.clientY;
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            mapDiv.style.cursor = 'crosshair';
        });
        
        // Click to drop pin
        mapDiv.addEventListener('click', (e) => {
            if (e.target.closest('.map-controls') || e.target.closest('.map-search') || isDragging) return;
            
            const rect = mapDiv.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            this.dropMockPin(x, y);
        });
        
        // Zoom controls
        zoomInBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            currentTransform.scale = Math.min(currentTransform.scale * 1.2, 3);
            this.updateMapTransform(currentTransform);
        });
        
        zoomOutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            currentTransform.scale = Math.max(currentTransform.scale / 1.2, 0.5);
            this.updateMapTransform(currentTransform);
        });
        
        // Mouse wheel zoom
        mapDiv.addEventListener('wheel', (e) => {
            if (e.target.closest('.map-controls') || e.target.closest('.map-search')) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
            currentTransform.scale = Math.max(0.5, Math.min(3, currentTransform.scale * zoomDelta));
            this.updateMapTransform(currentTransform);
        });
        

        
        // Search functionality
        this.searchInput.addEventListener('input', (e) => {
            const value = e.target.value;
            if (value.length > 2) {
                this.searchLocation(value);
            }
        });
        
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.searchLocation(e.target.value);
            }
        });
    }
    
    updateMapTransform(transform) {
        this.mapContainer.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
    }
    

    
    dropPin(x, y) {
        // Remove existing pins
        this.element.querySelectorAll('.map-pin').forEach(pin => pin.remove());
        
        // Create new pin
        const pin = document.createElement('div');
        pin.className = 'map-pin';
        pin.style.cssText = `
            position: absolute;
            left: ${x}%;
            top: ${y}%;
            transform: translate(-50%, -100%);
            z-index: 20;
            color: #dc3545;
            font-size: 24px;
            filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.5));
            animation: pinDrop 0.5s ease-out;
            cursor: pointer;
        `;
        pin.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
        pin.title = 'Click to remove pin';
        
        // Add pin removal
        pin.addEventListener('click', (e) => {
            e.stopPropagation();
            pin.remove();
            this.coordinatesDisplay.textContent = `Lat: ${this.center.lat.toFixed(6)}, Lng: ${this.center.lng.toFixed(6)}`;
        });
        
        // Add animation
        if (!document.querySelector('#pin-animation-style')) {
            const style = document.createElement('style');
            style.id = 'pin-animation-style';
            style.textContent = `
                @keyframes pinDrop {
                    0% { transform: translate(-50%, -300%) scale(0.5); opacity: 0; }
                    50% { transform: translate(-50%, -120%) scale(1.3); opacity: 1; }
                    100% { transform: translate(-50%, -100%) scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        const mockMapElement = this.element.querySelector('.interactive-map');
        if (mockMapElement) {
            mockMapElement.appendChild(pin);
        }
        
        // Update coordinates (mock calculation) - ensure valid numbers
        const centerLat = isNaN(this.center.lat) ? -25.7479 : this.center.lat;
        const centerLng = isNaN(this.center.lng) ? 28.2293 : this.center.lng;
        
        const lat = centerLat + (y - 50) * 0.001;
        const lng = centerLng + (x - 50) * 0.001;
        this.coordinatesDisplay.textContent = `📍 Pin: Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
        
        // Generate address from coordinates
        const address = this.generateAddressFromCoords(lat, lng);
        
        // Trigger callback with valid coordinates
        this.onLocationSelect({
            lat: lat,
            lng: lng,
            address: address
        });
    }
    
    generateAddressFromCoords(lat, lng) {
        // Mock reverse geocoding - in real implementation, use Google Geocoding API
        const addresses = [
            '117 Wilkins Bunting Street, Mooikloof, Pretoria, 0081',
            '234 Oak Avenue, Centurion, 0157',
            '456 Pine Street, Sandton, 2196',
            '789 Main Road, Cape Town, 8001',
            '321 Church Street, Pretoria Central, 0001',
            '654 Nelson Mandela Drive, Fourways, 2055'
        ];
        
        return addresses[Math.floor(Math.random() * addresses.length)];
    }
    
    setCenter(location) {
        // Handle both Google Maps LatLng objects and plain objects
        const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
        const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
        
        // Ensure valid coordinates
        const validLat = isNaN(lat) ? -25.7479 : lat;
        const validLng = isNaN(lng) ? 28.2293 : lng;
        
        this.center = { lat: validLat, lng: validLng };
        this.coordinatesDisplay.textContent = `Lat: ${this.center.lat.toFixed(6)}, Lng: ${this.center.lng.toFixed(6)}`;
        
        // Auto-drop pin at center
        setTimeout(() => {
            this.dropPin(50, 50);
        }, 100);
    }
    
    setZoom(zoom) {
        this.zoom = zoom;
    }
    
    addListener(event, callback) {
        if (event === 'click') {
            this.clickHandler = callback;
        }
    }
}

// Clickable field utilities
class ClickableFieldUtils {
    static makePhoneClickable(element) {
        if (!element || element.classList.contains('clickable-enhanced')) return;
        
        element.classList.add('clickable-enhanced');
        
        // Wrap the input in a container with icon
        if (element.tagName === 'INPUT') {
            this.wrapInputWithIcon(element, 'fas fa-phone', (value) => {
                const cleanNumber = value.replace(/[^\d+]/g, '');
                if (confirm(`Call ${value}?`)) {
                    window.location.href = `tel:${cleanNumber}`;
                }
            });
        } else {
            // For display elements, make them clickable
            const phoneNumber = element.textContent || element.value;
            if (!phoneNumber) return;
            
            element.style.cursor = 'pointer';
            element.style.color = '#0066cc';
            element.style.textDecoration = 'underline';
            element.title = 'Click to call';
            
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
                if (confirm(`Call ${phoneNumber}?`)) {
                    window.location.href = `tel:${cleanNumber}`;
                }
            });
        }
    }
    
    static makeEmailClickable(element) {
        if (!element || element.classList.contains('clickable-enhanced')) return;
        
        element.classList.add('clickable-enhanced');
        
        // Wrap the input in a container with icon
        if (element.tagName === 'INPUT') {
            this.wrapInputWithIcon(element, 'fas fa-envelope', (value) => {
                if (!value.includes('@')) return;
                if (confirm(`Send email to ${value}?`)) {
                    window.location.href = `mailto:${value}`;
                }
            });
        } else {
            // For display elements, make them clickable
            const email = element.textContent || element.value;
            if (!email || !email.includes('@')) return;
            
            element.style.cursor = 'pointer';
            element.style.color = '#0066cc';
            element.style.textDecoration = 'underline';
            element.title = 'Click to send email';
            
            element.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm(`Send email to ${email}?`)) {
                    window.location.href = `mailto:${email}`;
                }
            });
        }
    }
    
    static makeWebsiteClickable(element) {
        if (!element || element.classList.contains('clickable-enhanced')) return;
        
        element.classList.add('clickable-enhanced');
        
        // Wrap the input in a container with icon
        if (element.tagName === 'INPUT') {
            this.wrapInputWithIcon(element, 'fas fa-external-link-alt', (value) => {
                if (!value) return;
                let url = value;
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                }
                if (confirm(`Navigate to ${value}?`)) {
                    window.open(url, '_blank');
                }
            });
        } else {
            // For display elements, make them clickable
            const website = element.textContent || element.value;
            if (!website) return;
            
            element.style.cursor = 'pointer';
            element.style.color = '#0066cc';
            element.style.textDecoration = 'underline';
            element.title = 'Click to visit website';
            
            element.addEventListener('click', (e) => {
                e.preventDefault();
                let url = website;
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                }
                if (confirm(`Navigate to ${website}?`)) {
                    window.open(url, '_blank');
                }
            });
        }
    }
    
    static wrapInputWithIcon(input, iconClass, clickHandler) {
        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'input-group';
        
        // Insert wrapper before input
        input.parentNode.insertBefore(wrapper, input);
        
        // Move input into wrapper
        wrapper.appendChild(input);
        
        // Create icon button
        const iconButton = document.createElement('button');
        iconButton.className = 'btn btn-outline-secondary';
        iconButton.type = 'button';
        iconButton.innerHTML = `<i class="${iconClass}"></i>`;
        iconButton.title = 'Click to use this contact method';
        iconButton.style.borderLeft = 'none';
        
        // Add icon click handler
        iconButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (input.value.trim()) {
                clickHandler(input.value);
            }
        });
        
        // Add to wrapper (Bootstrap 5 style)
        wrapper.appendChild(iconButton);
        
        // Ensure input can be typed in normally
        input.style.cursor = 'text';
        input.style.borderTopRightRadius = '0';
        input.style.borderBottomRightRadius = '0';
        iconButton.style.borderTopLeftRadius = '0';
        iconButton.style.borderBottomLeftRadius = '0';
    }
    
    static applyToAllFields() {
        // Auto-apply to display elements in tables only
        document.querySelectorAll('.customer-phone, .customer-email, .customer-website').forEach(element => {
            if (element.classList.contains('customer-phone')) {
                this.makePhoneClickable(element);
            } else if (element.classList.contains('customer-email')) {
                this.makeEmailClickable(element);
            } else if (element.classList.contains('customer-website')) {
                this.makeWebsiteClickable(element);
            }
        });
    }
    
    static enhanceFormFields() {
        // Only enhance specific form fields with values
        document.querySelectorAll('input[type="tel"], input[name*="phone"], .phone-field').forEach(field => {
            if (field.value && field.tagName === 'INPUT') {
                this.makePhoneClickable(field);
            }
        });
        
        document.querySelectorAll('input[type="email"], input[name*="email"], .email-field').forEach(field => {
            if (field.value && field.tagName === 'INPUT') {
                this.makeEmailClickable(field);
            }
        });
        
        document.querySelectorAll('input[type="url"], input[name*="website"], .website-field').forEach(field => {
            if (field.value && field.tagName === 'INPUT') {
                this.makeWebsiteClickable(field);
            }
        });
    }
}

// Make utilities globally available
window.InteractiveMap = InteractiveMap;
window.ClickableFieldUtils = ClickableFieldUtils;