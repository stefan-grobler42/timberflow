// Universal Audit System - System-wide audit trails for all modules
class UniversalAuditSystem {
    constructor() {
        this.auditEntries = [];
        this.storageKey = 'millennium_universal_audit';
        this.maxEntries = 5000; // Increased capacity for system-wide use
        this.loadFromStorage();
        this.setupGlobalInterception();
    }
    
    // Setup global interception for automatic audit tracking
    setupGlobalInterception() {
        // Intercept form submissions
        document.addEventListener('submit', (e) => {
            this.handleFormSubmission(e);
        });
        
        // Intercept button clicks that might trigger operations
        document.addEventListener('click', (e) => {
            this.handleButtonClick(e);
        });
        
        // Monitor localStorage changes for data operations
        this.interceptStorageOperations();
    }
    
    handleFormSubmission(event) {
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Determine module from form or container
        const module = this.detectModule(form);
        const recordType = this.detectRecordType(form);
        
        this.recordEvent({
            module,
            recordType,
            recordId: data.id || 'new',
            action: data.id ? 'UPDATE' : 'CREATE',
            changes: data,
            metadata: {
                formId: form.id,
                automated: true,
                source: 'form_submission'
            }
        });
    }
    
    handleButtonClick(event) {
        const button = event.target.closest('button');
        if (!button) return;
        
        // Track delete operations
        if (button.classList.contains('delete-btn') || button.innerHTML.includes('trash')) {
            const recordId = button.dataset.id || this.extractIdFromContext(button);
            const module = this.detectModule(button);
            const recordType = this.detectRecordType(button);
            
            if (recordId) {
                this.recordEvent({
                    module,
                    recordType,
                    recordId,
                    action: 'DELETE',
                    changes: { deletedAt: new Date().toISOString() },
                    metadata: {
                        buttonText: button.textContent,
                        automated: true,
                        source: 'button_click'
                    }
                });
            }
        }
        
        // Track import/export operations
        if (button.innerHTML.includes('import') || button.innerHTML.includes('export')) {
            const module = this.detectModule(button);
            const action = button.innerHTML.includes('import') ? 'IMPORT' : 'EXPORT';
            
            this.recordEvent({
                module,
                recordType: 'bulk_operation',
                recordId: null,
                action,
                changes: {},
                metadata: {
                    buttonText: button.textContent,
                    automated: true,
                    source: 'bulk_operation'
                }
            });
        }
    }
    
    interceptStorageOperations() {
        const originalSetItem = localStorage.setItem;
        const originalRemoveItem = localStorage.removeItem;
        
        localStorage.setItem = (key, value) => {
            if (key.startsWith('millennium_') && key !== this.storageKey) {
                this.recordEvent({
                    module: 'system',
                    recordType: 'storage',
                    recordId: key,
                    action: 'UPDATE',
                    changes: { key, value: value.substring(0, 100) + (value.length > 100 ? '...' : '') },
                    metadata: {
                        automated: true,
                        source: 'storage_operation'
                    }
                });
            }
            return originalSetItem.call(this, key, value);
        };
        
        localStorage.removeItem = (key) => {
            if (key.startsWith('millennium_') && key !== this.storageKey) {
                this.recordEvent({
                    module: 'system',
                    recordType: 'storage',
                    recordId: key,
                    action: 'DELETE',
                    changes: { key },
                    metadata: {
                        automated: true,
                        source: 'storage_operation'
                    }
                });
            }
            return originalRemoveItem.call(this, key);
        };
    }
    
    detectModule(element) {
        // Look for module indicators in classes, IDs, or container hierarchy
        const container = element.closest('[class*="manager"], [class*="module"], [id*="content"]');
        
        if (container) {
            const className = container.className.toLowerCase();
            const id = container.id.toLowerCase();
            
            if (className.includes('customer') || id.includes('customer')) return 'customer';
            if (className.includes('stock') || id.includes('stock')) return 'stock';
            if (className.includes('project') || id.includes('project')) return 'project';
            if (className.includes('quote') || id.includes('quote')) return 'quote';
            if (className.includes('pamir') || id.includes('pamir')) return 'pamir';
            if (className.includes('formula') || id.includes('formula')) return 'formula';
        }
        
        // Fallback to URL or current tab
        const activeTab = document.querySelector('.nav-link.active');
        if (activeTab) {
            const tabText = activeTab.textContent.toLowerCase();
            if (tabText.includes('customer')) return 'customer';
            if (tabText.includes('stock')) return 'stock';
            if (tabText.includes('project')) return 'project';
            if (tabText.includes('quote')) return 'quote';
        }
        
        return 'unknown';
    }
    
