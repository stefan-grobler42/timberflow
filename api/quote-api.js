// Quote Management API Layer
class QuoteAPI {
    constructor() {
        this.apiBaseUrl = window.app?.apiBaseUrl || 'https://cloud-mroofing.co.za/api';
        this.endpoints = {
            quotes: '/quotes',
            templates: '/quotes/templates',
            revisions: '/quotes/revisions',
            approvals: '/quotes/approvals',
            orders: '/orders'
        };
    }

    /**
     * Create a new quote
     * @param {Object} quoteData - Quote data
     * @returns {Promise<Object>} Created quote
     */
    async createQuote(quoteData) {
        try {
            const response = await this.apiCall(this.endpoints.quotes, {
                method: 'POST',
                body: JSON.stringify(this.validateQuoteData(quoteData))
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to create quote: ${error.message}`);
        }
    }

    /**
     * Update an existing quote
     * @param {string} quoteId - Quote ID
     * @param {Object} quoteData - Updated quote data
     * @returns {Promise<Object>} Updated quote
     */
    async updateQuote(quoteId, quoteData) {
        try {
            const response = await this.apiCall(`${this.endpoints.quotes}/${quoteId}`, {
                method: 'PUT',
                body: JSON.stringify(this.validateQuoteData(quoteData))
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to update quote: ${error.message}`);
        }
    }

    /**
     * Get quote by ID
     * @param {string} quoteId - Quote ID
     * @returns {Promise<Object>} Quote data
     */
    async getQuote(quoteId) {
        try {
            return await this.apiCall(`${this.endpoints.quotes}/${quoteId}`);
        } catch (error) {
            throw new Error(`Failed to get quote: ${error.message}`);
        }
    }

    /**
     * Get all quotes with optional filtering
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} List of quotes
     */
    async getQuotes(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    queryParams.append(key, value);
                }
            });

            const url = queryParams.toString() ? 
                       `${this.endpoints.quotes}?${queryParams.toString()}` : 
                       this.endpoints.quotes;

            return await this.apiCall(url);
        } catch (error) {
            throw new Error(`Failed to get quotes: ${error.message}`);
        }
    }

    /**
     * Delete a quote
     * @param {string} quoteId - Quote ID
     * @returns {Promise<Object>} Deletion result
     */
    async deleteQuote(quoteId) {
        try {
            return await this.apiCall(`${this.endpoints.quotes}/${quoteId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            throw new Error(`Failed to delete quote: ${error.message}`);
        }
    }

    /**
     * Create a new revision of a quote
     * @param {string} quoteId - Original quote ID
     * @param {Object} revisionData - Revision data
     * @returns {Promise<Object>} New quote revision
     */
    async createRevision(quoteId, revisionData = {}) {
        try {
            const response = await this.apiCall(`${this.endpoints.revisions}/${quoteId}`, {
                method: 'POST',
                body: JSON.stringify(revisionData)
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to create quote revision: ${error.message}`);
        }
    }

    /**
     * Get all revisions for a quote
     * @param {string} quoteId - Quote ID
     * @returns {Promise<Array>} List of quote revisions
     */
    async getRevisions(quoteId) {
        try {
            return await this.apiCall(`${this.endpoints.revisions}/${quoteId}`);
        } catch (error) {
            throw new Error(`Failed to get quote revisions: ${error.message}`);
        }
    }

    /**
     * Calculate quote totals with formulas
     * @param {Array} lineItems - Quote line items with formulas
     * @param {Object} variables - Pamir variables for formula calculation
     * @returns {Promise<Object>} Calculated totals
     */
    async calculateQuoteTotals(lineItems, variables = {}) {
        try {
            const calculationData = {
                lineItems: lineItems,
                variables: variables,
                includeMarkup: true,
                includeTax: true
            };

            const response = await this.apiCall(`${this.endpoints.quotes}/calculate`, {
                method: 'POST',
                body: JSON.stringify(calculationData)
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to calculate quote totals: ${error.message}`);
        }
    }

    /**
     * Apply Pamir variables to quote formulas
     * @param {string} quoteId - Quote ID
     * @param {Object} variables - Pamir variables
     * @returns {Promise<Object>} Updated quote with calculated quantities
     */
    async applyPamirVariables(quoteId, variables) {
        try {
            const response = await this.apiCall(`${this.endpoints.quotes}/${quoteId}/apply-variables`, {
                method: 'POST',
                body: JSON.stringify({ variables })
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to apply Pamir variables: ${error.message}`);
        }
    }

    /**
     * Export quote to PDF
     * @param {string} quoteId - Quote ID
     * @param {Object} options - Export options
     * @returns {Promise<Blob>} PDF blob
     */
    async exportQuotePDF(quoteId, options = {}) {
        try {
            const response = await fetch(`${this.apiBaseUrl}${this.endpoints.quotes}/${quoteId}/pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(options),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Export failed: ${response.statusText}`);
            }

            return await response.blob();
        } catch (error) {
            throw new Error(`Failed to export quote PDF: ${error.message}`);
        }
    }

    /**
     * Submit quote for approval
     * @param {string} quoteId - Quote ID
     * @param {Object} approvalData - Approval data
     * @returns {Promise<Object>} Approval result
     */
    async submitForApproval(quoteId, approvalData = {}) {
        try {
            const response = await this.apiCall(`${this.endpoints.approvals}/${quoteId}`, {
                method: 'POST',
                body: JSON.stringify({
                    ...approvalData,
                    status: 'pending_approval',
                    submittedDate: new Date().toISOString()
                })
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to submit quote for approval: ${error.message}`);
        }
    }

    /**
     * Approve or reject a quote
     * @param {string} quoteId - Quote ID
     * @param {Object} approvalDecision - Approval decision
     * @returns {Promise<Object>} Approval result
     */
    async processApproval(quoteId, approvalDecision) {
        try {
            const response = await this.apiCall(`${this.endpoints.approvals}/${quoteId}/process`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...approvalDecision,
                    processedDate: new Date().toISOString()
                })
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to process quote approval: ${error.message}`);
        }
    }

    /**
     * Convert approved quote to order
     * @param {string} quoteId - Quote ID
     * @param {Object} orderData - Additional order data
     * @returns {Promise<Object>} Created order
     */
    async convertToOrder(quoteId, orderData = {}) {
        try {
            const response = await this.apiCall(`${this.endpoints.quotes}/${quoteId}/convert-to-order`, {
                method: 'POST',
                body: JSON.stringify({
                    ...orderData,
                    conversionDate: new Date().toISOString()
                })
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to convert quote to order: ${error.message}`);
        }
    }

    /**
     * Get quote templates
     * @returns {Promise<Array>} List of quote templates
     */
    async getTemplates() {
        try {
            return await this.apiCall(this.endpoints.templates);
        } catch (error) {
            throw new Error(`Failed to get quote templates: ${error.message}`);
        }
    }

    /**
     * Create quote from template
     * @param {string} templateId - Template ID
     * @param {Object} quoteData - Quote data to merge with template
     * @returns {Promise<Object>} Created quote
     */
    async createFromTemplate(templateId, quoteData = {}) {
        try {
            const response = await this.apiCall(`${this.endpoints.templates}/${templateId}/create-quote`, {
                method: 'POST',
                body: JSON.stringify(quoteData)
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to create quote from template: ${error.message}`);
        }
    }

    /**
     * Save quote as template
     * @param {string} quoteId - Quote ID
     * @param {Object} templateData - Template data
     * @returns {Promise<Object>} Created template
     */
    async saveAsTemplate(quoteId, templateData) {
        try {
            const response = await this.apiCall(`${this.endpoints.quotes}/${quoteId}/save-as-template`, {
                method: 'POST',
                body: JSON.stringify(templateData)
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to save quote as template: ${error.message}`);
        }
    }

    /**
     * Get quote history and audit trail
     * @param {string} quoteId - Quote ID
     * @returns {Promise<Array>} Quote history
     */
    async getQuoteHistory(quoteId) {
        try {
            return await this.apiCall(`${this.endpoints.quotes}/${quoteId}/history`);
        } catch (error) {
            throw new Error(`Failed to get quote history: ${error.message}`);
        }
    }

    /**
     * Duplicate an existing quote
     * @param {string} quoteId - Quote ID to duplicate
     * @param {Object} newQuoteData - New quote data
     * @returns {Promise<Object>} Duplicated quote
     */
    async duplicateQuote(quoteId, newQuoteData = {}) {
        try {
            const response = await this.apiCall(`${this.endpoints.quotes}/${quoteId}/duplicate`, {
                method: 'POST',
                body: JSON.stringify(newQuoteData)
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to duplicate quote: ${error.message}`);
        }
    }

    /**
     * Get quotes pending approval
     * @returns {Promise<Array>} Quotes pending approval
     */
    async getPendingApprovals() {
        try {
            return await this.apiCall(`${this.endpoints.approvals}/pending`);
        } catch (error) {
            throw new Error(`Failed to get pending approvals: ${error.message}`);
        }
    }

    /**
     * Validate quote data before sending to API
     * @param {Object} quoteData - Quote data to validate
     * @returns {Object} Validated quote data
     */
    validateQuoteData(quoteData) {
        const required = ['customerId', 'quoteDate'];
        const missing = required.filter(field => !quoteData[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        // Ensure line items have required fields
        if (quoteData.lines && Array.isArray(quoteData.lines)) {
            quoteData.lines.forEach((line, index) => {
                if (!line.stockItemId && !line.description) {
                    throw new Error(`Line item ${index + 1} must have either stockItemId or description`);
                }
                if (!line.quantity || line.quantity <= 0) {
                    throw new Error(`Line item ${index + 1} must have a valid quantity`);
                }
                if (!line.unitPrice || line.unitPrice < 0) {
                    throw new Error(`Line item ${index + 1} must have a valid unit price`);
                }
            });
        }

        // Calculate totals for line items
        if (quoteData.lines) {
            quoteData.lines = quoteData.lines.map(line => ({
                ...line,
                total: (line.quantity || 0) * (line.unitPrice || 0)
            }));

            quoteData.subtotal = quoteData.lines.reduce((sum, line) => sum + (line.total || 0), 0);
            quoteData.tax = quoteData.subtotal * (quoteData.taxRate || 0.15); // Default 15% VAT
            quoteData.total = quoteData.subtotal + quoteData.tax;
        }

        return {
            ...quoteData,
            lastModified: new Date().toISOString()
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

            // Handle different response types
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
     * Utility method to format currency
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR'
        }).format(amount);
    }

    /**
     * Utility method to generate quote reference
     * @param {Object} options - Reference generation options
     * @returns {string} Generated quote reference
     */
    generateQuoteReference(options = {}) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const sequence = options.sequence || Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        
        return `QT${year}${month}${day}-${sequence}`;
    }
}

// Make QuoteAPI globally accessible
window.QuoteAPI = QuoteAPI;
