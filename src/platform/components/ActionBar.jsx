/**
 * ActionBar Component - Charter Compliant
 * System-wide taskbar for housing action buttons and functions
 */

class ActionBar {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            context: 'module', // 'module', 'record', 'form', 'grid'
            actions: [],
            showSeparators: true,
            size: 'normal', // 'small', 'normal', 'large'
            position: 'below-header', // 'below-header', 'above-content', 'floating'
            ...options
        };
        
        this.render();
    }

    render() {
        const actionBarHtml = `
            <div class="millennium-action-bar ${this.getContextClass()} ${this.getSizeClass()}" 
                 style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 8px 12px; margin: 8px 0;">
                <div class="action-bar-content d-flex align-items-center justify-content-between">
                    <div class="action-groups d-flex align-items-center">
                        ${this.renderActionGroups()}
                    </div>
                    <div class="action-info d-flex align-items-center text-muted">
                        <small id="action-status"></small>
                    </div>
                </div>
            </div>
        `;
        
        this.container.insertAdjacentHTML('afterbegin', actionBarHtml);
        this.actionBar = this.container.querySelector('.millennium-action-bar');
        this.attachEventListeners();
    }

    renderActionGroups() {
        if (!this.options.actions.length) {
            return this.getDefaultActions();
        }

        let html = '';
        let currentGroup = '';
        
        this.options.actions.forEach((action, index) => {
            // Add separator between different groups
            if (action.group !== currentGroup && currentGroup !== '' && this.options.showSeparators) {
                html += '<div class="action-separator mx-2" style="width: 1px; height: 20px; background: #dee2e6;"></div>';
            }
            
            html += this.renderAction(action);
            currentGroup = action.group;
        });
        
        return html;
    }

    renderAction(action) {
        const disabled = action.disabled ? 'disabled' : '';
        const variant = action.variant || 'outline-secondary';
        const size = this.options.size === 'small' ? 'btn-sm' : '';
        
        return `
            <button type="button" 
                    class="btn btn-${variant} ${size} me-1 action-btn" 
                    data-action="${action.id}" 
                    title="${action.tooltip || action.label}"
                    ${disabled}>
                <i class="fas fa-${action.icon}"></i>
                ${action.showLabel !== false ? `<span class="ms-1">${action.label}</span>` : ''}
            </button>
        `;
    }

    getDefaultActions() {
        const defaults = {
            module: [
                { id: 'add', icon: 'plus', label: 'Add New', variant: 'primary', group: 'crud' },
                { id: 'refresh', icon: 'sync-alt', label: 'Refresh', variant: 'outline-secondary', group: 'view' },
                { id: 'search', icon: 'search', label: 'Search', variant: 'outline-secondary', group: 'view' },
                { id: 'filter', icon: 'filter', label: 'Filter', variant: 'outline-secondary', group: 'view' },
                { id: 'export', icon: 'download', label: 'Export', variant: 'outline-secondary', group: 'data' },
                { id: 'import', icon: 'upload', label: 'Import', variant: 'outline-secondary', group: 'data' }
            ],
            record: [
                { id: 'save', icon: 'save', label: 'Save', variant: 'primary', group: 'crud' },
                { id: 'edit', icon: 'edit', label: 'Edit', variant: 'outline-primary', group: 'crud' },
                { id: 'delete', icon: 'trash', label: 'Delete', variant: 'outline-danger', group: 'crud' },
                { id: 'duplicate', icon: 'copy', label: 'Duplicate', variant: 'outline-secondary', group: 'actions' },
                { id: 'print', icon: 'print', label: 'Print', variant: 'outline-secondary', group: 'actions' },
                { id: 'share', icon: 'share', label: 'Share', variant: 'outline-secondary', group: 'actions' }
            ],
            form: [
                { id: 'save', icon: 'save', label: 'Save', variant: 'primary', group: 'crud' },
                { id: 'cancel', icon: 'times', label: 'Cancel', variant: 'outline-secondary', group: 'crud' },
                { id: 'reset', icon: 'undo', label: 'Reset', variant: 'outline-warning', group: 'actions' },
                { id: 'validate', icon: 'check-circle', label: 'Validate', variant: 'outline-info', group: 'actions' }
            ],
            grid: [
                { id: 'add', icon: 'plus', label: 'Add Row', variant: 'primary', group: 'crud' },
                { id: 'edit', icon: 'edit', label: 'Edit', variant: 'outline-primary', group: 'crud' },
                { id: 'delete', icon: 'trash', label: 'Delete', variant: 'outline-danger', group: 'crud' },
                { id: 'columns', icon: 'columns', label: 'Columns', variant: 'outline-secondary', group: 'view' },
                { id: 'sort', icon: 'sort', label: 'Sort', variant: 'outline-secondary', group: 'view' },
                { id: 'export', icon: 'download', label: 'Export', variant: 'outline-secondary', group: 'data' }
            ]
        };

        return defaults[this.options.context]?.map(action => this.renderAction(action)).join('') || '';
    }

    getContextClass() {
        return `action-bar-${this.options.context}`;
    }

    getSizeClass() {
        return `action-bar-${this.options.size}`;
    }

    attachEventListeners() {
        const actionButtons = this.actionBar.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const actionId = btn.dataset.action;
                this.handleAction(actionId, btn);
            });
        });
    }

    handleAction(actionId, button) {
        // Emit custom event for action handling
        const event = new CustomEvent('actionBarClick', {
            detail: { actionId, button, context: this.options.context }
        });
        
        this.container.dispatchEvent(event);
        
        // Update status
        this.updateStatus(`Action: ${actionId}`);
        
        // Built-in actions
        switch(actionId) {
            case 'refresh':
                this.handleRefresh();
                break;
            case 'export':
                this.handleExport();
                break;
            case 'print':
                this.handlePrint();
                break;
        }
    }

    handleRefresh() {
        this.updateStatus('Refreshing...');
        // Trigger refresh event
        setTimeout(() => {
            this.updateStatus('Data refreshed');
            setTimeout(() => this.clearStatus(), 2000);
        }, 500);
    }

    handleExport() {
        this.updateStatus('Preparing export...');
        setTimeout(() => {
            this.updateStatus('Export ready');
            setTimeout(() => this.clearStatus(), 2000);
        }, 1000);
    }

    handlePrint() {
        window.print();
        this.updateStatus('Print dialog opened');
        setTimeout(() => this.clearStatus(), 2000);
    }

    updateStatus(message) {
        const statusEl = this.actionBar.querySelector('#action-status');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }

    clearStatus() {
        this.updateStatus('');
    }

    // Public methods for dynamic action management
    addAction(action) {
        this.options.actions.push(action);
        this.refresh();
    }

    removeAction(actionId) {
        this.options.actions = this.options.actions.filter(a => a.id !== actionId);
        this.refresh();
    }

    enableAction(actionId) {
        const button = this.actionBar.querySelector(`[data-action="${actionId}"]`);
        if (button) {
            button.disabled = false;
            button.classList.remove('disabled');
        }
    }

    disableAction(actionId) {
        const button = this.actionBar.querySelector(`[data-action="${actionId}"]`);
        if (button) {
            button.disabled = true;
            button.classList.add('disabled');
        }
    }

    refresh() {
        const content = this.actionBar.querySelector('.action-groups');
        content.innerHTML = this.renderActionGroups();
        this.attachEventListeners();
    }

    destroy() {
        if (this.actionBar) {
            this.actionBar.remove();
        }
    }
}

// Register with platform (Charter compliance)
if (window.modularApp) {
    window.modularApp.registerComponent('ActionBar', ActionBar);
}

// Export for legacy compatibility
window.ActionBar = ActionBar;