    detectRecordType(element) {
        const module = this.detectModule(element);
        
        // Standard record types by module
        const recordTypeMap = {
            customer: 'customer',
            stock: 'stock_item',
            project: 'project',
            quote: 'quote',
            pamir: 'import',
            formula: 'formula'
        };
        
        return recordTypeMap[module] || 'record';
    }
    
    extractIdFromContext(element) {
        // Look for ID in various attributes and contexts
        if (element.dataset.id) return element.dataset.id;
        
        const row = element.closest('tr');
        if (row && row.dataset.id) return row.dataset.id;
        
        const container = element.closest('[data-id]');
        if (container) return container.dataset.id;
        
        // Look in nearby elements
        const idInput = element.closest('form')?.querySelector('input[name="id"], input[id$="Id"]');
        if (idInput) return idInput.value;
        
        return null;
    }
    
    // Main event recording method
    recordEvent(config) {
        const entry = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            module: config.module || 'unknown',
            recordType: config.recordType || 'unknown',
            recordId: config.recordId,
            action: config.action, // CREATE, READ, UPDATE, DELETE, IMPORT, EXPORT
            changes: config.changes || {},
            user: this.getCurrentUser(),
            sessionId: this.getSessionId(),
            userAgent: navigator.userAgent.substring(0, 100),
            url: window.location.href,
            metadata: {
                ...config.metadata,
                timestamp: new Date().toISOString(),
                component: config.component || 'UniversalAuditSystem'
            }
        };
        
        this.auditEntries.push(entry);
        this.saveToStorage();
        
        // Emit event for other components to listen
        document.dispatchEvent(new CustomEvent('auditEvent', { detail: entry }));
        
