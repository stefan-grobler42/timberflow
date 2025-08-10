// ===================================================
// MILLENNIUM ROOFING ERP - SYSTEM DEFAULTS
// ===================================================
// Central configuration for system-wide functionality
// All modules inherit these defaults for consistent behavior

class SystemDefaults {
    // ===========================================
    // MILLENNIUM BRANDING & THEME COLORS
    // ===========================================
    static get BRAND_COLORS() {
        return {
            primary: '#59AAD5',        // Carolina Blue
            secondary: '#54C3D6',      // Middle Blue  
            dark: '#464746',           // Black Olive
            black: '#231f20',          // Rasin Black
            success: '#28a745',
            danger: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8',
            light: '#f8f9fa',
            white: '#ffffff'
        };
    }

    // ===========================================
    // ENHANCED DATA GRID DEFAULTS
    // ===========================================
    static get GRID_DEFAULTS() {
        return {
            // Standard column widths for common field types
            columnWidths: {
                id: '80px',
                code: '120px',
                shortText: '100px',
                mediumText: '150px',
                longText: '250px',
                description: '300px',
                currency: '120px',
                number: '100px',
                date: '120px',
                datetime: '160px',
                boolean: '80px',
                status: '100px',
                actions: '120px'
            },

            // Standard column types and their formatting
            columnTypes: {
                text: { align: 'left' },
                number: { align: 'right', format: 'number' },
                currency: { align: 'right', format: 'currency' },
                date: { align: 'center', format: 'date' },
                datetime: { align: 'center', format: 'datetime' },
                boolean: { align: 'center', format: 'boolean' },
                badge: { align: 'center', format: 'badge' },
                actions: { align: 'center', sortable: false }
            },

            // Standard badge color schemes
            badgeSchemes: {
                status: {
                    'Active': 'bg-success',
                    'Inactive': 'bg-secondary',
                    'Draft': 'bg-warning',
                    'Pending': 'bg-primary',
                    'Cancelled': 'bg-danger',
                    'Completed': 'bg-success'
                },
                priority: {
                    'High': 'bg-danger',
                    'Medium': 'bg-warning',
                    'Low': 'bg-success'
                },
                itemType: {
                    'Manufactured': 'bg-primary',
                    'Standard': 'bg-success',
                    'Service': 'bg-info'
                },
                customerType: {
                    'Homeowner': 'bg-info',
                    'Contractor': 'bg-primary',
                    'Developer': 'bg-success',
                    'Commercial': 'bg-warning'
                }
            },

            // Grid toolbar configuration
            toolbar: {
                showSearch: true,
                showFilter: true,
                showColumnConfig: true,
                showExport: true,
                showRefresh: true,
                exportFormats: ['excel', 'csv'],
                searchPlaceholder: 'Search...'
            },

            // Grid behavior settings
            behavior: {
                autoSave: true,
                persistColumnWidths: true,
                persistSortState: true,
                persistFilterState: false,
                multiSelect: true,
                rowClick: true,
                doubleClickEdit: true,
                keyboardNavigation: true
            }
        };
    }

    // ===========================================
    // LOOKUP FIELD DEFAULTS
    // ===========================================
    static get LOOKUP_DEFAULTS() {
        return {
            // Standard lookup field configuration
            searchThreshold: 3,        // Start searching after 3 characters
            maxResults: 50,            // Maximum results to display
            debounceDelay: 300,        // Milliseconds to wait before search
            cacheTimeout: 300000,      // 5 minutes cache timeout
            
            // Standard display templates
            templates: {
                itemTemplate: '{{code}} - {{description}}',
                suggestionTemplate: '<strong>{{code}}</strong><br><small class="text-muted">{{description}}</small>',
                selectedTemplate: '{{code}} - {{description}}'
            },

            // Keyboard navigation
            keyboard: {
                openDropdown: ['ArrowDown', 'Enter'],
                closeDropdown: ['Escape'],
                selectNext: ['ArrowDown'],
                selectPrevious: ['ArrowUp'],
                confirmSelection: ['Enter', 'Tab']
            }
        };
    }

