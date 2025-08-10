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
    // MODULE HEADER BAR DEFAULTS
    // ===========================================
    static get HEADER_BAR_DEFAULTS() {
        return {
            // Standard action button groups
            actionGroups: {
                create: {
                    label: 'Create',
                    icon: 'fas fa-plus',
                    variant: 'primary',
                    actions: ['New Record', 'Import Data', 'Quick Add']
                },
                edit: {
                    label: 'Edit',
                    icon: 'fas fa-edit',
                    variant: 'outline-primary',
                    actions: ['Edit Selected', 'Bulk Edit', 'Copy Record']
                },
                export: {
                    label: 'Export',
                    icon: 'fas fa-download',
                    variant: 'outline-secondary',
                    actions: ['Export Excel', 'Export PDF', 'Export Selected']
                },
                tools: {
                    label: 'Tools',
                    icon: 'fas fa-tools',
                    variant: 'outline-info',
                    actions: ['Refresh', 'Settings', 'Help']
                }
            },

            // Tab configuration for forms
            formTabs: {
                customer: [
                    { id: 'general', label: 'General', icon: 'fas fa-info-circle' },
                    { id: 'contacts', label: 'Contacts', icon: 'fas fa-users' },
                    { id: 'timeline', label: 'Timeline', icon: 'fas fa-history' },
                    { id: 'projects', label: 'Projects', icon: 'fas fa-building' },
                    { id: 'financial', label: 'Financial', icon: 'fas fa-dollar-sign' },
                    { id: 'documents', label: 'Documents', icon: 'fas fa-file-alt' }
                ],
                stock: [
                    { id: 'general', label: 'General', icon: 'fas fa-info-circle' },
                    { id: 'pricing', label: 'Pricing', icon: 'fas fa-dollar-sign' },
                    { id: 'inventory', label: 'Inventory', icon: 'fas fa-warehouse' },
                    { id: 'suppliers', label: 'Suppliers', icon: 'fas fa-truck' },
                    { id: 'history', label: 'History', icon: 'fas fa-history' }
                ]
            }
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

            // Module header bar with action groups
            moduleHeader: {
                showActionBar: true,
                showBreadcrumb: true,
                showSearch: true,
                defaultActionGroups: ['create', 'edit', 'export', 'tools']
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
     * Generate module header bar HTML
     */
    static generateModuleHeader(moduleName, customGroups = null) {
        const headerDefaults = this.HEADER_BAR_DEFAULTS;
        const actionGroups = customGroups || headerDefaults.actionGroups;
        
        let headerHtml = `
            <div class="millennium-module-header bg-white border-bottom mb-4 py-3">
                <div class="container-fluid">
                    <!-- Breadcrumb -->
                    <nav aria-label="breadcrumb" class="mb-2">
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item"><a href="#" class="text-decoration-none">Home</a></li>
                            <li class="breadcrumb-item active" aria-current="page">${moduleName}</li>
                        </ol>
                    </nav>
                    
                    <!-- Action Bar -->
                    <div class="d-flex justify-content-between align-items-center">
                        <h4 class="mb-0 fw-bold" style="color: var(--millennium-dark);">
                            <i class="fas fa-${this.getModuleIcon(moduleName)} me-2" style="color: var(--millennium-primary);"></i>
                            ${moduleName}
                        </h4>
                        
                        <div class="btn-toolbar" role="toolbar">`;
        
        // Generate action button groups
        Object.entries(actionGroups).forEach(([key, group]) => {
            headerHtml += `
                <div class="btn-group me-2" role="group">
                    <button type="button" class="btn btn-${group.variant} dropdown-toggle" 
                            data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="${group.icon} me-1"></i> ${group.label}
                    </button>
                    <ul class="dropdown-menu">`;
            
            group.actions.forEach(action => {
                headerHtml += `<li><a class="dropdown-item" href="#" data-action="${action.toLowerCase().replace(' ', '-')}">${action}</a></li>`;
            });
            
            headerHtml += `</ul></div>`;
        });
        
        headerHtml += `
                        </div>
                    </div>
                </div>
            </div>`;
        
        return headerHtml;
    }

    /**
     * Generate form tabs HTML
     */
    static generateFormTabs(moduleType, activeTab = null) {
        const headerDefaults = this.HEADER_BAR_DEFAULTS;
        const tabs = headerDefaults.formTabs[moduleType.toLowerCase()] || [];
        
        if (tabs.length === 0) return '';
        
        let tabsHtml = `
            <div class="millennium-form-tabs">
                <ul class="nav nav-tabs border-bottom-0 mb-3" id="form-tabs" role="tablist">`;
        
        tabs.forEach((tab, index) => {
            const isActive = activeTab === tab.id || (activeTab === null && index === 0);
            tabsHtml += `
                <li class="nav-item" role="presentation">
                    <button class="nav-link ${isActive ? 'active' : ''}" 
                            id="${tab.id}-tab" 
                            data-bs-toggle="tab" 
                            data-bs-target="#${tab.id}-content" 
                            type="button" 
                            role="tab" 
                            aria-controls="${tab.id}-content" 
                            aria-selected="${isActive}">
                        <i class="${tab.icon} me-1"></i> ${tab.label}
                    </button>
                </li>`;
        });
        
        tabsHtml += `
                </ul>
                <div class="tab-content" id="form-tab-content">`;
        
        tabs.forEach((tab, index) => {
            const isActive = activeTab === tab.id || (activeTab === null && index === 0);
            tabsHtml += `
                <div class="tab-pane fade ${isActive ? 'show active' : ''}" 
                     id="${tab.id}-content" 
                     role="tabpanel" 
                     aria-labelledby="${tab.id}-tab">
                    <!-- ${tab.label} content will be inserted here -->
                </div>`;
        });
        
        tabsHtml += `</div></div>`;
        
        return tabsHtml;
    }

    /**
     * Get module icon based on module name
     */
    static getModuleIcon(moduleName) {
        const icons = {
            'Customer': 'users',
            'Stock': 'boxes',
            'Project': 'building',
            'Quote': 'file-invoice',
            'Order': 'shopping-cart',
            'Financial': 'dollar-sign',
            'Settings': 'cog',
            'Reports': 'chart-bar'
        };
        
        return icons[moduleName] || 'circle';
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