/**
 * Universal Command Bar Component
 * Microsoft Fabric/Power Apps style command bar that provides context-aware actions
 * Stays persistent at the top of the application below the main navbar
 */

class CommandBar {
    constructor() {
        this.container = null;
        this.currentContext = null;
        this.selectedItems = [];
        this.init();
    }

    init() {
        // Find or create the command bar container
        this.container = document.getElementById('universal-command-bar');
        if (!this.container) {
            // Create container if it doesn't exist
            this.container = document.createElement('div');
            this.container.id = 'universal-command-bar';
            
            // Insert after navbar or at top of app
            const navbar = document.querySelector('.navbar');
            if (navbar && navbar.parentElement) {
                navbar.parentElement.insertBefore(this.container, navbar.nextSibling);
            } else {
                const app = document.getElementById('app');
                if (app) {
                    app.insertBefore(this.container, app.firstChild);
                }
            }
        }
        
        // Apply styles
        this.applyStyles();
        
        // Set default context
        this.setContext('default');
    }

    applyStyles() {
        // Apply inline styles for the command bar
        Object.assign(this.container.style, {
            position: 'fixed',
            top: '56px', // Height of navbar
            left: '0',
            right: '0',
            height: '48px',
            background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)',
            borderBottom: '1px solid #dee2e6',
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
            zIndex: '1040',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            transition: 'all 0.3s ease'
        });
        
