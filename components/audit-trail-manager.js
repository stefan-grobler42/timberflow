// Universal Audit Trail Manager
class AuditTrailManager {
    constructor() {
        this.auditEntries = [];
        this.storageKey = 'millennium_audit_trail';
        this.loadFromStorage();
    }
    
    // Record audit event
    recordEvent(config) {
        const entry = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            module: config.module || 'unknown',
            recordType: config.recordType || 'unknown',
            recordId: config.recordId,
            action: config.action, // CREATE, UPDATE, DELETE, IMPORT, EXPORT
            changes: config.changes || {},
            user: config.user || this.getCurrentUser(),
            userAgent: navigator.userAgent,
            ipAddress: 'local', // Would be captured server-side
            sessionId: this.getSessionId(),
            metadata: config.metadata || {}
        };
        
        this.auditEntries.push(entry);
        this.saveToStorage();
        
        console.log('Audit event recorded:', entry);
        return entry;
    }
    
    // Get audit trail for specific record
    getRecordAuditTrail(module, recordType, recordId) {
        return this.auditEntries.filter(entry => 
            entry.module === module && 
            entry.recordType === recordType && 
            entry.recordId === recordId
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    // Get audit trail for module
    getModuleAuditTrail(module, limit = 100) {
        return this.auditEntries
            .filter(entry => entry.module === module)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }
    
    // Get full audit trail
    getFullAuditTrail(limit = 500) {
        return this.auditEntries
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }
    
    // Search audit trail
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
        
        // Apply search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(entry => 
                entry.action.toLowerCase().includes(term) ||
                entry.user.toLowerCase().includes(term) ||
                JSON.stringify(entry.changes).toLowerCase().includes(term) ||
                JSON.stringify(entry.metadata).toLowerCase().includes(term)
            );
        }
        
        return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    // Export audit trail
    exportAuditTrail(format = 'csv', filters = {}) {
        const data = this.searchAuditTrail('', filters);
        
        if (format === 'csv') {
            return this.exportToCSV(data);
        } else if (format === 'json') {
            return this.exportToJSON(data);
        }
    }
    
    exportToCSV(data) {
        const headers = ['Timestamp', 'Module', 'Record Type', 'Record ID', 'Action', 'User', 'Changes', 'Session ID'];
        const rows = [headers];
        
        data.forEach(entry => {
            rows.push([
                entry.timestamp,
                entry.module,
                entry.recordType,
                entry.recordId,
                entry.action,
                entry.user,
                JSON.stringify(entry.changes),
                entry.sessionId
            ]);
        });
        
        const csvContent = rows.map(row => 
            row.map(cell => {
                const escaped = String(cell || '').replace(/"/g, '""');
                return escaped.includes(',') || escaped.includes('\n') ? `"${escaped}"` : escaped;
            }).join(',')
        ).join('\n');
        
        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    exportToJSON(data) {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `audit-trail-${new Date().toISOString().split('T')[0]}.json`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Create audit trail viewer
    createAuditViewer(containerId, config = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const filters = config.filters || {};
        const data = this.searchAuditTrail('', filters);
        
        container.innerHTML = `
            <div class="audit-trail-viewer">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5><i class="fas fa-history me-2"></i>Audit Trail</h5>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="auditTrailManager.exportAuditTrail('csv')">
                            <i class="fas fa-download me-1"></i>Export CSV
                        </button>
                        <button class="btn btn-outline-success" onclick="auditTrailManager.exportAuditTrail('json')">
                            <i class="fas fa-download me-1"></i>Export JSON
                        </button>
                    </div>
                </div>
                
                <div class="audit-filters mb-3">
                    <div class="row g-2">
                        <div class="col-md-3">
                            <input type="text" class="form-control form-control-sm" id="audit-search" placeholder="Search audit trail...">
                        </div>
                        <div class="col-md-2">
                            <select class="form-select form-select-sm" id="audit-module-filter">
                                <option value="">All Modules</option>
                                <option value="customer">Customer</option>
                                <option value="stock">Stock</option>
                                <option value="project">Project</option>
                                <option value="quote">Quote</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <select class="form-select form-select-sm" id="audit-action-filter">
                                <option value="">All Actions</option>
                                <option value="CREATE">Create</option>
                                <option value="UPDATE">Update</option>
                                <option value="DELETE">Delete</option>
                                <option value="IMPORT">Import</option>
                                <option value="EXPORT">Export</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <input type="date" class="form-control form-control-sm" id="audit-date-from">
                        </div>
                        <div class="col-md-2">
                            <input type="date" class="form-control form-control-sm" id="audit-date-to">
                        </div>
                        <div class="col-md-1">
                            <button class="btn btn-primary btn-sm w-100" onclick="auditTrailManager.refreshAuditViewer('${containerId}')">
                                <i class="fas fa-search"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="audit-results">
                    <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                        <table class="table table-sm table-striped">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Module</th>
                                    <th>Action</th>
                                    <th>Record</th>
                                    <th>User</th>
                                    <th>Changes</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map(entry => `
                                    <tr>
                                        <td>
                                            <small>${this.formatTimestamp(entry.timestamp)}</small>
                                        </td>
                                        <td>
                                            <span class="badge bg-secondary">${entry.module}</span>
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
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">${data.length} audit entries</small>
                    </div>
                </div>
            </div>
        `;
    }
    
    refreshAuditViewer(containerId) {
        const searchTerm = document.getElementById('audit-search')?.value || '';
        const filters = {
            module: document.getElementById('audit-module-filter')?.value || '',
            action: document.getElementById('audit-action-filter')?.value || '',
            dateFrom: document.getElementById('audit-date-from')?.value || '',
            dateTo: document.getElementById('audit-date-to')?.value || ''
        };
        
        // Remove empty filters
        Object.keys(filters).forEach(key => {
            if (!filters[key]) delete filters[key];
        });
        
        this.createAuditViewer(containerId, { filters });
    }
    
    // Helper methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    getCurrentUser() {
        // This would integrate with your authentication system
        return localStorage.getItem('current_user') || 'system';
    }
    
    getSessionId() {
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
            sessionId = this.generateId();
            sessionStorage.setItem('session_id', sessionId);
        }
        return sessionId;
    }
    
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('en-ZA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    getActionBadgeClass(action) {
        const classes = {
            CREATE: 'bg-success',
            UPDATE: 'bg-warning',
            DELETE: 'bg-danger',
            IMPORT: 'bg-info',
            EXPORT: 'bg-primary'
        };
        return classes[action] || 'bg-secondary';
    }
    
    formatChanges(changes) {
        if (typeof changes === 'string') return changes;
        
        if (typeof changes === 'object' && changes !== null) {
            if (Object.keys(changes).length === 0) return 'No changes';
            
            return Object.entries(changes).map(([key, value]) => {
                if (typeof value === 'object' && value.old !== undefined && value.new !== undefined) {
                    return `${key}: ${value.old} → ${value.new}`;
                }
                return `${key}: ${JSON.stringify(value)}`;
            }).join(', ');
        }
        
        return JSON.stringify(changes);
    }
    
    // Storage management
    saveToStorage() {
        try {
            // Keep only last 1000 entries to prevent storage overflow
            if (this.auditEntries.length > 1000) {
                this.auditEntries = this.auditEntries.slice(-1000);
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(this.auditEntries));
        } catch (error) {
            console.warn('Could not save audit trail to storage:', error);
        }
    }
    
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.auditEntries = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Could not load audit trail from storage:', error);
            this.auditEntries = [];
        }
    }
    
    clearAuditTrail() {
        if (confirm('Are you sure you want to clear the entire audit trail? This action cannot be undone.')) {
            this.auditEntries = [];
            this.saveToStorage();
            console.log('Audit trail cleared');
        }
    }
}

// Create global instance
window.auditTrailManager = new AuditTrailManager();