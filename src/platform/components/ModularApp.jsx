/**
 * ModularApp - Core modular system orchestrator
 * Implements the Modular App Charter architecture contract
 * 
 * Platform = shared, system-wide building blocks (UI widgets, services, styling, shell)
 * Modules = business features (Customers, Quotes, Stock, etc.)
 * 
 * Import rules: Modules may import only from Platform and their own module folder
 */

import { CommandRegistry } from './CommandRegistry.js';
import { HeaderBar } from './HeaderBar.jsx';

class ModularApp {
    constructor() {
        this.modules = new Map();
        this.currentModule = null;
        this.platform = {
            components: {},
            services: {}
        };
        
        console.log('ModularApp: Initializing modular system...');
        this.initializePlatform();
    }

    /**
     * Initialize Platform components according to charter
     */
    initializePlatform() {
        // Register platform components globally
        this.platform.components = {
            HeaderBar,
            CommandRegistry,
            DataGrid: null, // Will be loaded dynamically
            Form: null,
            Lookup: null,
            LocationField: null,
            SearchBox: null
        };
        
        // Initialize CommandRegistry
        this.commandRegistry = new CommandRegistry();
        
        console.log('ModularApp: Platform components registered');
    }

    /**
     * Register a business module
     * @param {string} name - Module name (Customers, Products, etc.)
     * @param {Object} moduleDefinition - Module exports
     */
    registerModule(name, moduleDefinition) {
        if (this.modules.has(name)) {
            console.warn(`ModularApp: Module ${name} already registered, overriding`);
        }
        
        this.modules.set(name, {
            name,
            component: moduleDefinition.default || moduleDefinition,
            routes: moduleDefinition.routes || [],
            actions: moduleDefinition.actions || {},
            schema: moduleDefinition.schema || null
        });
        
        console.log(`ModularApp: Module ${name} registered`);
    }

    /**
     * Load and activate a module
     * @param {string} moduleName - Name of module to activate
     */
    async loadModule(moduleName) {
        if (!this.modules.has(moduleName)) {
            console.error(`ModularApp: Module ${moduleName} not found`);
            return null;
        }

        const module = this.modules.get(moduleName);
        this.currentModule = module;
        
        // Register module actions with command registry
        if (module.actions) {
            Object.entries(module.actions).forEach(([actionName, actionFn]) => {
                this.commandRegistry.register({
                    id: `${moduleName}.${actionName}`,
                    label: actionName,
                    action: actionFn,
                    module: moduleName
                });
            });
        }
        
        console.log(`ModularApp: Module ${moduleName} activated`);
        return module;
    }

    /**
     * Get platform component
     * @param {string} componentName - Name of platform component
     */
    getPlatformComponent(componentName) {
        return this.platform.components[componentName];
    }

    /**
     * Check platform health - verify all required components are loaded
     */
    checkPlatformHealth() {
        const requiredComponents = [
            'DataGrid', 'Form', 'Lookup', 'LocationField', 'SearchBox'
        ];
        
        const missing = requiredComponents.filter(
            comp => !this.platform.components[comp]
        );
        
        if (missing.length > 0) {
            console.warn('Platform component missing:', missing.join(', '));
            return false;
        }
        
        console.log('✅ Platform health check passed');
        return true;
    }

    /**
     * Get current active module
     */
    getCurrentModule() {
        return this.currentModule;
    }

    /**
     * List all registered modules
     */
    getModules() {
        return Array.from(this.modules.keys());
    }
}

// Create global instance following charter pattern
const modularApp = new ModularApp();

// Export for ES6 modules
export default ModularApp;
export { modularApp };

// Also make available globally for legacy compatibility
if (typeof window !== 'undefined') {
    window.ModularApp = ModularApp;
    window.modularApp = modularApp;
}