    // ===========================================
    // LOCATION/MAPS DEFAULTS
    // ===========================================
    static get LOCATION_DEFAULTS() {
        return {
            // Google Maps configuration
            maps: {
                defaultZoom: 15,
                minZoom: 8,
                maxZoom: 20,
                mapType: 'roadmap',
                
                // Map styling (Millennium brand colors)
                styles: [
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'off' }]
                    },
                    {
                        featureType: 'water',
                        elementType: 'geometry.fill',
                        stylers: [{ color: '#59AAD5' }]
                    }
                ]
            },

            // Address autocomplete settings
            autocomplete: {
                componentRestrictions: { country: 'za' }, // South Africa
                fields: ['address_components', 'geometry', 'name', 'formatted_address'],
                types: ['establishment', 'geocode']
            },

            // GPS settings
            gps: {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        };
    }

    // ===========================================
    // AUTO-SAVE DEFAULTS
    // ===========================================
    static get AUTOSAVE_DEFAULTS() {
        return {
            enabled: true,
            debounceDelay: 1000,       // 1 second after last change
            navigationDelay: 500,      // 500ms delay before navigation
            showIndicator: true,
            indicatorTimeout: 2000,    // 2 seconds
            undoTimeout: 10000,        // 10 seconds to undo
            
            // Fields to exclude from auto-save
            excludeFields: ['password', 'confirmPassword', 'captcha'],
            
            // Auto-save triggers
            triggers: {
                onChange: true,
                onBlur: true,
                onNavigation: true,
                onFormSubmit: false  // Explicit save only
            }
        };
    }

    // ===========================================
    // FORM VALIDATION DEFAULTS
    // ===========================================
    static get VALIDATION_DEFAULTS() {
        return {
            // Standard validation rules
            rules: {
                required: {
                    message: 'This field is required'
                },
                email: {
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address'
                },
                phone: {
                    pattern: /^[\+]?[1-9][\d]{0,15}$/,
                    message: 'Please enter a valid phone number'
                },
                currency: {
                    pattern: /^\d+(\.\d{1,2})?$/,
                    message: 'Please enter a valid amount (e.g. 123.45)'
                },
                code: {
                    pattern: /^[A-Z0-9\-_]+$/,
                    message: 'Codes can only contain letters, numbers, hyphens and underscores'
                }
            },

            // Validation behavior
            behavior: {
                validateOnType: false,
                validateOnBlur: true,
                showErrorsInline: true,
                showErrorSummary: false,
                scrollToFirstError: true
            }
        };
    }

    // ===========================================
    // RESPONSIVE BREAKPOINTS
    // ===========================================
    static get BREAKPOINTS() {
        return {
            xs: '0px',
            sm: '576px',
            md: '768px',
            lg: '992px',
            xl: '1200px',
            xxl: '1400px'
        };
    }

    // ===========================================
    // UTILITY METHODS
    // ===========================================
    
    /**
     * Apply system-wide CSS custom properties
     */
    static applyGlobalStyles() {
        const root = document.documentElement;
        const colors = this.BRAND_COLORS;
        
        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--millennium-${key}`, value);
        });
    }

    /**
     * Get standard grid configuration for a module
     */
    static getGridConfig(moduleName, customConfig = {}) {
        const defaults = this.GRID_DEFAULTS;
        
        return {
            ...defaults,
            entityName: moduleName,
            storageKey: `millennium-grid-${moduleName.toLowerCase()}`,
            ...customConfig
        };
    }

    /**
     * Get standard lookup configuration for a field
     */
    static getLookupConfig(fieldName, customConfig = {}) {
        const defaults = this.LOOKUP_DEFAULTS;
        
        return {
            ...defaults,
            fieldName: fieldName,
            storageKey: `millennium-lookup-${fieldName}`,
            ...customConfig
        };
    }

    /**
     * Get standard location field configuration
     */
    static getLocationConfig(fieldName, customConfig = {}) {
        const defaults = this.LOCATION_DEFAULTS;
        
        return {
            ...defaults,
            fieldName: fieldName,
            ...customConfig
        };
    }

    /**
     * Initialize system defaults on page load
     */
    static initialize() {
        console.log('SystemDefaults: Initializing...');
        
        // Apply global styles
        this.applyGlobalStyles();
        
        // Set up global error handlers
        this.setupErrorHandlers();
        
        console.log('SystemDefaults: Ready');
    }

    /**
     * Set up global error handlers
     */
    static setupErrorHandlers() {
        // Global unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.warn('Unhandled promise rejection:', event.reason);
            // Don't prevent the default behavior, just log it
        });

        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });
    }
}

// Auto-initialize when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SystemDefaults.initialize());
} else {
    SystemDefaults.initialize();
}

// Make available globally
window.SystemDefaults = SystemDefaults;