// Interactive Mini-Map Component
class InteractiveMap {
    constructor(element, options = {}) {
        this.element = element;
        this.options = options;
        this.center = options.center || { lat: -25.7479, lng: 28.2293 };
        this.zoom = options.zoom || 15;
        this.markers = [];
        this.clickHandler = null;
        this.onLocationSelect = options.onLocationSelect || (() => {});
        this.initInteractiveMap();
    }
    
    initInteractiveMap() {
        this.element.innerHTML = `
            <div class="interactive-map" style="width: 100%; height: 200px; border: 1px solid #dee2e6; border-radius: 0.375rem; position: relative; overflow: hidden; cursor: crosshair;">
                <div class="map-container" style="width: 300%; height: 300%; background: linear-gradient(135deg, #a8e6cf 0%, #88d8a3 50%, #68c182 100%); position: absolute; transition: transform 0.3s ease; transform: translate(-100px, -100px) scale(1);">
                    <!-- Street grid overlay -->
                    <div class="street-grid" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.4;">
                        ${this.generateStreetGrid()}
                    </div>
                    <!-- Buildings overlay -->
                    <div class="buildings" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.6;">
                        ${this.generateBuildings()}
                    </div>
                </div>
                
                <!-- Map controls -->
                <div class="map-controls" style="position: absolute; top: 10px; right: 10px; z-index: 10;">
                    <div style="background: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                        <button class="zoom-in" style="border: none; background: white; padding: 5px 8px; cursor: pointer; border-bottom: 1px solid #ddd;">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="zoom-out" style="border: none; background: white; padding: 5px 8px; cursor: pointer;">
                            <i class="fas fa-minus"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Location search box -->
                <div class="map-search" style="position: absolute; top: 10px; left: 10px; z-index: 10;">
                    <input type="text" placeholder="Search location..." style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; width: 200px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                </div>
                
                <!-- Info panel -->
                <div class="map-info" style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); color: white; padding: 8px; font-size: 12px; text-align: center;">
                    <div class="coordinates">Lat: ${this.center.lat.toFixed(6)}, Lng: ${this.center.lng.toFixed(6)}</div>
                    <div style="font-size: 10px; opacity: 0.8; margin-top: 2px;">Click to drop pin • Drag to pan • Use +/- to zoom</div>
                </div>
            </div>
        `;
        
        this.mapContainer = this.element.querySelector('.map-container');
        this.coordinatesDisplay = this.element.querySelector('.coordinates');
        this.searchInput = this.element.querySelector('.map-search input');
        this.attachMapEvents();
    }
    
    generateStreetGrid() {
        let grid = '';
        // Vertical streets
        for (let i = 0; i < 12; i++) {
            const left = 5 + (i * 25);
            grid += `<div style="position: absolute; left: ${left}%; top: 0; width: 2px; height: 100%; background: #fff; opacity: 0.7;"></div>`;
        }
        // Horizontal streets
        for (let i = 0; i < 10; i++) {
            const top = 5 + (i * 20);
            grid += `<div style="position: absolute; top: ${top}%; left: 0; height: 2px; width: 100%; background: #fff; opacity: 0.7;"></div>`;
        }
        return grid;
    }
    
    generateBuildings() {
        let buildings = '';
        const buildingPositions = [
            {left: 15, top: 20, width: 12, height: 8},
            {left: 35, top: 15, width: 8, height: 12},
            {left: 55, top: 25, width: 10, height: 6},
            {left: 25, top: 45, width: 15, height: 10},
            {left: 65, top: 55, width: 12, height: 8},
            {left: 45, top: 65, width: 8, height: 10},
            {left: 75, top: 35, width: 6, height: 14},
            {left: 10, top: 70, width: 20, height: 6}
        ];
        
        buildingPositions.forEach(building => {
            buildings += `
                <div style="position: absolute; left: ${building.left}%; top: ${building.top}%; width: ${building.width}%; height: ${building.height}%; background: #666; border: 1px solid #444; opacity: 0.8; border-radius: 2px;"></div>
            `;
        });
        
        return buildings;
    }
    
    attachMapEvents() {
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
            
            this.dropPin(x, y);
        });
        
        // Zoom controls
        zoomInBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentTransform.scale = Math.min(currentTransform.scale * 1.2, 3);
            this.updateMapTransform(currentTransform);
        });
        
        zoomOutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentTransform.scale = Math.max(currentTransform.scale / 1.2, 0.5);
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
    
    searchLocation(query) {
        // Mock location search - in real implementation, use Google Places API
        const mockLocations = [
            { name: '117 Wilkins Bunting Street, Mooikloof', lat: -25.7479, lng: 28.2293 },
            { name: 'Pretoria Central', lat: -25.7461, lng: 28.1881 },
            { name: 'Sandton City', lat: -26.1076, lng: 28.0567 },
            { name: 'Cape Town CBD', lat: -33.9249, lng: 18.4241 }
        ];
        
        const found = mockLocations.find(loc => 
            loc.name.toLowerCase().includes(query.toLowerCase())
        );
        
        if (found) {
            this.center = { lat: found.lat, lng: found.lng };
            this.coordinatesDisplay.textContent = `Lat: ${this.center.lat.toFixed(6)}, Lng: ${this.center.lng.toFixed(6)}`;
            
            // Auto-drop pin at center
            setTimeout(() => {
                this.dropPin(50, 50);
            }, 300);
        }
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
        
        this.element.querySelector('.interactive-map').appendChild(pin);
        
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
        this.center = { lat: location.lat(), lng: location.lng() };
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
        if (!element) return;
        
        const phoneNumber = element.textContent || element.value;
        if (!phoneNumber) return;
        
        element.style.cursor = 'pointer';
        element.style.color = '#0066cc';
        element.style.textDecoration = 'underline';
        element.title = 'Click to call';
        
        element.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Clean phone number for dialing
            const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
            
            if (confirm(`Call ${phoneNumber}?`)) {
                window.location.href = `tel:${cleanNumber}`;
            }
        });
    }
    
    static makeEmailClickable(element) {
        if (!element) return;
        
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
    
    static makeWebsiteClickable(element) {
        if (!element) return;
        
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
    
    static applyToAllFields() {
        // Auto-apply to common field patterns
        document.querySelectorAll('input[type="tel"], input[name*="phone"], .phone-field').forEach(field => {
            if (field.value) this.makePhoneClickable(field);
        });
        
        document.querySelectorAll('input[type="email"], input[name*="email"], .email-field').forEach(field => {
            if (field.value) this.makeEmailClickable(field);
        });
        
        document.querySelectorAll('input[type="url"], input[name*="website"], .website-field').forEach(field => {
            if (field.value) this.makeWebsiteClickable(field);
        });
        
        // Also apply to display elements
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
}

// Make utilities globally available
window.InteractiveMap = InteractiveMap;
window.ClickableFieldUtils = ClickableFieldUtils;