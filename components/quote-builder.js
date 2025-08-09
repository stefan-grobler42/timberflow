// Enhanced Quote Builder Component
class QuoteBuilder {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.currentQuote = null;
        this.currentProject = null;
        this.quoteLines = [];
        this.stockItems = [];
        this.pamirVariables = {};
        this.searchTimeout = null;
        this.templateManager = new TemplateManager();
        this.enhancedPamirParser = new EnhancedPamirParser();
        
        this.init();
    }

    async init() {
        this.render();
        await this.loadStockItems();
        this.setupEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="fas fa-plus-circle"></i> New Quote</h5>
                            <div>
                                <button class="btn btn-outline-primary btn-sm me-2" id="load-template-btn">
                                    <i class="fas fa-file-import"></i> Load Template
                                </button>
                                <button class="btn btn-primary btn-sm" id="save-quote-btn" disabled>
                                    <i class="fas fa-save"></i> Save Quote
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <!-- Project Context Alert -->
                            <div id="project-context-alert" class="alert alert-info d-none mb-4">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <i class="fas fa-project-diagram"></i>
                                        <strong>Creating quote for project:</strong> 
                                        <span id="project-context-info"></span>
                                    </div>
                                    <button type="button" class="btn btn-outline-primary btn-sm" id="clear-project-context">
                                        <i class="fas fa-times"></i> Clear Project
                                    </button>
                                </div>
                            </div>

                            <!-- Quote Header Information -->
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <div class="form-floating mb-3">
                                        <input type="text" class="form-control" id="quote-reference" placeholder="Quote Reference">
                                        <label for="quote-reference">Quote Reference</label>
                                    </div>
                                    <div class="form-floating mb-3">
                                        <input type="text" class="form-control" id="customer-name" placeholder="Customer Name">
                                        <label for="customer-name">Customer Name</label>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-floating mb-3">
                                        <input type="date" class="form-control" id="quote-date" value="${new Date().toISOString().split('T')[0]}">
                                        <label for="quote-date">Quote Date</label>
                                    </div>
                                    <div class="form-floating mb-3">
                                        <input type="text" class="form-control" id="project-name" placeholder="Project Name">
                                        <label for="project-name">Project Name</label>
                                    </div>
                                </div>
                            </div>

                            <!-- Pamir Variables Panel -->
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h6 class="mb-0">
                                        <i class="fas fa-cogs"></i> Pamir Variables
                                        <button class="btn btn-outline-secondary btn-sm float-end" id="refresh-variables-btn">
                                            <i class="fas fa-sync-alt"></i> Refresh
                                        </button>
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <div id="pamir-variables-display" class="pamir-variables">
                                        <div class="text-center text-muted p-3">
                                            No Pamir data loaded. Import a project to see variables.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Quote Line Items Grid -->
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">
                                        <i class="fas fa-list"></i> Quote Line Items
                                        <div class="float-end">
                                            <input type="text" class="form-control form-control-sm d-inline-block" 
                                                   id="stock-search" placeholder="Search stock items..." style="width: 250px;">
                                        </div>
                                    </h6>
                                </div>
                                <div class="card-body p-0">
                                    <div class="quote-grid">
                                        <div class="quote-grid-header d-none d-md-flex">
                                            <div class="quote-grid-cell" style="flex: 0 0 40px;">#</div>
                                            <div class="quote-grid-cell" style="flex: 2;">Stock Item</div>
                                            <div class="quote-grid-cell" style="flex: 3;">Description</div>
                                            <div class="quote-grid-cell" style="flex: 1;">Formula</div>
                                            <div class="quote-grid-cell" style="flex: 1;">Qty</div>
                                            <div class="quote-grid-cell" style="flex: 1;">Unit Price</div>
                                            <div class="quote-grid-cell" style="flex: 1;">Total</div>
                                            <div class="quote-grid-cell" style="flex: 0 0 80px;">Actions</div>
                                        </div>
                                        <div id="quote-lines-container">
                                            <!-- Quote lines will be added here -->
                                        </div>
                                    </div>
                                </div>
                                <div class="card-footer">
                                    <button class="btn btn-outline-primary btn-sm" id="add-line-btn">
                                        <i class="fas fa-plus"></i> Add Line Item
                                    </button>
                                    <div class="float-end">
                                        <strong>Total: R <span id="quote-total">0.00</span></strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stock Item Selection Modal -->
            <div class="modal fade" id="stockSelectionModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Select Stock Item</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <input type="text" class="form-control" id="modal-stock-search" 
                                       placeholder="Search stock items...">
                            </div>
                            <div id="stock-items-list" class="stock-grid">
                                <!-- Stock items will be loaded here -->
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="select-stock-item-btn" disabled>
                                Select Item
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Add line item button
        document.getElementById('add-line-btn').addEventListener('click', () => {
            this.addQuoteLine();
        });

        // Stock search with debouncing
        document.getElementById('stock-search').addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.filterStockItems(e.target.value);
            }, 300);
        });

        // Modal stock search
        document.getElementById('modal-stock-search').addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.filterModalStockItems(e.target.value);
            }, 300);
        });

        // Save quote button
        document.getElementById('save-quote-btn').addEventListener('click', () => {
            this.saveQuote();
        });

        // Load template button
        document.getElementById('load-template-btn').addEventListener('click', () => {
            this.loadTemplate();
        });

        // Refresh variables button
        document.getElementById('refresh-variables-btn').addEventListener('click', () => {
            this.refreshPamirVariables();
        });

        // Select stock item button
        document.getElementById('select-stock-item-btn').addEventListener('click', () => {
            this.selectStockItem();
        });

        // Quote input changes
        this.container.addEventListener('input', (e) => {
            if (e.target.matches('.quote-input')) {
                this.calculateLineTotals();
                this.enableSaveButton();
            }
        });
    }

    async loadStockItems() {
        try {
            console.log('Loading stock items for quote builder...');
            
            // In development mode, use sample stock data
            if (window.app?.advancedStockManager) {
                this.stockItems = window.app.advancedStockManager.getAllSampleStockItems();
            } else {
                // Fallback sample data
                this.stockItems = this.getSampleStockItems();
            }
            
            this.populateStockModal();
            console.log(`Loaded ${this.stockItems.length} stock items`);
            
        } catch (error) {
            console.error('Failed to load stock items:', error);
            // Use fallback data instead of showing error
            this.stockItems = this.getSampleStockItems();
            this.populateStockModal();
        }
    }

    getSampleStockItems() {
        return [
            {
                id: 'SHEET-0.5-AZ100-CP-CORR',
                code: 'SHEET-0.5-AZ100-CP-CORR',
                description: '0.5mm AZ100 G550 Colorplus Corrugated Sheeting',
                category: 'Roofing Materials',
                uom: 'm',
                sellingPrice: 119.70,
                currentStock: 250
            },
            {
                id: '38x114',
                code: '38x114',
                description: 'Pine Timber 38x114mm',
                category: 'Timber',
                uom: 'm',
                sellingPrice: 59.50,
                currentStock: 180
            },
            {
                id: 'PLT-20',
                code: 'PLT-20',
                description: '20ga Nail Plates',
                category: 'Connectors',
                uom: 'ea',
                sellingPrice: 2.85,
                currentStock: 500
            },
            {
                id: 'TT-001',
                code: 'TT-001',
                description: 'Standard Hip Truss - 8m Span',
                category: 'Manufactured Items',
                uom: 'ea',
                sellingPrice: 450.00,
                currentStock: 12
            },
            {
                id: 'LAB-INSTALL',
                code: 'LAB-INSTALL',
                description: 'Installation Labour',
                category: 'Services',
                uom: 'hr',
                sellingPrice: 450.00,
                currentStock: 'N/A'
            }
        ];
    }

    populateStockModal() {
        const container = document.getElementById('stock-items-list');
        
        if (this.stockItems.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted p-3">
                    No stock items found. Please add stock items first.
                </div>
            `;
            return;
        }

        container.innerHTML = this.stockItems.map(item => `
            <div class="stock-item" data-stock-id="${item.id}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${item.code || 'N/A'}</strong> - ${item.description || 'No description'}
                        <div class="small text-muted">
                            ${item.category || 'Uncategorized'} | ${item.uom || 'EA'}
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="text-primary">R ${(item.sellingPrice || 0).toFixed(2)}</div>
                        <div class="small text-muted">Stock: ${item.currentStock || 0}</div>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers for stock item selection
        container.querySelectorAll('.stock-item').forEach(item => {
            item.addEventListener('click', () => {
                container.querySelectorAll('.stock-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                document.getElementById('select-stock-item-btn').disabled = false;
            });
        });
    }

    filterModalStockItems(searchTerm) {
        const items = document.querySelectorAll('#stock-items-list .stock-item');
        const term = searchTerm.toLowerCase();

        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(term) ? 'block' : 'none';
        });
    }

    addQuoteLine(stockItem = null) {
        const lineIndex = this.quoteLines.length;
        const line = {
            id: Date.now() + lineIndex,
            stockItemId: stockItem?.id || '',
            stockCode: stockItem?.code || '',
            description: stockItem?.description || '',
            formula: '',
            quantity: 1,
            unitPrice: stockItem?.sellingPrice || 0,
            total: stockItem?.sellingPrice || 0
        };

        this.quoteLines.push(line);
        this.renderQuoteLine(line, lineIndex);
        this.calculateLineTotals();
        this.enableSaveButton();
    }

    renderQuoteLine(line, index) {
        const container = document.getElementById('quote-lines-container');
        const lineHtml = `
            <div class="quote-grid-row" data-line-id="${line.id}">
                <div class="quote-grid-cell d-none d-md-flex" style="flex: 0 0 40px;">
                    ${index + 1}
                </div>
                <div class="quote-grid-cell" style="flex: 2;">
                    <input type="text" class="form-control form-control-sm quote-input" 
                           value="${line.stockCode}" placeholder="Click to select..." 
                           readonly onclick="quoteBuilder.openStockSelection(${line.id})">
                </div>
                <div class="quote-grid-cell" style="flex: 3;">
                    <input type="text" class="form-control form-control-sm quote-input" 
                           value="${line.description}" placeholder="Description"
                           onchange="quoteBuilder.updateLineField(${line.id}, 'description', this.value)">
                </div>
                <div class="quote-grid-cell" style="flex: 1;">
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control quote-input" 
                               value="${line.formula}" placeholder="Formula"
                               onchange="quoteBuilder.updateLineField(${line.id}, 'formula', this.value)">
                        <button class="btn btn-outline-secondary" type="button" 
                                onclick="quoteBuilder.openFormulaBuilder(${line.id})">
                            <i class="fas fa-calculator"></i>
                        </button>
                    </div>
                </div>
                <div class="quote-grid-cell" style="flex: 1;">
                    <input type="number" class="form-control form-control-sm quote-input" 
                           value="${line.quantity}" min="0" step="0.01"
                           onchange="quoteBuilder.updateLineField(${line.id}, 'quantity', parseFloat(this.value))">
                </div>
                <div class="quote-grid-cell" style="flex: 1;">
                    <input type="number" class="form-control form-control-sm quote-input" 
                           value="${line.unitPrice}" min="0" step="0.01"
                           onchange="quoteBuilder.updateLineField(${line.id}, 'unitPrice', parseFloat(this.value))">
                </div>
                <div class="quote-grid-cell" style="flex: 1;">
                    <input type="text" class="form-control form-control-sm" 
                           value="R ${line.total.toFixed(2)}" readonly>
                </div>
                <div class="quote-grid-cell" style="flex: 0 0 80px;">
                    <button class="btn btn-outline-danger btn-sm" 
                            onclick="quoteBuilder.removeLine(${line.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', lineHtml);
    }

    openStockSelection(lineId) {
        this.currentEditingLineId = lineId;
        const modal = new bootstrap.Modal(document.getElementById('stockSelectionModal'));
        modal.show();
    }

    selectStockItem() {
        const selectedItem = document.querySelector('#stock-items-list .stock-item.selected');
        if (!selectedItem) return;

        const stockId = selectedItem.getAttribute('data-stock-id');
        const stockItem = this.stockItems.find(item => item.id == stockId);
        
        if (stockItem && this.currentEditingLineId) {
            this.updateLineField(this.currentEditingLineId, 'stockItemId', stockItem.id);
            this.updateLineField(this.currentEditingLineId, 'stockCode', stockItem.code);
            this.updateLineField(this.currentEditingLineId, 'description', stockItem.description);
            this.updateLineField(this.currentEditingLineId, 'unitPrice', stockItem.sellingPrice || 0);
            
            // Re-render the line
            const lineElement = document.querySelector(`[data-line-id="${this.currentEditingLineId}"]`);
            const lineIndex = this.quoteLines.findIndex(line => line.id === this.currentEditingLineId);
            const line = this.quoteLines[lineIndex];
            
            lineElement.outerHTML = '';
            this.renderQuoteLine(line, lineIndex);
            this.calculateLineTotals();
        }

        bootstrap.Modal.getInstance(document.getElementById('stockSelectionModal')).hide();
    }

    updateLineField(lineId, field, value) {
        const line = this.quoteLines.find(l => l.id === lineId);
        if (line) {
            line[field] = value;
            
            // If quantity or unit price changed, recalculate total
            if (field === 'quantity' || field === 'unitPrice') {
                line.total = (line.quantity || 0) * (line.unitPrice || 0);
                
                // Update the total display
                const lineElement = document.querySelector(`[data-line-id="${lineId}"]`);
                const totalInput = lineElement.querySelector('input[readonly]');
                if (totalInput) {
                    totalInput.value = `R ${line.total.toFixed(2)}`;
                }
                
                this.calculateQuoteTotal();
            }

            // If formula changed, try to calculate it
            if (field === 'formula' && value) {
                this.calculateFormula(lineId, value);
            }
            
            this.enableSaveButton();
        }
    }

    calculateFormula(lineId, formula) {
        try {
            const calculator = new FormulaCalculator();
            const result = calculator.evaluate(formula, this.pamirVariables);
            
            if (result !== null && !isNaN(result)) {
                this.updateLineField(lineId, 'quantity', result);
                
                // Update the quantity input display
                const lineElement = document.querySelector(`[data-line-id="${lineId}"]`);
                const quantityInput = lineElement.querySelector('input[type="number"]');
                if (quantityInput) {
                    quantityInput.value = result;
                }
            }
        } catch (error) {
            console.warn('Formula calculation failed:', error);
            window.app.showAlert(`Invalid formula: ${error.message}`, 'warning');
        }
    }

    removeLine(lineId) {
        this.quoteLines = this.quoteLines.filter(line => line.id !== lineId);
        document.querySelector(`[data-line-id="${lineId}"]`).remove();
        this.calculateLineTotals();
        this.enableSaveButton();
    }

    calculateLineTotals() {
        this.quoteLines.forEach(line => {
            line.total = (line.quantity || 0) * (line.unitPrice || 0);
        });
        this.calculateQuoteTotal();
    }

    calculateQuoteTotal() {
        const total = this.quoteLines.reduce((sum, line) => sum + (line.total || 0), 0);
        document.getElementById('quote-total').textContent = total.toFixed(2);
    }

    enableSaveButton() {
        document.getElementById('save-quote-btn').disabled = false;
    }

    async saveQuote() {
        try {
            window.app.showLoading(true);
            
            const quoteData = {
                reference: document.getElementById('quote-reference').value,
                customerId: document.getElementById('customer-select').value,
                quoteDate: document.getElementById('quote-date').value,
                projectName: document.getElementById('project-name').value,
                lines: this.quoteLines,
                pamirVariables: this.pamirVariables
            };

            const response = await window.app.apiCall('/quotes', {
                method: 'POST',
                body: JSON.stringify(quoteData)
            });

            window.app.showAlert('Quote saved successfully!', 'success');
            document.getElementById('save-quote-btn').disabled = true;
            
        } catch (error) {
            console.error('Failed to save quote:', error);
            window.app.showAlert('Failed to save quote. Please try again.', 'danger');
        } finally {
            window.app.showLoading(false);
        }
    }

    async refreshPamirVariables() {
        try {
            const response = await window.app.apiCall('/pamir/variables/latest');
            this.pamirVariables = response || {};
            this.displayPamirVariables();
        } catch (error) {
            console.error('Failed to refresh Pamir variables:', error);
            window.app.showAlert('Failed to refresh Pamir variables.', 'warning');
        }
    }

    displayPamirVariables() {
        const container = document.getElementById('pamir-variables-display');
        
        if (Object.keys(this.pamirVariables).length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted p-3">
                    No Pamir variables available. Import a project to see variables.
                </div>
            `;
            return;
        }

        container.innerHTML = Object.entries(this.pamirVariables).map(([key, value]) => `
            <div class="variable-item">
                <span class="variable-name">${key}</span>
                <span class="variable-value">${value}</span>
            </div>
        `).join('');
    }

    openFormulaBuilder(lineId) {
        // This would open a more sophisticated formula builder
        // For now, show a simple prompt with available variables
        const variables = Object.keys(this.pamirVariables).join(', ');
        const currentFormula = this.quoteLines.find(l => l.id === lineId)?.formula || '';
        
        const newFormula = prompt(
            `Enter formula (available variables: ${variables}):`, 
            currentFormula
        );
        
        if (newFormula !== null) {
            this.updateLineField(lineId, 'formula', newFormula);
            
            // Update the formula input display
            const lineElement = document.querySelector(`[data-line-id="${lineId}"]`);
            const formulaInput = lineElement.querySelector('input[placeholder="Formula"]');
            if (formulaInput) {
                formulaInput.value = newFormula;
            }
        }
    }

    loadTemplate() {
        // Create modal for template selection
        const modalHTML = `
            <div class="modal fade" id="templateSelectionModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-layer-group"></i> Insert Material Template
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${this.templateManager.renderTemplateSelector()}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        const existingModal = document.getElementById('templateSelectionModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Setup template selection handlers
        this.setupTemplateHandlers();
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('templateSelectionModal'));
        modal.show();
    }

    setupTemplateHandlers() {
        // Setup insert template button handlers
        document.querySelectorAll('.insert-template').forEach(button => {
            button.addEventListener('click', (e) => {
                const templateId = e.target.dataset.templateId;
                this.insertTemplate(templateId);
            });
        });
    }

    async insertTemplate(templateId) {
        try {
            // Set available variables for template processing
            this.templateManager.setAvailableVariables(this.pamirVariables);
            
            // Process template with current variables
            const result = this.templateManager.insertTemplateIntoQuote(
                templateId, 
                this, 
                this.pamirVariables
            );
            
            // Add processed items to quote
            this.addTemplateItemsToQuote(result.template);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('templateSelectionModal'));
            modal.hide();
            
            // Show success message
            window.app.showAlert(
                `Template "${result.template.name}" added successfully! ` +
                `${result.addedItems.withQuantity} items with quantities, ` +
                `${result.addedItems.withoutQuantity} items need manual entry.`, 
                'success'
            );
            
        } catch (error) {
            console.error('Failed to insert template:', error);
            window.app.showAlert(`Failed to insert template: ${error.message}`, 'danger');
        }
    }

    addTemplateItemsToQuote(template) {
        // Add items grouped by their template groups
        template.groups.forEach(group => {
            // Add group header
            this.addGroupHeader(group.name, group.collapsible);
            
            // Add individual items
            group.items.forEach(item => {
                const quoteLine = {
                    id: Date.now() + Math.random(),
                    stockItemId: item.stockCode,
                    stockCode: item.stockCode,
                    description: item.description,
                    formula: item.formula || '',
                    quantity: item.calculatedQuantity || 0,
                    unitPrice: item.pricing?.unitPrice || 0,
                    total: (item.calculatedQuantity || 0) * (item.pricing?.unitPrice || 0),
                    groupName: group.name,
                    hasVariables: item.hasVariables,
                    requiresTally: item.requiresTally,
                    variables: item.variables,
                    formulaError: item.formulaError
                };
                
                this.quoteLines.push(quoteLine);
                this.renderQuoteLine(quoteLine, this.quoteLines.length - 1);
            });
        });
        
        this.calculateLineTotals();
        this.enableSaveButton();
    }

    addGroupHeader(groupName, collapsible = true) {
        const container = document.getElementById('quote-lines-container');
        const headerId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const headerHTML = `
            <div class="quote-group-header" data-group-name="${groupName}">
                <div class="group-header-content">
                    ${collapsible ? 
                        `<button class="btn btn-sm btn-link group-toggle" data-bs-toggle="collapse" data-bs-target="#${headerId}">
                            <i class="fas fa-chevron-down"></i>
                        </button>` : ''
                    }
                    <strong class="group-title">
                        <i class="fas fa-layer-group"></i> ${groupName}
                    </strong>
                </div>
            </div>
            <div class="collapse show" id="${headerId}">
        `;
        
        container.insertAdjacentHTML('beforeend', headerHTML);
        
        // Add closing div after items are added
        this.currentGroupContainer = headerId;
    }

    addMaterialGroup(groupName, items) {
        // This method is called by the template manager
        this.addGroupHeader(groupName, true);
        
        items.forEach(item => {
            const quoteLine = {
                id: Date.now() + Math.random(),
                stockItemId: item.stockCode,
                stockCode: item.stockCode,
                description: item.description,
                formula: item.formula || '',
                quantity: item.calculatedQuantity || item.quantity || 0,
                unitPrice: item.pricing?.unitPrice || 0,
                total: (item.calculatedQuantity || item.quantity || 0) * (item.pricing?.unitPrice || 0),
                groupName: groupName
            };
            
            this.quoteLines.push(quoteLine);
            this.renderQuoteLine(quoteLine, this.quoteLines.length - 1);
        });
        
        // Close the collapsible group
        const container = document.getElementById('quote-lines-container');
        container.insertAdjacentHTML('beforeend', '</div>');
    }

    setProjectContext(project, quoteNumber) {
        this.currentProject = project;
        
        // Update the project context alert
        const contextAlert = document.getElementById('project-context-alert');
        const contextInfo = document.getElementById('project-context-info');
        
        if (contextAlert && contextInfo) {
            contextInfo.textContent = `${project.number} - ${project.clientName}`;
            contextAlert.classList.remove('d-none');
        }
        
        // Pre-fill quote form with project information
        const quoteRef = document.getElementById('quote-reference');
        const customerName = document.getElementById('customer-name');
        const projectName = document.getElementById('project-name');
        
        if (quoteRef) quoteRef.value = quoteNumber;
        if (customerName) customerName.value = project.clientName;
        if (projectName) projectName.value = project.description || `${project.clientName} Project`;
        
        // Enable save button since we have a project context
        const saveBtn = document.getElementById('save-quote-btn');
        if (saveBtn) saveBtn.disabled = false;
        
        // Setup clear project context handler
        const clearBtn = document.getElementById('clear-project-context');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearProjectContext());
        }
        
        window.app.showAlert(`Quote ${quoteNumber} initialized for ${project.clientName}`, 'success');
    }
    
    clearProjectContext() {
        this.currentProject = null;
        
        // Hide the project context alert
        const contextAlert = document.getElementById('project-context-alert');
        if (contextAlert) {
            contextAlert.classList.add('d-none');
        }
        
        // Clear form fields
        const quoteRef = document.getElementById('quote-reference');
        const customerName = document.getElementById('customer-name');
        const projectName = document.getElementById('project-name');
        
        if (quoteRef) quoteRef.value = '';
        if (customerName) customerName.value = '';
        if (projectName) projectName.value = '';
        
        window.app.showAlert('Project context cleared', 'info');
    }
}

// Make QuoteBuilder globally accessible
window.QuoteBuilder = QuoteBuilder;
