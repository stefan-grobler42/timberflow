// Stock Management API Layer
class StockAPI {
    constructor() {
        this.apiBaseUrl = window.app?.apiBaseUrl || 'https://cloud-mroofing.co.za/api';
        this.endpoints = {
            items: '/stock/items',
            categories: '/stock/categories',
            import: '/stock/import',
            movements: '/stock/movements',
            adjustments: '/stock/adjustments',
            reorder: '/stock/reorder',
            valuations: '/stock/valuations'
        };
    }

    /**
     * Get all stock items with optional filtering and pagination
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Stock items with pagination info
     */
    async getStockItems(options = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            // Add pagination parameters
            if (options.page) queryParams.append('page', options.page);
            if (options.pageSize) queryParams.append('pageSize', options.pageSize);
            
            // Add filtering parameters
            if (options.search) queryParams.append('search', options.search);
            if (options.category) queryParams.append('category', options.category);
            if (options.status) queryParams.append('status', options.status);
            if (options.lowStock) queryParams.append('lowStock', options.lowStock);
            
            // Add sorting parameters
            if (options.sortBy) queryParams.append('sortBy', options.sortBy);
            if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

            const url = queryParams.toString() ? 
                       `${this.endpoints.items}?${queryParams.toString()}` : 
                       this.endpoints.items;

            return await this.apiCall(url);
        } catch (error) {
            throw new Error(`Failed to get stock items: ${error.message}`);
        }
    }

    /**
     * Get stock item by ID
     * @param {string} itemId - Stock item ID
     * @returns {Promise<Object>} Stock item data
     */
    async getStockItem(itemId) {
        try {
            return await this.apiCall(`${this.endpoints.items}/${itemId}`);
        } catch (error) {
            throw new Error(`Failed to get stock item: ${error.message}`);
        }
    }

    /**
     * Create new stock item
     * @param {Object} itemData - Stock item data
     * @returns {Promise<Object>} Created stock item
     */
    async createStockItem(itemData) {
        try {
            const validatedData = this.validateStockItemData(itemData);
            
            const response = await this.apiCall(this.endpoints.items, {
                method: 'POST',
                body: JSON.stringify(validatedData)
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to create stock item: ${error.message}`);
        }
    }

    /**
     * Update existing stock item
     * @param {string} itemId - Stock item ID
     * @param {Object} itemData - Updated stock item data
     * @returns {Promise<Object>} Updated stock item
     */
    async updateStockItem(itemId, itemData) {
        try {
            const validatedData = this.validateStockItemData(itemData);
            
            const response = await this.apiCall(`${this.endpoints.items}/${itemId}`, {
                method: 'PUT',
                body: JSON.stringify(validatedData)
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to update stock item: ${error.message}`);
        }
    }

    /**
     * Delete stock item
     * @param {string} itemId - Stock item ID
     * @returns {Promise<Object>} Deletion result
     */
    async deleteStockItem(itemId) {
        try {
            return await this.apiCall(`${this.endpoints.items}/${itemId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            throw new Error(`Failed to delete stock item: ${error.message}`);
        }
    }

    /**
     * Import stock items from Excel file
     * @param {File} file - Excel file to import
     * @param {Object} options - Import options
     * @returns {Promise<Object>} Import result
     */
    async importStockItems(file, options = {}) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            // Add import options
            Object.entries(options).forEach(([key, value]) => {
                formData.append(key, value);
            });

            const response = await fetch(`${this.apiBaseUrl}${this.endpoints.import}`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Import failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            throw new Error(`Failed to import stock items: ${error.message}`);
        }
    }

    /**
     * Get stock categories
     * @returns {Promise<Array>} List of stock categories
     */
    async getCategories() {
        try {
            return await this.apiCall(this.endpoints.categories);
        } catch (error) {
            throw new Error(`Failed to get categories: ${error.message}`);
        }
    }

    /**
     * Create new stock category
     * @param {Object} categoryData - Category data
     * @returns {Promise<Object>} Created category
     */
    async createCategory(categoryData) {
        try {
            const response = await this.apiCall(this.endpoints.categories, {
                method: 'POST',
                body: JSON.stringify(categoryData)
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to create category: ${error.message}`);
        }
    }

    /**
     * Get stock movements for an item
     * @param {string} itemId - Stock item ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Stock movements
     */
    async getStockMovements(itemId, options = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (options.startDate) queryParams.append('startDate', options.startDate);
            if (options.endDate) queryParams.append('endDate', options.endDate);
            if (options.movementType) queryParams.append('movementType', options.movementType);
            
            const url = queryParams.toString() ? 
                       `${this.endpoints.movements}/${itemId}?${queryParams.toString()}` : 
                       `${this.endpoints.movements}/${itemId}`;

            return await this.apiCall(url);
        } catch (error) {
            throw new Error(`Failed to get stock movements: ${error.message}`);
        }
    }

    /**
     * Record stock movement
     * @param {Object} movementData - Movement data
     * @returns {Promise<Object>} Recorded movement
     */
    async recordStockMovement(movementData) {
        try {
            const validatedData = this.validateMovementData(movementData);
            
            const response = await this.apiCall(this.endpoints.movements, {
                method: 'POST',
                body: JSON.stringify(validatedData)
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to record stock movement: ${error.message}`);
        }
    }

    /**
     * Perform stock adjustment
     * @param {Object} adjustmentData - Adjustment data
     * @returns {Promise<Object>} Adjustment result
     */
    async performStockAdjustment(adjustmentData) {
        try {
            const validatedData = this.validateAdjustmentData(adjustmentData);
            
            const response = await this.apiCall(this.endpoints.adjustments, {
                method: 'POST',
                body: JSON.stringify(validatedData)
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to perform stock adjustment: ${error.message}`);
        }
    }

    /**
     * Get items below reorder point
     * @returns {Promise<Array>} Items requiring reorder
     */
    async getItemsBelowReorderPoint() {
        try {
            return await this.apiCall(`${this.endpoints.reorder}/below-reorder-point`);
        } catch (error) {
            throw new Error(`Failed to get items below reorder point: ${error.message}`);
        }
    }

    /**
     * Update reorder points for multiple items
     * @param {Array} updates - Array of {itemId, reorderPoint} objects
     * @returns {Promise<Object>} Update result
     */
    async updateReorderPoints(updates) {
        try {
            const response = await this.apiCall(`${this.endpoints.reorder}/update-points`, {
                method: 'PUT',
                body: JSON.stringify({ updates })
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to update reorder points: ${error.message}`);
        }
    }

    /**
     * Get stock valuation report
     * @param {Object} options - Valuation options
     * @returns {Promise<Object>} Valuation report
     */
    async getStockValuation(options = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (options.valuationDate) queryParams.append('valuationDate', options.valuationDate);
            if (options.category) queryParams.append('category', options.category);
            if (options.includeZeroStock) queryParams.append('includeZeroStock', options.includeZeroStock);
            
            const url = queryParams.toString() ? 
                       `${this.endpoints.valuations}?${queryParams.toString()}` : 
                       this.endpoints.valuations;

            return await this.apiCall(url);
        } catch (error) {
            throw new Error(`Failed to get stock valuation: ${error.message}`);
        }
    }

    /**
     * Search stock items by various criteria
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Array>} Search results
     */
    async searchStockItems(query, options = {}) {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('q', query);
            
            if (options.category) queryParams.append('category', options.category);
            if (options.includeInactive) queryParams.append('includeInactive', options.includeInactive);
            if (options.limit) queryParams.append('limit', options.limit);
            
            return await this.apiCall(`${this.endpoints.items}/search?${queryParams.toString()}`);
        } catch (error) {
            throw new Error(`Failed to search stock items: ${error.message}`);
        }
    }

    /**
     * Match Pamir materials with stock items
     * @param {Array} materials - Materials from Pamir import
     * @returns {Promise<Array>} Matched materials with stock items
     */
    async matchPamirMaterials(materials) {
        try {
            const response = await this.apiCall(`${this.endpoints.items}/match-pamir-materials`, {
                method: 'POST',
                body: JSON.stringify({ materials })
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to match Pamir materials: ${error.message}`);
        }
    }

    /**
     * Get stock item variants
     * @param {string} itemId - Stock item ID
     * @returns {Promise<Array>} Item variants
     */
    async getItemVariants(itemId) {
        try {
            return await this.apiCall(`${this.endpoints.items}/${itemId}/variants`);
        } catch (error) {
            throw new Error(`Failed to get item variants: ${error.message}`);
        }
    }

    /**
     * Create stock item variant
     * @param {string} itemId - Parent stock item ID
     * @param {Object} variantData - Variant data
     * @returns {Promise<Object>} Created variant
     */
    async createItemVariant(itemId, variantData) {
        try {
            const response = await this.apiCall(`${this.endpoints.items}/${itemId}/variants`, {
                method: 'POST',
                body: JSON.stringify(variantData)
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to create item variant: ${error.message}`);
        }
    }

    /**
     * Get assembly components
     * @param {string} assemblyId - Assembly item ID
     * @returns {Promise<Array>} Assembly components
     */
    async getAssemblyComponents(assemblyId) {
        try {
            return await this.apiCall(`${this.endpoints.items}/${assemblyId}/components`);
        } catch (error) {
            throw new Error(`Failed to get assembly components: ${error.message}`);
        }
    }

    /**
     * Update assembly components
     * @param {string} assemblyId - Assembly item ID
     * @param {Array} components - Component list
     * @returns {Promise<Object>} Update result
     */
    async updateAssemblyComponents(assemblyId, components) {
        try {
            const response = await this.apiCall(`${this.endpoints.items}/${assemblyId}/components`, {
                method: 'PUT',
                body: JSON.stringify({ components })
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to update assembly components: ${error.message}`);
        }
    }

    /**
     * Validate stock item data
     * @param {Object} itemData - Stock item data to validate
     * @returns {Object} Validated data
     */
    validateStockItemData(itemData) {
        const required = ['code', 'description'];
        const missing = required.filter(field => !itemData[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        // Validate numeric fields
        const numericFields = ['currentStock', 'reorderPoint', 'unitCost', 'sellingPrice'];
        numericFields.forEach(field => {
            if (itemData[field] !== undefined && itemData[field] !== null) {
                const value = parseFloat(itemData[field]);
                if (isNaN(value) || value < 0) {
                    throw new Error(`${field} must be a valid positive number`);
                }
                itemData[field] = value;
            }
        });

        // Validate UOM
        const validUOMs = ['EA', 'M', 'M2', 'M3', 'KG', 'LM', 'L', 'SET'];
        if (itemData.uom && !validUOMs.includes(itemData.uom)) {
            throw new Error(`Invalid UOM. Valid options: ${validUOMs.join(', ')}`);
        }

        // Set defaults
        return {
            currentStock: 0,
            reorderPoint: 0,
            unitCost: 0,
            sellingPrice: 0,
            uom: 'EA',
            status: 'active',
            ...itemData,
            lastModified: new Date().toISOString()
        };
    }

    /**
     * Validate stock movement data
     * @param {Object} movementData - Movement data to validate
     * @returns {Object} Validated data
     */
    validateMovementData(movementData) {
        const required = ['stockItemId', 'movementType', 'quantity'];
        const missing = required.filter(field => !movementData[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        const validMovementTypes = ['in', 'out', 'adjustment', 'transfer'];
        if (!validMovementTypes.includes(movementData.movementType)) {
            throw new Error(`Invalid movement type. Valid options: ${validMovementTypes.join(', ')}`);
        }

        const quantity = parseFloat(movementData.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            throw new Error('Quantity must be a positive number');
        }

        return {
            ...movementData,
            quantity,
            movementDate: movementData.movementDate || new Date().toISOString(),
            createdBy: movementData.createdBy || 'system'
        };
    }

    /**
     * Validate stock adjustment data
     * @param {Object} adjustmentData - Adjustment data to validate
     * @returns {Object} Validated data
     */
    validateAdjustmentData(adjustmentData) {
        const required = ['stockItemId', 'newQuantity', 'reason'];
        const missing = required.filter(field => !adjustmentData[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        const newQuantity = parseFloat(adjustmentData.newQuantity);
        if (isNaN(newQuantity) || newQuantity < 0) {
            throw new Error('New quantity must be a valid non-negative number');
        }

        return {
            ...adjustmentData,
            newQuantity,
            adjustmentDate: adjustmentData.adjustmentDate || new Date().toISOString(),
            adjustedBy: adjustmentData.adjustedBy || 'system'
        };
    }

    /**
     * Make API call with error handling
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} API response
     */
    async apiCall(endpoint, options = {}) {
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
                ...defaultOptions,
                ...options
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to the server');
            }
            throw error;
        }
    }

    /**
     * Utility method to calculate stock value
     * @param {Object} stockItem - Stock item
     * @returns {number} Stock value
     */
    calculateStockValue(stockItem) {
        const quantity = stockItem.currentStock || 0;
        const unitCost = stockItem.unitCost || 0;
        return quantity * unitCost;
    }

    /**
     * Utility method to determine stock status
     * @param {Object} stockItem - Stock item
     * @returns {string} Stock status
     */
    getStockStatus(stockItem) {
        const current = stockItem.currentStock || 0;
        const reorder = stockItem.reorderPoint || 0;

        if (current === 0) {
            return 'out-of-stock';
        } else if (current <= reorder) {
            return 'low-stock';
        } else {
            return 'in-stock';
        }
    }
}

// Make StockAPI globally accessible
window.StockAPI = StockAPI;