        // Adjust body padding to account for command bar
        document.body.style.paddingTop = '104px'; // Navbar (56px) + Command Bar (48px)
    }

    setContext(contextType, options = {}) {
        this.currentContext = contextType;
        this.render(options);
    }

    render(options = {}) {
        const commands = this.getCommandsForContext(options);
        
        this.container.innerHTML = `
            <div class="command-bar-content" style="width: 100%; display: flex; align-items: center; justify-content: space-between;">
                <div class="command-bar-actions" style="display: flex; align-items: center; gap: 4px;">
                    ${commands.primary.map(cmd => this.renderCommand(cmd, 'primary')).join('')}
                    ${commands.secondary.length > 0 ? '<div class="command-separator" style="width: 1px; height: 24px; background: #dee2e6; margin: 0 8px;"></div>' : ''}
                    ${commands.secondary.map(cmd => this.renderCommand(cmd, 'secondary')).join('')}
                    ${commands.contextual.length > 0 ? '<div class="command-separator" style="width: 1px; height: 24px; background: #dee2e6; margin: 0 8px;"></div>' : ''}
                    ${commands.contextual.map(cmd => this.renderCommand(cmd, 'contextual')).join('')}
                </div>
                <div class="command-bar-status" style="display: flex; align-items: center; gap: 16px;">
                    ${options.statusText ? `<span class="text-muted small">${options.statusText}</span>` : ''}
                    ${commands.overflow.length > 0 ? this.renderOverflowMenu(commands.overflow) : ''}
                </div>
            </div>
        `;
        
        // Attach event listeners
        this.attachEventListeners();
    }

    renderCommand(command, type = 'secondary') {
        const buttonClass = type === 'primary' ? 'btn-primary' : 'btn-outline-secondary';
        const disabled = command.disabled ? 'disabled' : '';
        
        return `
            <button class="btn ${buttonClass} btn-sm command-bar-btn" 
                    data-command="${command.id}" 
                    title="${command.tooltip || command.label}"
                    ${disabled}
                    style="min-width: auto; padding: 4px 12px; font-size: 13px;">
                ${command.icon ? `<i class="${command.icon}"></i>` : ''}
                ${command.showLabel !== false ? `<span class="ms-1">${command.label}</span>` : ''}
            </button>
        `;
    }

    renderOverflowMenu(commands) {
        return `
            <div class="dropdown">
                <button class="btn btn-outline-secondary btn-sm" type="button" data-bs-toggle="dropdown">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    ${commands.map(cmd => `
                        <li>
                            <a class="dropdown-item command-bar-menu-item" href="#" data-command="${cmd.id}">
                                ${cmd.icon ? `<i class="${cmd.icon} me-2"></i>` : ''}
                                ${cmd.label}
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    getCommandsForContext(options = {}) {
        const commands = {
            primary: [],
            secondary: [],
            contextual: [],
            overflow: []
        };

        switch (this.currentContext) {
            case 'customer-grid':
                commands.primary = [
                    { id: 'new-customer', label: 'New', icon: 'fas fa-plus', action: () => this.executeCommand('new-customer') }
                ];
                commands.secondary = [
                    { id: 'refresh', label: 'Refresh', icon: 'fas fa-sync-alt', action: () => this.executeCommand('refresh') },
                    { id: 'filter', label: 'Filter', icon: 'fas fa-filter', action: () => this.executeCommand('filter') },
                    { id: 'search', label: 'Search', icon: 'fas fa-search', action: () => this.executeCommand('search') }
                ];
                commands.contextual = [
                    { id: 'export', label: 'Export', icon: 'fas fa-download', action: () => this.executeCommand('export') },
                    { id: 'import', label: 'Import', icon: 'fas fa-upload', action: () => this.executeCommand('import') }
                ];
                commands.overflow = [
                    { id: 'columns', label: 'Column Options', icon: 'fas fa-columns' },
                    { id: 'print', label: 'Print', icon: 'fas fa-print' },
                    { id: 'share', label: 'Share', icon: 'fas fa-share' }
                ];
                break;

            case 'customer-form':
                const isEdit = options.isEdit;
                commands.primary = [
                    { id: 'save', label: 'Save', icon: 'fas fa-save', action: () => this.executeCommand('save') }
                ];
                commands.secondary = [
                    { id: 'back', label: 'Back', icon: 'fas fa-arrow-left', action: () => this.executeCommand('back') },
                    { id: 'undo', label: 'Undo', icon: 'fas fa-undo', action: () => this.executeCommand('undo'), disabled: !options.hasChanges },
                    { id: 'reset', label: 'Reset', icon: 'fas fa-redo', action: () => this.executeCommand('reset') }
                ];
                if (isEdit) {
                    commands.contextual = [
                        { id: 'delete', label: 'Delete', icon: 'fas fa-trash', action: () => this.executeCommand('delete') },
                        { id: 'duplicate', label: 'Duplicate', icon: 'fas fa-copy', action: () => this.executeCommand('duplicate') }
                    ];
                }
                commands.overflow = [
                    { id: 'print', label: 'Print', icon: 'fas fa-print' },
                    { id: 'share', label: 'Share', icon: 'fas fa-share' },
                    { id: 'audit', label: 'View Audit Trail', icon: 'fas fa-history' }
                ];
                break;

            case 'quote-builder':
                commands.primary = [
                    { id: 'save-quote', label: 'Save Quote', icon: 'fas fa-save', action: () => this.executeCommand('save-quote') }
                ];
                commands.secondary = [
                    { id: 'add-item', label: 'Add Item', icon: 'fas fa-plus', action: () => this.executeCommand('add-item') },
                    { id: 'import-pamir', label: 'Import from Pamir', icon: 'fas fa-file-import', action: () => this.executeCommand('import-pamir') },
                    { id: 'calculate', label: 'Recalculate', icon: 'fas fa-calculator', action: () => this.executeCommand('calculate') }
                ];
                commands.contextual = [
                    { id: 'preview', label: 'Preview', icon: 'fas fa-eye', action: () => this.executeCommand('preview') },
                    { id: 'send', label: 'Send to Customer', icon: 'fas fa-paper-plane', action: () => this.executeCommand('send') }
                ];
                commands.overflow = [
                    { id: 'duplicate-quote', label: 'Duplicate Quote', icon: 'fas fa-copy' },
                    { id: 'convert-order', label: 'Convert to Order', icon: 'fas fa-truck' },
                    { id: 'export-pdf', label: 'Export as PDF', icon: 'fas fa-file-pdf' }
                ];
                break;

            default:
                // Default/home context
                commands.primary = [
                    { id: 'quick-create', label: 'Quick Create', icon: 'fas fa-plus', action: () => this.showQuickCreate() }
                ];
                commands.secondary = [
                    { id: 'recent', label: 'Recent Items', icon: 'fas fa-clock', action: () => this.showRecent() },
                    { id: 'favorites', label: 'Favorites', icon: 'fas fa-star', action: () => this.showFavorites() }
                ];
                break;
        }

        return commands;
    }

    executeCommand(commandId) {
        // Emit custom event for command execution
        const event = new CustomEvent('commandbar:execute', {
            detail: { commandId, context: this.currentContext }
        });
        document.dispatchEvent(event);
        
        console.log(`CommandBar: Executing command '${commandId}' in context '${this.currentContext}'`);
    }

    attachEventListeners() {
        // Command buttons
        this.container.querySelectorAll('.command-bar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commandId = e.currentTarget.dataset.command;
                this.executeCommand(commandId);
            });
        });

        // Dropdown menu items
        this.container.querySelectorAll('.command-bar-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const commandId = e.currentTarget.dataset.command;
                this.executeCommand(commandId);
            });
        });
    }

    updateSelectionCount(count) {
        const statusText = count > 0 ? `${count} item${count !== 1 ? 's' : ''} selected` : '';
        this.render({ statusText });
    }

    showQuickCreate() {
        console.log('CommandBar: Showing quick create menu');
        // Implementation for quick create menu
    }

    showRecent() {
        console.log('CommandBar: Showing recent items');
        // Implementation for recent items
    }

    showFavorites() {
        console.log('CommandBar: Showing favorites');
        // Implementation for favorites
    }

    // Method to hide/show command bar
    setVisible(visible) {
        this.container.style.display = visible ? 'flex' : 'none';
        document.body.style.paddingTop = visible ? '104px' : '56px';
    }
}

// Initialize global command bar instance
window.CommandBar = new CommandBar();

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommandBar;
}