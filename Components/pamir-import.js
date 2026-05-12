// Pamir Data Import Component
class PamirImport {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.importHistory = [];
        this.currentImport = null;
        this.extractedVariables = {};
        
        this.init();
    }

    async init() {
        this.render();
        await this.loadImportHistory();
        this.setupEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <!-- Import Control Panel -->
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="fas fa-file-import"></i> Import Pamir Data</h5>
                            <div>
                                <button class="btn btn-outline-info btn-sm me-2" id="view-history-btn">
                                    <i class="fas fa-history"></i> View History
                                </button>
                                <button class="btn btn-primary btn-sm" id="new-import-btn">
                                    <i class="fas fa-plus"></i> New Import
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle"></i>
                                <strong>Supported Formats:</strong> Excel files (.xlsx, .xls) and JSON files (.json) 
                                exported from Mitek Pamir. The system will automatically extract design variables, 
                                material quantities, and project parameters for use in quotations.
                            </div>
                            
                            <!-- File Upload Area -->
                            <div class="file-drop-zone" id="pamir-file-drop">
                                <i class="fas fa-cloud-upload-alt fa-3x text-primary mb-3"></i>
                                <h5>Drop Pamir export files here</h5>
                                <p class="text-muted mb-3">or click to browse for files</p>
                                <button class="btn btn-outline-primary" id="browse-files-btn">
                                    <i class="fas fa-folder-open"></i> Browse Files
                                </button>
                                <input type="file" id="pamir-file-input" multiple 
                                       accept=".xlsx,.xls,.json" style="display: none;">
                            </div>

                            <!-- Import Progress -->
                            <div id="import-progress-section" style="display: none;">
                                <hr>
                                <h6><i class="fas fa-cogs"></i> Processing Import</h6>
                                <div class="progress mb-2">
                                    <div class="progress-bar progress-bar-striped progress-bar-animated" 
                                         id="import-progress-bar" role="progressbar" style="width: 0%"></div>
                                </div>
                                <div id="import-status-text" class="text-muted small">
                                    Initializing import...
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Current Import Results -->
                    <div id="current-import-results" style="display: none;">
                        <div class="card mb-4">
                            <div class="card-header">
                                <h6 class="mb-0">
                                    <i class="fas fa-check-circle text-success"></i> Import Results
                                    <button class="btn btn-outline-success btn-sm float-end" id="apply-import-btn">
                                        <i class="fas fa-check"></i> Apply to System
                                    </button>
                                </h6>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6>Project Information</h6>
                                        <div id="project-info-display">
                                            <!-- Project info will be displayed here -->
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <h6>Import Statistics</h6>
                                        <div id="import-stats-display">
                                            <!-- Import statistics will be displayed here -->
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Extracted Variables -->
                        <div class="card mb-4">
                            <div class="card-header">
                                <h6 class="mb-0">
                                    <i class="fas fa-calculator"></i> Extracted Variables
                                    <small class="text-muted">(<span id="variables-count">0</span> variables found)</small>
                                </h6>
                            </div>
                            <div class="card-body">
                                <div id="extracted-variables-display" class="pamir-variables">
                                    <!-- Variables will be displayed here -->
                                </div>
                            </div>
                        </div>

                        <!-- Material Data -->
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">
                                    <i class="fas fa-boxes"></i> Material Data
                                    <small class="text-muted">(<span id="materials-count">0</span> items found)</small>
                                </h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Material Code</th>
                                                <th>Description</th>
                                                <th>Quantity</th>
                                                <th>Unit</th>
                                                <th>Length</th>
                                                <th>Grade</th>
                                                <th>Stock Match</th>
                                            </tr>
                                        </thead>
                                        <tbody id="materials-table-body">
                                            <!-- Material data will be displayed here -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Import History -->
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="fas fa-history"></i> Recent Imports
                                <small class="text-muted">(<span id="history-count">0</span> imports)</small>
                            </h6>
                        </div>
                        <div class="card-body">
                            <div id="import-history-display">
                                <!-- Import history will be displayed here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Import Details Modal -->
            <div class="modal fade" id="importDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="importDetailsModalTitle">Import Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div id="import-details-content">
                                <!-- Detailed import information will be shown here -->
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" id="reapply-import-btn">
                                <i class="fas fa-redo"></i> Re-apply Import
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // File drop zone interactions
        const dropZone = document.getElementById('pamir-file-drop');
        const fileInput = document.getElementById('pamir-file-input');
        const browseBtn = document.getElementById('browse-files-btn');

        browseBtn.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('click', () => fileInput.click());

        // Drag and drop handlers
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            this.handleFileSelection(files);
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFileSelection(files);
        });

        // Apply import button
        document.getElementById('apply-import-btn').addEventListener('click', () => {
            this.applyImportToSystem();
        });

        // New import button
        document.getElementById('new-import-btn').addEventListener('click', () => {
            this.resetImportInterface();
        });

        // View history button
        document.getElementById('view-history-btn').addEventListener('click', () => {
            this.loadImportHistory();
        });
    }

    async handleFileSelection(files) {
        if (files.length === 0) return;

        // Validate file types
        const validFiles = files.filter(file => {
            return file.name.match(/\.(xlsx|xls|json)$/i);
        });

        if (validFiles.length !== files.length) {
            window.app.showAlert('Some files were ignored. Only Excel (.xlsx, .xls) and JSON (.json) files are supported.', 'warning');
        }

        if (validFiles.length === 0) {
            window.app.showAlert('No valid files selected. Please choose Excel or JSON files exported from Mitek Pamir.', 'warning');
            return;
        }

        await this.processFiles(validFiles);
    }

    async processFiles(files) {
        try {
            this.showProgressSection(true);
            this.updateProgress(10, 'Preparing files for processing...');

            const formData = new FormData();
            files.forEach((file, index) => {
                formData.append(`file${index}`, file);
            });
            formData.append('fileCount', files.length.toString());

            this.updateProgress(30, 'Uploading files...');

            const response = await fetch(`${window.app.apiBaseUrl}/pamir/import`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Import failed: ${response.status} ${response.statusText}`);
            }

            this.updateProgress(60, 'Processing Pamir data...');

            const result = await response.json();
            
            this.updateProgress(80, 'Extracting variables and materials...');

            await this.processImportResult(result);

            this.updateProgress(100, 'Import completed successfully!');

            setTimeout(() => {
                this.showProgressSection(false);
                this.showImportResults(true);
            }, 1000);

        } catch (error) {
            console.error('Import processing failed:', error);
            this.showProgressSection(false);
            window.app.showAlert(`Import failed: ${error.message}`, 'danger');
        }
    }

    async processImportResult(result) {
        this.currentImport = result;
        this.extractedVariables = result.variables || {};

        // Display project information
        this.displayProjectInfo(result.projectInfo || {});
        
        // Display import statistics
        this.displayImportStats(result.statistics || {});
        
        // Display extracted variables
        this.displayExtractedVariables(this.extractedVariables);
        
        // Display material data
        this.displayMaterialData(result.materials || []);
    }

    displayProjectInfo(projectInfo) {
        const container = document.getElementById('project-info-display');
        container.innerHTML = `
            <div class="row">
                <div class="col-6"><strong>Project Name:</strong></div>
                <div class="col-6">${projectInfo.name || 'Not specified'}</div>
                <div class="col-6"><strong>Version:</strong></div>
                <div class="col-6">${projectInfo.version || 'Not specified'}</div>
                <div class="col-6"><strong>Date Created:</strong></div>
                <div class="col-6">${projectInfo.dateCreated || 'Not specified'}</div>
                <div class="col-6"><strong>Revision:</strong></div>
                <div class="col-6">${projectInfo.revision || 'A'}</div>
            </div>
        `;
    }

    displayImportStats(stats) {
        const container = document.getElementById('import-stats-display');
        container.innerHTML = `
            <div class="row">
                <div class="col-6"><strong>Files Processed:</strong></div>
                <div class="col-6">${stats.filesProcessed || 0}</div>
                <div class="col-6"><strong>Variables Found:</strong></div>
                <div class="col-6">${stats.variablesFound || 0}</div>
                <div class="col-6"><strong>Materials Found:</strong></div>
                <div class="col-6">${stats.materialsFound || 0}</div>
                <div class="col-6"><strong>Processing Time:</strong></div>
                <div class="col-6">${stats.processingTime || 'N/A'}</div>
            </div>
        `;
    }

    displayExtractedVariables(variables) {
        const container = document.getElementById('extracted-variables-display');
        const count = Object.keys(variables).length;
        
        document.getElementById('variables-count').textContent = count;

        if (count === 0) {
            container.innerHTML = `
                <div class="text-center text-muted p-3">
                    <i class="fas fa-exclamation-triangle"></i>
                    No variables found in the imported files.
                </div>
            `;
            return;
        }

        container.innerHTML = Object.entries(variables).map(([key, value]) => `
            <div class="variable-item">
                <div class="d-flex justify-content-between align-items-center">
                    <span class="variable-name">${key}</span>
                    <div>
                        <span class="variable-value me-2">${value}</span>
                        <button class="btn btn-sm btn-outline-primary" 
                                onclick="pamirImport.editVariable('${key}', '${value}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayMaterialData(materials) {
        const tbody = document.getElementById('materials-table-body');
        const count = materials.length;
        
        document.getElementById('materials-count').textContent = count;

        if (count === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-3">
                        No material data found in the imported files.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = materials.map(material => `
            <tr>
                <td><strong>${material.code || 'N/A'}</strong></td>
                <td>${material.description || 'No description'}</td>
                <td>${material.quantity || 0}</td>
                <td>${material.unit || 'EA'}</td>
                <td>${material.length || 'N/A'}</td>
                <td>${material.grade || 'N/A'}</td>
                <td>${this.getStockMatchBadge(material.stockMatch)}</td>
            </tr>
        `).join('');
    }

    getStockMatchBadge(matchStatus) {
        switch (matchStatus) {
            case 'exact':
                return '<span class="badge bg-success">Exact Match</span>';
            case 'partial':
                return '<span class="badge bg-warning">Partial Match</span>';
            case 'none':
                return '<span class="badge bg-danger">No Match</span>';
            default:
                return '<span class="badge bg-secondary">Unknown</span>';
        }
    }

    editVariable(key, currentValue) {
        const newValue = prompt(`Edit variable "${key}":`, currentValue);
        if (newValue !== null && newValue !== currentValue) {
            this.extractedVariables[key] = newValue;
            this.displayExtractedVariables(this.extractedVariables);
            window.app.showAlert(`Variable "${key}" updated successfully.`, 'success');
        }
    }

    async applyImportToSystem() {
        if (!this.currentImport) {
            window.app.showAlert('No import data to apply.', 'warning');
            return;
        }

        try {
            window.app.showLoading(true);

            const applyData = {
                importId: this.currentImport.id,
                variables: this.extractedVariables,
                materials: this.currentImport.materials,
                projectInfo: this.currentImport.projectInfo,
                applyToQuotes: true,
                updateStock: true
            };

            const response = await window.app.apiCall('/pamir/apply', {
                method: 'POST',
                body: JSON.stringify(applyData)
            });

            window.app.showAlert('Import data applied to system successfully!', 'success');
            
            // Refresh import history
            await this.loadImportHistory();
            
            // Reset the interface
            this.resetImportInterface();

        } catch (error) {
            console.error('Failed to apply import to system:', error);
            window.app.showAlert('Failed to apply import data to system. Please try again.', 'danger');
        } finally {
            window.app.showLoading(false);
        }
    }

    async loadImportHistory() {
        try {
            const response = await window.app.apiCall('/pamir/imports/history');
            this.importHistory = response || [];
            this.displayImportHistory();
        } catch (error) {
            console.error('Failed to load import history:', error);
            this.displayEmptyHistory();
        }
    }

    displayImportHistory() {
        const container = document.getElementById('import-history-display');
        const count = this.importHistory.length;
        
        document.getElementById('history-count').textContent = count;

        if (count === 0) {
            this.displayEmptyHistory();
            return;
        }

        container.innerHTML = this.importHistory.map(import_ => `
            <div class="card mb-2">
                <div class="card-body py-2">
                    <div class="row align-items-center">
                        <div class="col-md-3">
                            <strong>${import_.projectName || 'Unnamed Project'}</strong>
                            <br><small class="text-muted">Rev: ${import_.revision || 'A'}</small>
                        </div>
                        <div class="col-md-2">
                            <small class="text-muted">
                                ${new Date(import_.importDate).toLocaleDateString()}
                            </small>
                        </div>
                        <div class="col-md-2">
                            <span class="badge bg-info">${import_.variableCount || 0} vars</span>
                            <span class="badge bg-secondary">${import_.materialCount || 0} materials</span>
                        </div>
                        <div class="col-md-3">
                            <div class="small text-muted">
                                Status: ${this.getImportStatusBadge(import_.status)}
                            </div>
                        </div>
                        <div class="col-md-2 text-end">
                            <button class="btn btn-outline-primary btn-sm" 
                                    onclick="pamirImport.viewImportDetails('${import_.id}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayEmptyHistory() {
        const container = document.getElementById('import-history-display');
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-history fa-2x mb-3"></i>
                <h6>No import history</h6>
                <p>Your Pamir import history will appear here after your first import.</p>
            </div>
        `;
    }

    getImportStatusBadge(status) {
        switch (status) {
            case 'applied':
                return '<span class="badge bg-success">Applied</span>';
            case 'pending':
                return '<span class="badge bg-warning">Pending</span>';
            case 'failed':
                return '<span class="badge bg-danger">Failed</span>';
            default:
                return '<span class="badge bg-secondary">Unknown</span>';
        }
    }

    async viewImportDetails(importId) {
        try {
            const importData = await window.app.apiCall(`/pamir/imports/${importId}`);
            this.showImportDetailsModal(importData);
        } catch (error) {
            console.error('Failed to load import details:', error);
            window.app.showAlert('Failed to load import details.', 'danger');
        }
    }

    showImportDetailsModal(importData) {
        const modal = new bootstrap.Modal(document.getElementById('importDetailsModal'));
        const title = document.getElementById('importDetailsModalTitle');
        const content = document.getElementById('import-details-content');

        title.textContent = `Import Details - ${importData.projectName || 'Unnamed Project'}`;
        
        content.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Project Information</h6>
                    <table class="table table-sm">
                        <tr><td><strong>Project Name:</strong></td><td>${importData.projectName || 'N/A'}</td></tr>
                        <tr><td><strong>Version:</strong></td><td>${importData.version || 'N/A'}</td></tr>
                        <tr><td><strong>Revision:</strong></td><td>${importData.revision || 'A'}</td></tr>
                        <tr><td><strong>Import Date:</strong></td><td>${new Date(importData.importDate).toLocaleString()}</td></tr>
                        <tr><td><strong>Status:</strong></td><td>${this.getImportStatusBadge(importData.status)}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>Statistics</h6>
                    <table class="table table-sm">
                        <tr><td><strong>Files Processed:</strong></td><td>${importData.filesProcessed || 0}</td></tr>
                        <tr><td><strong>Variables Found:</strong></td><td>${importData.variableCount || 0}</td></tr>
                        <tr><td><strong>Materials Found:</strong></td><td>${importData.materialCount || 0}</td></tr>
                        <tr><td><strong>Processing Time:</strong></td><td>${importData.processingTime || 'N/A'}</td></tr>
                    </table>
                </div>
            </div>
            <hr>
            <h6>Variables (${importData.variableCount || 0})</h6>
            <div class="pamir-variables mb-3" style="max-height: 200px; overflow-y: auto;">
                ${Object.entries(importData.variables || {}).map(([key, value]) => `
                    <div class="variable-item">
                        <span class="variable-name">${key}</span>
                        <span class="variable-value">${value}</span>
                    </div>
                `).join('')}
            </div>
            <h6>Materials (${importData.materialCount || 0})</h6>
            <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit</th>
                            <th>Stock Match</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(importData.materials || []).map(material => `
                            <tr>
                                <td>${material.code || 'N/A'}</td>
                                <td>${material.description || 'N/A'}</td>
                                <td>${material.quantity || 0}</td>
                                <td>${material.unit || 'EA'}</td>
                                <td>${this.getStockMatchBadge(material.stockMatch)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        modal.show();
    }

    showProgressSection(show) {
        document.getElementById('import-progress-section').style.display = show ? 'block' : 'none';
    }

    updateProgress(percentage, statusText) {
        const progressBar = document.getElementById('import-progress-bar');
        const statusElement = document.getElementById('import-status-text');
        
        progressBar.style.width = `${percentage}%`;
        statusElement.textContent = statusText;
    }

    showImportResults(show) {
        document.getElementById('current-import-results').style.display = show ? 'block' : 'none';
    }

    resetImportInterface() {
        this.showImportResults(false);
        this.showProgressSection(false);
        this.currentImport = null;
        this.extractedVariables = {};
        document.getElementById('pamir-file-input').value = '';
    }
}

// Make PamirImport globally accessible
window.PamirImport = PamirImport;
