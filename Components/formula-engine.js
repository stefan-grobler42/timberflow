// Formula Engine Component for Dynamic Stock Calculations
class FormulaEngine {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.formulas = [];
        this.availableVariables = {};
        this.currentFormula = null;
        
        // Note: Stock items removed - placeholder implementation
        this.init();
    }

    async init() {
        this.render();
        await this.loadFormulas();
        // Stock items loading removed - placeholder implementation
        this.setupEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <!-- Formula Management Header -->
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="fas fa-cogs"></i> Formula Engine</h5>
                            <div>
                                <button class="btn btn-outline-info btn-sm me-2" id="refresh-variables-btn">
                                    <i class="fas fa-sync-alt"></i> Refresh Variables
                                </button>
                                <button class="btn btn-primary btn-sm" id="create-formula-btn">
                                    <i class="fas fa-plus"></i> Create Formula
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle"></i>
                                <strong>Formula Engine:</strong> Create dynamic formulas that calculate stock item quantities 
                                based on Pamir design variables. Formulas support mathematical operations, conditional logic, 
                                and variable substitution for accurate material calculations.
                            </div>
                        </div>
                    </div>

                    <!-- Available Variables Panel -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="fas fa-calculator"></i> Available Variables
                                <span class="badge bg-primary ms-2" id="variables-count">0</span>
                            </h6>
                        </div>
                        <div class="card-body">
                            <div id="variables-display" class="pamir-variables">
                                <div class="text-center text-muted p-3">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    No Pamir variables loaded. Import a project to see available variables.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Formula List -->
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="fas fa-list"></i> Formulas
                                <span class="badge bg-secondary ms-2" id="formulas-count">0</span>
                            </h6>
                        </div>
                        <div class="card-body">
                            <div id="formulas-list">
                                <!-- Formulas will be displayed here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Formula Builder Modal -->
            <div class="modal fade" id="formulaBuilderModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="formulaBuilderTitle">Create Formula</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="formula-builder-form">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <div class="form-floating">
                                            <input type="text" class="form-control" id="formula-name" required>
                                            <label for="formula-name">Formula Name</label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-floating">
                                            <select class="form-select" id="formula-stock-item" required>
                                                <option value="">Select stock item...</option>
                                            </select>
                                            <label for="formula-stock-item">Stock Item</label>
                                        </div>
                                    </div>
                                </div>

                                <div class="row mb-3">
                                    <div class="col-md-12">
                                        <label class="form-label">Formula Expression</label>
                                        <div class="formula-builder">
                                            <div class="mb-2">
                                                <div class="btn-group btn-group-sm me-2" role="group">
                                                    <button type="button" class="btn btn-outline-secondary" onclick="formulaEngine.insertOperator('+')">+</button>
                                                    <button type="button" class="btn btn-outline-secondary" onclick="formulaEngine.insertOperator('-')">−</button>
                                                    <button type="button" class="btn btn-outline-secondary" onclick="formulaEngine.insertOperator('*')">×</button>
                                                    <button type="button" class="btn btn-outline-secondary" onclick="formulaEngine.insertOperator('/')">/</button>
                                                </div>
                                                <div class="btn-group btn-group-sm me-2" role="group">
                                                    <button type="button" class="btn btn-outline-secondary" onclick="formulaEngine.insertOperator('(')">(</button>
                                                    <button type="button" class="btn btn-outline-secondary" onclick="formulaEngine.insertOperator(')')">)</button>
                                                </div>
                                                <div class="btn-group btn-group-sm" role="group">
                                                    <button type="button" class="btn btn-outline-info" onclick="formulaEngine.insertFunction('ROUND')">ROUND</button>
                                                    <button type="button" class="btn btn-outline-info" onclick="formulaEngine.insertFunction('CEIL')">CEIL</button>
                                                    <button type="button" class="btn btn-outline-info" onclick="formulaEngine.insertFunction('FLOOR')">FLOOR</button>
                                                    <button type="button" class="btn btn-outline-info" onclick="formulaEngine.insertFunction('MAX')">MAX</button>
                                                    <button type="button" class="btn btn-outline-info" onclick="formulaEngine.insertFunction('MIN')">MIN</button>
                                                </div>
                                            </div>
                                            <textarea class="form-control" id="formula-expression" rows="4" 
                                                      placeholder="Enter formula expression using variables and mathematical operations..."></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Available Variables</label>
                                        <div id="variable-buttons" class="d-flex flex-wrap gap-1">
                                            <!-- Variable buttons will be generated here -->
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Formula Test</label>
                                        <div class="input-group">
                                            <button class="btn btn-outline-primary" type="button" id="test-formula-btn">
                                                <i class="fas fa-play"></i> Test
                                            </button>
                                            <input type="text" class="form-control" id="test-result" readonly 
                                                   placeholder="Result will appear here...">
                                        </div>
                                    </div>
                                </div>

                                <div class="row mb-3">
                                    <div class="col-md-12">
                                        <div class="form-floating">
                                            <textarea class="form-control" id="formula-description" style="height: 80px;"></textarea>
                                            <label for="formula-description">Description (Optional)</label>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="save-formula-btn">
                                <i class="fas fa-save"></i> Save Formula
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Formula Test Modal -->
            <div class="modal fade" id="formulaTestModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Test Formula</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div id="formula-test-content">
                                <!-- Test content will be loaded here -->
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Create formula button
        document.getElementById('create-formula-btn').addEventListener('click', () => {
            this.openFormulaBuilder();
        });

        // Refresh variables button
        document.getElementById('refresh-variables-btn').addEventListener('click', () => {
            this.refreshVariables();
        });

        // Save formula button
        document.getElementById('save-formula-btn').addEventListener('click', () => {
            this.saveFormula();
        });

        // Test formula button
        document.getElementById('test-formula-btn').addEventListener('click', () => {
            this.testFormula();
        });

        // Formula expression input
        document.getElementById('formula-expression').addEventListener('input', () => {
            this.validateFormula();
        });
    }

    async loadFormulas() {
        try {
            const response = await window.app.apiCall('/formulas');
            this.formulas = response || [];
            this.displayFormulas();
        } catch (error) {
            console.error('Failed to load formulas:', error);
            this.formulas = [];
            this.displayEmptyFormulas();
        }
    }

    // Stock items loading removed - placeholder implementation
    async loadStockItems() {
        console.warn('Stock module not available - formula engine using placeholder implementation');
        this.stockItems = [];
        this.populateStockItemSelect();
    }

    async refreshVariables() {
        try {
            const response = await window.app.apiCall('/pamir/variables/latest');
            this.availableVariables = response || {};
            this.displayVariables();
            this.generateVariableButtons();
        } catch (error) {
            console.error('Failed to refresh variables:', error);
            window.app.showAlert('Failed to refresh variables from Pamir data.', 'warning');
        }
    }

    displayVariables() {
        const container = document.getElementById('variables-display');
        const count = Object.keys(this.availableVariables).length;
        
        document.getElementById('variables-count').textContent = count;

        if (count === 0) {
            container.innerHTML = `
                <div class="text-center text-muted p-3">
                    <i class="fas fa-exclamation-triangle"></i>
                    No Pamir variables loaded. Import a project to see available variables.
                </div>
            `;
            return;
        }

        container.innerHTML = Object.entries(this.availableVariables).map(([key, value]) => `
            <div class="variable-item">
                <div class="d-flex justify-content-between align-items-center">
                    <span class="variable-name">${key}</span>
                    <span class="variable-value">${value}</span>
                </div>
            </div>
        `).join('');
    }

    generateVariableButtons() {
        const container = document.getElementById('variable-buttons');
        
        if (Object.keys(this.availableVariables).length === 0) {
            container.innerHTML = '<small class="text-muted">No variables available</small>';
            return;
        }

        container.innerHTML = Object.keys(this.availableVariables).map(key => `
            <button type="button" class="btn btn-sm btn-outline-primary formula-variable" 
                    onclick="formulaEngine.insertVariable('${key}')">
                ${key}
            </button>
        `).join('');
    }

    populateStockItemSelect() {
        const select = document.getElementById('formula-stock-item');
        
        if (select) {
            select.innerHTML = '<option value="">Stock module not available</option>';
        }
    }

    displayFormulas() {
        const container = document.getElementById('formulas-list');
        const count = this.formulas.length;
        
        document.getElementById('formulas-count').textContent = count;

        if (count === 0) {
            this.displayEmptyFormulas();
            return;
        }

        container.innerHTML = this.formulas.map(formula => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="card-title">
                                ${formula.name}
                                ${this.getFormulaStatusBadge(formula.status)}
                            </h6>
                            <p class="card-text">
                                <strong>Stock Item:</strong> ${formula.stockItemCode} - ${formula.stockItemDescription}<br>
                                <strong>Expression:</strong> <code>${formula.expression}</code>
                            </p>
                            ${formula.description ? `<p class="card-text text-muted small">${formula.description}</p>` : ''}
                            <div class="small text-muted">
                                Created: ${new Date(formula.createdDate).toLocaleDateString()} | 
                                Last Used: ${formula.lastUsed ? new Date(formula.lastUsed).toLocaleDateString() : 'Never'}
                            </div>
                        </div>
                        <div class="ms-3">
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="formulaEngine.testExistingFormula('${formula.id}')">
                                    <i class="fas fa-play"></i> Test
                                </button>
                                <button class="btn btn-outline-secondary" onclick="formulaEngine.editFormula('${formula.id}')">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-outline-success" onclick="formulaEngine.duplicateFormula('${formula.id}')">
                                    <i class="fas fa-copy"></i> Copy
                                </button>
                                <button class="btn btn-outline-danger" onclick="formulaEngine.deleteFormula('${formula.id}')">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayEmptyFormulas() {
        const container = document.getElementById('formulas-list');
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-cogs fa-3x mb-3"></i>
                <h5>No formulas created</h5>
                <p>Create your first formula to automatically calculate stock quantities based on Pamir variables.</p>
                <button class="btn btn-primary" onclick="formulaEngine.openFormulaBuilder()">
                    <i class="fas fa-plus"></i> Create First Formula
                </button>
            </div>
        `;
    }

    getFormulaStatusBadge(status) {
        switch (status) {
            case 'active':
                return '<span class="badge bg-success">Active</span>';
            case 'inactive':
                return '<span class="badge bg-secondary">Inactive</span>';
            case 'error':
                return '<span class="badge bg-danger">Error</span>';
            default:
                return '<span class="badge bg-warning">Unknown</span>';
        }
    }

    openFormulaBuilder(formula = null) {
        const modal = new bootstrap.Modal(document.getElementById('formulaBuilderModal'));
        const title = document.getElementById('formulaBuilderTitle');
        
        if (formula) {
            title.textContent = 'Edit Formula';
            this.populateFormulaForm(formula);
            this.currentFormula = formula;
        } else {
            title.textContent = 'Create Formula';
            document.getElementById('formula-builder-form').reset();
            this.currentFormula = null;
        }
        
        this.generateVariableButtons();
        modal.show();
    }

    populateFormulaForm(formula) {
        document.getElementById('formula-name').value = formula.name || '';
        document.getElementById('formula-stock-item').value = formula.stockItemId || '';
        document.getElementById('formula-expression').value = formula.expression || '';
        document.getElementById('formula-description').value = formula.description || '';
    }

    insertVariable(variableName) {
        const expressionInput = document.getElementById('formula-expression');
        const currentValue = expressionInput.value;
        const cursorPosition = expressionInput.selectionStart;
        
        const newValue = currentValue.slice(0, cursorPosition) + 
                        `{${variableName}}` + 
                        currentValue.slice(cursorPosition);
        
        expressionInput.value = newValue;
        expressionInput.focus();
        
        // Position cursor after inserted variable
        const newPosition = cursorPosition + variableName.length + 2;
        expressionInput.setSelectionRange(newPosition, newPosition);
        
        this.validateFormula();
    }

    insertOperator(operator) {
        const expressionInput = document.getElementById('formula-expression');
        const currentValue = expressionInput.value;
        const cursorPosition = expressionInput.selectionStart;
        
        const newValue = currentValue.slice(0, cursorPosition) + 
                        ` ${operator} ` + 
                        currentValue.slice(cursorPosition);
        
        expressionInput.value = newValue;
        expressionInput.focus();
        
        // Position cursor after inserted operator
        const newPosition = cursorPosition + operator.length + 2;
        expressionInput.setSelectionRange(newPosition, newPosition);
        
        this.validateFormula();
    }

    insertFunction(functionName) {
        const expressionInput = document.getElementById('formula-expression');
        const currentValue = expressionInput.value;
        const cursorPosition = expressionInput.selectionStart;
        
        const newValue = currentValue.slice(0, cursorPosition) + 
                        `${functionName}()` + 
                        currentValue.slice(cursorPosition);
        
        expressionInput.value = newValue;
        expressionInput.focus();
        
        // Position cursor inside function parentheses
        const newPosition = cursorPosition + functionName.length + 1;
        expressionInput.setSelectionRange(newPosition, newPosition);
        
        this.validateFormula();
    }

    validateFormula() {
        const expression = document.getElementById('formula-expression').value;
        const testResult = document.getElementById('test-result');
        
        if (!expression.trim()) {
            testResult.value = '';
            return;
        }

        try {
            const calculator = new FormulaCalculator();
            const result = calculator.validate(expression, this.availableVariables);
            
            if (result.isValid) {
                testResult.value = 'Formula syntax is valid';
                testResult.className = 'form-control text-success';
            } else {
                testResult.value = `Error: ${result.error}`;
                testResult.className = 'form-control text-danger';
            }
        } catch (error) {
            testResult.value = `Error: ${error.message}`;
            testResult.className = 'form-control text-danger';
        }
    }

    testFormula() {
        const expression = document.getElementById('formula-expression').value;
        
        if (!expression.trim()) {
            window.app.showAlert('Please enter a formula expression to test.', 'warning');
            return;
        }

        try {
            const calculator = new FormulaCalculator();
            const result = calculator.evaluate(expression, this.availableVariables);
            
            document.getElementById('test-result').value = `Result: ${result}`;
            document.getElementById('test-result').className = 'form-control text-success';
            
        } catch (error) {
            document.getElementById('test-result').value = `Error: ${error.message}`;
            document.getElementById('test-result').className = 'form-control text-danger';
        }
    }

    async saveFormula() {
        try {
            const formulaData = {
                id: this.currentFormula?.id,
                name: document.getElementById('formula-name').value,
                stockItemId: document.getElementById('formula-stock-item').value,
                expression: document.getElementById('formula-expression').value,
                description: document.getElementById('formula-description').value,
                status: 'active'
            };

            if (!formulaData.name || !formulaData.stockItemId || !formulaData.expression) {
                window.app.showAlert('Please fill in all required fields.', 'warning');
                return;
            }

            window.app.showLoading(true);
            
            const endpoint = this.currentFormula ? `/formulas/${this.currentFormula.id}` : '/formulas';
            const method = this.currentFormula ? 'PUT' : 'POST';
            
            const response = await window.app.apiCall(endpoint, {
                method: method,
                body: JSON.stringify(formulaData)
            });

            bootstrap.Modal.getInstance(document.getElementById('formulaBuilderModal')).hide();
            window.app.showAlert('Formula saved successfully!', 'success');
            
            await this.loadFormulas();
            
        } catch (error) {
            console.error('Failed to save formula:', error);
            window.app.showAlert('Failed to save formula. Please try again.', 'danger');
        } finally {
            window.app.showLoading(false);
        }
    }

    async testExistingFormula(formulaId) {
        try {
            const formula = this.formulas.find(f => f.id === formulaId);
            if (!formula) return;

            const calculator = new FormulaCalculator();
            const result = calculator.evaluate(formula.expression, this.availableVariables);
            
            const modal = new bootstrap.Modal(document.getElementById('formulaTestModal'));
            const content = document.getElementById('formula-test-content');
            
            content.innerHTML = `
                <div class="row">
                    <div class="col-md-12">
                        <h6>Formula: ${formula.name}</h6>
                        <p><strong>Expression:</strong> <code>${formula.expression}</code></p>
                        <p><strong>Stock Item:</strong> ${formula.stockItemCode} - ${formula.stockItemDescription}</p>
                        <hr>
                        <div class="alert alert-success">
                            <h5><i class="fas fa-calculator"></i> Test Result</h5>
                            <p class="mb-0"><strong>Calculated Quantity:</strong> ${result}</p>
                        </div>
                        <h6>Variable Values Used:</h6>
                        <div class="pamir-variables">
                            ${Object.entries(this.availableVariables).map(([key, value]) => `
                                <div class="variable-item">
                                    <span class="variable-name">${key}</span>
                                    <span class="variable-value">${value}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            modal.show();
            
        } catch (error) {
            console.error('Formula test failed:', error);
            window.app.showAlert(`Formula test failed: ${error.message}`, 'danger');
        }
    }

    editFormula(formulaId) {
        const formula = this.formulas.find(f => f.id === formulaId);
        if (formula) {
            this.openFormulaBuilder(formula);
        }
    }

    async duplicateFormula(formulaId) {
        const formula = this.formulas.find(f => f.id === formulaId);
        if (!formula) return;

        const duplicatedFormula = {
            ...formula,
            id: null,
            name: `${formula.name} (Copy)`,
            createdDate: new Date().toISOString(),
            lastUsed: null
        };

        this.openFormulaBuilder(duplicatedFormula);
    }

    async deleteFormula(formulaId) {
        if (!confirm('Are you sure you want to delete this formula? This action cannot be undone.')) {
            return;
        }

        try {
            window.app.showLoading(true);
            await window.app.apiCall(`/formulas/${formulaId}`, { method: 'DELETE' });
            window.app.showAlert('Formula deleted successfully!', 'success');
            await this.loadFormulas();
        } catch (error) {
            console.error('Failed to delete formula:', error);
            window.app.showAlert('Failed to delete formula. Please try again.', 'danger');
        } finally {
            window.app.showLoading(false);
        }
    }
}

// Make FormulaEngine globally accessible
window.FormulaEngine = FormulaEngine;