        console.log('Universal audit event recorded:', entry);
        return entry;
    }
    
    // Query methods
    getModuleAuditTrail(module, limit = 100) {
        return this.auditEntries
            .filter(entry => entry.module === module)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }
    
    getRecordAuditTrail(module, recordType, recordId) {
        return this.auditEntries
            .filter(entry => 
                entry.module === module && 
                entry.recordType === recordType && 
                entry.recordId == recordId
            )
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    getSystemWideAuditTrail(limit = 500) {
        return this.auditEntries
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }
    
    searchAuditTrail(searchTerm, filters = {}) {
        let results = this.auditEntries;
        
        // Apply filters
        if (filters.module) {
            results = results.filter(entry => entry.module === filters.module);
        }
        if (filters.action) {
            results = results.filter(entry => entry.action === filters.action);
        }
        if (filters.user) {
            results = results.filter(entry => entry.user === filters.user);
        }
        if (filters.dateFrom) {
            results = results.filter(entry => new Date(entry.timestamp) >= new Date(filters.dateFrom));
        }
        if (filters.dateTo) {
            results = results.filter(entry => new Date(entry.timestamp) <= new Date(filters.dateTo));
        }
        if (filters.recordType) {
            results = results.filter(entry => entry.recordType === filters.recordType);
        }
        
        // Apply search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(entry => 
                entry.action.toLowerCase().includes(term) ||
                entry.user.toLowerCase().includes(term) ||
                entry.module.toLowerCase().includes(term) ||
                JSON.stringify(entry.changes).toLowerCase().includes(term) ||
                JSON.stringify(entry.metadata).toLowerCase().includes(term)
            );
        }
        
        return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    // Audit viewer creation
    createUniversalAuditViewer(containerId, config = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const filters = config.filters || {};
        const data = this.searchAuditTrail('', filters);
        
        container.innerHTML = `
            <div class="universal-audit-viewer">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5><i class="fas fa-shield-alt me-2 text-primary"></i>Universal Audit Trail</h5>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="universalAuditSystem.exportAuditTrail('csv')">
                            <i class="fas fa-download me-1"></i>CSV
                        </button>
                        <button class="btn btn-outline-success" onclick="universalAuditSystem.exportAuditTrail('json')">
                            <i class="fas fa-download me-1"></i>JSON
                        </button>
                        <button class="btn btn-outline-danger" onclick="universalAuditSystem.showCleanupOptions()">
                            <i class="fas fa-broom me-1"></i>Cleanup
                        </button>
                    </div>
                </div>
                
                <div class="audit-filters mb-3">
                    <div class="row g-2">
                        <div class="col-md-2">
                            <input type="text" class="form-control form-control-sm" id="universal-audit-search" placeholder="Search...">
                        </div>
                        <div class="col-md-2">
                            <select class="form-select form-select-sm" id="universal-audit-module-filter">
                                <option value="">All Modules</option>
                                <option value="customer">Customer</option>
                                <option value="stock">Stock</option>
                                <option value="project">Project</option>
                                <option value="quote">Quote</option>
                                <option value="pamir">Pamir</option>
                                <option value="formula">Formula</option>
                                <option value="system">System</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <select class="form-select form-select-sm" id="universal-audit-action-filter">
                                <option value="">All Actions</option>
                                <option value="CREATE">Create</option>
                                <option value="READ">Read</option>
                                <option value="UPDATE">Update</option>
                                <option value="DELETE">Delete</option>
                                <option value="IMPORT">Import</option>
                                <option value="EXPORT">Export</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <input type="date" class="form-control form-control-sm" id="universal-audit-date-from">
                        </div>
                        <div class="col-md-2">
                            <input type="date" class="form-control form-control-sm" id="universal-audit-date-to">
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-primary btn-sm w-100" onclick="universalAuditSystem.refreshAuditViewer('${containerId}')">
                                <i class="fas fa-search"></i> Filter
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="audit-stats mb-3">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="card bg-primary text-white">
                                <div class="card-body text-center p-2">
                                    <h6 class="mb-1">${this.getActionCount('CREATE')}</h6>
                                    <small>Creates</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-warning text-white">
                                <div class="card-body text-center p-2">
                                    <h6 class="mb-1">${this.getActionCount('UPDATE')}</h6>
                                    <small>Updates</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-danger text-white">
                                <div class="card-body text-center p-2">
                                    <h6 class="mb-1">${this.getActionCount('DELETE')}</h6>
                                    <small>Deletes</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-success text-white">
                                <div class="card-body text-center p-2">
                                    <h6 class="mb-1">${this.auditEntries.length}</h6>
                                    <small>Total Events</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="audit-results">
                    <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
                        <table class="table table-sm table-striped">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    <th width="120">Timestamp</th>
                                    <th width="80">Module</th>
                                    <th width="70">Action</th>
                                    <th width="100">Record</th>
                                    <th width="80">User</th>
                                    <th>Changes</th>
                                    <th width="60">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map(entry => `
                                    <tr>
                                        <td>
                                            <small title="${entry.timestamp}">
                                                ${this.formatTimestamp(entry.timestamp)}
                                            </small>
                                        </td>
                                        <td>
                                            <span class="badge ${this.getModuleBadgeClass(entry.module)}">${entry.module}</span>
                                        </td>
                                        <td>
                                            <span class="badge ${this.getActionBadgeClass(entry.action)}">${entry.action}</span>
                                        </td>
                                        <td>
                                            <small>${entry.recordType}#${entry.recordId}</small>
                                        </td>
                                        <td>
                                            <small>${entry.user}</small>
                                        </td>
                                        <td>
                                            <small>${this.formatChanges(entry.changes)}</small>
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-info" onclick="universalAuditSystem.showAuditDetails('${entry.id}')">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">
                            Showing ${data.length} of ${this.auditEntries.length} audit entries
                        </small>
                    </div>
                </div>
            </div>
        `;
    }
    
    getActionCount(action) {
        return this.auditEntries.filter(entry => entry.action === action).length;
    }
    
    getModuleBadgeClass(module) {
        const classes = {
            customer: 'bg-info',
            stock: 'bg-warning',
            project: 'bg-primary',
            quote: 'bg-success',
            pamir: 'bg-secondary',
            formula: 'bg-dark',
            system: 'bg-danger',
            unknown: 'bg-light text-dark'
        };
        return classes[module] || 'bg-secondary';
    }
    
    getActionBadgeClass(action) {
        const classes = {
            CREATE: 'bg-success',
            READ: 'bg-info',
            UPDATE: 'bg-warning',
            DELETE: 'bg-danger',
            IMPORT: 'bg-primary',
            EXPORT: 'bg-secondary'
        };
        return classes[action] || 'bg-secondary';
    }
    
    refreshAuditViewer(containerId) {
        const searchTerm = document.getElementById('universal-audit-search')?.value || '';
        const filters = {
            module: document.getElementById('universal-audit-module-filter')?.value || '',
            action: document.getElementById('universal-audit-action-filter')?.value || '',
            dateFrom: document.getElementById('universal-audit-date-from')?.value || '',
            dateTo: document.getElementById('universal-audit-date-to')?.value || ''
        };
        
        // Remove empty filters
        Object.keys(filters).forEach(key => {
            if (!filters[key]) delete filters[key];
        });
        
        this.createUniversalAuditViewer(containerId, { filters });
    }
    
    showAuditDetails(entryId) {
        const entry = this.auditEntries.find(e => e.id === entryId);
        if (!entry) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Audit Entry Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <dl class="row">
                            <dt class="col-sm-3">Timestamp:</dt>
                            <dd class="col-sm-9">${this.formatTimestamp(entry.timestamp)}</dd>
                            
                            <dt class="col-sm-3">Module:</dt>
                            <dd class="col-sm-9"><span class="badge ${this.getModuleBadgeClass(entry.module)}">${entry.module}</span></dd>
                            
                            <dt class="col-sm-3">Action:</dt>
                            <dd class="col-sm-9"><span class="badge ${this.getActionBadgeClass(entry.action)}">${entry.action}</span></dd>
                            
                            <dt class="col-sm-3">Record:</dt>
                            <dd class="col-sm-9">${entry.recordType}#${entry.recordId}</dd>
                            
                            <dt class="col-sm-3">User:</dt>
                            <dd class="col-sm-9">${entry.user}</dd>
                            
                            <dt class="col-sm-3">Session:</dt>
                            <dd class="col-sm-9">${entry.sessionId}</dd>
                            
                            <dt class="col-sm-3">Changes:</dt>
                            <dd class="col-sm-9"><pre class="small">${JSON.stringify(entry.changes, null, 2)}</pre></dd>
                            
                            <dt class="col-sm-3">Metadata:</dt>
                            <dd class="col-sm-9"><pre class="small">${JSON.stringify(entry.metadata, null, 2)}</pre></dd>
                        </dl>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }
    
    exportAuditTrail(format = 'csv', filters = {}) {
        const data = this.searchAuditTrail('', filters);
        
        if (format === 'csv') {
            this.exportToCSV(data);
        } else if (format === 'json') {
            this.exportToJSON(data);
        }
    }
    
    exportToCSV(data) {
        const headers = ['Timestamp', 'Module', 'Record Type', 'Record ID', 'Action', 'User', 'Session', 'Changes', 'Metadata'];
        const rows = [headers];
        
        data.forEach(entry => {
            rows.push([
                entry.timestamp,
                entry.module,
                entry.recordType,
                entry.recordId,
                entry.action,
                entry.user,
                entry.sessionId,
                JSON.stringify(entry.changes),
                JSON.stringify(entry.metadata)
            ]);
        });
        
        const csvContent = rows.map(row => 
            row.map(cell => {
                const escaped = String(cell || '').replace(/"/g, '""');
                return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"') ? `"${escaped}"` : escaped;
            }).join(',')
        ).join('\n');
        
        this.downloadFile(csvContent, `universal-audit-trail-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    }
    
    exportToJSON(data) {
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, `universal-audit-trail-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    }
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType + ';charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    showCleanupOptions() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Audit Trail Cleanup</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Current audit entries: <strong>${this.auditEntries.length}</strong></p>
                        <p>Storage usage: <strong>${Math.round(JSON.stringify(this.auditEntries).length / 1024)} KB</strong></p>
                        
                        <div class="mb-3">
                            <h6>Cleanup Options:</h6>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="cleanupOption" id="cleanup30" value="30">
                                <label class="form-check-label" for="cleanup30">
                                    Keep last 30 days only
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="cleanupOption" id="cleanup90" value="90">
                                <label class="form-check-label" for="cleanup90">
                                    Keep last 90 days only
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="cleanupOption" id="cleanup1000" value="1000">
                                <label class="form-check-label" for="cleanup1000">
                                    Keep last 1000 entries only
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="cleanupOption" id="cleanupAll" value="all">
                                <label class="form-check-label" for="cleanupAll">
                                    <span class="text-danger">Clear all audit entries</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" onclick="universalAuditSystem.performCleanup(this)">Perform Cleanup</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }
    
    performCleanup(button) {
        const selectedOption = document.querySelector('input[name="cleanupOption"]:checked')?.value;
        if (!selectedOption) return;
        
        if (!confirm('Are you sure you want to perform this cleanup? This action cannot be undone.')) return;
        
        const originalLength = this.auditEntries.length;
        
        if (selectedOption === 'all') {
            this.auditEntries = [];
        } else if (selectedOption === '1000') {
            this.auditEntries = this.auditEntries
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 1000);
        } else {
            const days = parseInt(selectedOption);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            this.auditEntries = this.auditEntries.filter(entry => 
                new Date(entry.timestamp) >= cutoffDate
            );
        }
        
        this.saveToStorage();
        
        // Record the cleanup operation
        this.recordEvent({
            module: 'system',
            recordType: 'audit_cleanup',
            recordId: null,
            action: 'DELETE',
            changes: {
                originalCount: originalLength,
                remainingCount: this.auditEntries.length,
                cleanupType: selectedOption
            },
            metadata: {
                automated: false,
                source: 'manual_cleanup'
            }
        });
        
        alert(`Cleanup completed. Removed ${originalLength - this.auditEntries.length} entries.`);
        
        // Close modal
        const modal = button.closest('.modal');
        bootstrap.Modal.getInstance(modal).hide();
    }
    
    // Helper methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    getCurrentUser() {
        return localStorage.getItem('current_user') || sessionStorage.getItem('current_user') || 'system_user';
    }
    
    getSessionId() {
        let sessionId = sessionStorage.getItem('millennium_session_id');
        if (!sessionId) {
            sessionId = this.generateId();
            sessionStorage.setItem('millennium_session_id', sessionId);
        }
        return sessionId;
    }
    
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('en-ZA', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    formatChanges(changes) {
        if (typeof changes === 'string') return changes;
        
        if (typeof changes === 'object' && changes !== null) {
            if (Object.keys(changes).length === 0) return 'No changes';
            
            const summary = Object.entries(changes).slice(0, 3).map(([key, value]) => {
                if (typeof value === 'object' && value.old !== undefined && value.new !== undefined) {
                    return `${key}: ${value.old} → ${value.new}`;
                }
                return `${key}: ${String(value).substring(0, 20)}${String(value).length > 20 ? '...' : ''}`;
            }).join(', ');
            
            return summary + (Object.keys(changes).length > 3 ? '...' : '');
        }
        
        return String(changes).substring(0, 50);
    }
    
    // Storage management
    saveToStorage() {
        try {
            // Keep only the most recent entries to prevent storage overflow
            if (this.auditEntries.length > this.maxEntries) {
                this.auditEntries = this.auditEntries
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .slice(0, this.maxEntries);
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(this.auditEntries));
        } catch (error) {
            console.warn('Could not save universal audit trail to storage:', error);
        }
    }
    
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.auditEntries = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Could not load universal audit trail from storage:', error);
            this.auditEntries = [];
        }
    }
    
    // Public API for manual audit recording
    audit(module, recordType, recordId, action, changes, metadata = {}) {
        return this.recordEvent({
            module,
            recordType,
            recordId,
            action,
            changes,
            metadata: {
                ...metadata,
                automated: false,
                source: 'manual_api'
            }
        });
    }
}

// Create global instance and replace the old audit trail manager
window.universalAuditSystem = new UniversalAuditSystem();
window.auditTrailManager = window.universalAuditSystem; // Backward compatibility