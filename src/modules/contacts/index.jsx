/**
 * Contacts Module - Charter Compliant
 * Manages contact information and relationships
 */

class ContactsModule {
    constructor(container) {
        this.container = container;
        this.apiEndpoint = '/api/contacts';
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="contacts-module">
                <div class="module-header mb-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h2><i class="fas fa-address-book text-primary"></i> Contacts</h2>
                            <p class="text-muted mb-0">Manage contact information and relationships</p>
                        </div>
                    </div>
                </div>
                <div class="module-actionbar"></div>
                
                <div class="coming-soon-placeholder">
                    <div class="text-center py-5">
                        <i class="fas fa-hard-hat fa-3x text-warning mb-3"></i>
                        <h4 class="text-warning">Coming Soon</h4>
                        <p class="text-muted">The Contacts module is under construction</p>
                        <div class="planned-features mt-4">
                            <h6>Planned Features:</h6>
                            <ul class="list-unstyled text-start d-inline-block">
                                <li><i class="fas fa-check text-success"></i> Contact database management</li>
                                <li><i class="fas fa-check text-success"></i> Relationship tracking</li>
                                <li><i class="fas fa-check text-success"></i> Communication history</li>
                                <li><i class="fas fa-check text-success"></i> Integration with customers</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize ActionBar immediately - DOM should be ready after innerHTML
        this.initializeActionBar();
    }

    initializeActionBar() {
        const actionBarContainer = this.container.querySelector('.module-actionbar');
        console.log('🔧 Contacts ActionBar Debug:', {
            container: actionBarContainer,
            ActionBarClass: window.ActionBar,
            modularApp: window.modularApp
        });
        
        if (actionBarContainer) {
            if (window.ActionBar) {
                console.log('✅ Creating Contacts ActionBar...');
                try {
                    this.actionBar = new ActionBar(actionBarContainer, {
                        context: 'module',
                        actions: [
                            { id: 'add', icon: 'plus', label: 'Add Contact', variant: 'primary', group: 'crud' },
                            { id: 'refresh', icon: 'sync-alt', label: 'Refresh', variant: 'outline-secondary', group: 'view' },
                            { id: 'search', icon: 'search', label: 'Search', variant: 'outline-secondary', group: 'view' },
                            { id: 'filter', icon: 'filter', label: 'Filter', variant: 'outline-secondary', group: 'view' },
                            { id: 'export', icon: 'download', label: 'Export', variant: 'outline-secondary', group: 'data' },
                            { id: 'import', icon: 'upload', label: 'Import', variant: 'outline-secondary', group: 'data', disabled: true }
                        ]
                    });
                    
                    console.log('✅ Contacts ActionBar created successfully!');
                    
                    // Disable actions until module is implemented
                    ['add', 'search', 'filter', 'import'].forEach(actionId => {
                        this.actionBar.disableAction(actionId);
                    });
                    
                    // Add visual confirmation
                    const statusDiv = document.createElement('div');
                    statusDiv.innerHTML = '<small class="text-success">ActionBar loaded successfully!</small>';
                    actionBarContainer.appendChild(statusDiv);
                    
                } catch (error) {
                    console.error('❌ Error creating ActionBar:', error);
                }
            } else {
                console.error('❌ ActionBar class not available on window');
                // Add manual ActionBar as fallback
                actionBarContainer.innerHTML = `
                    <div class="millennium-action-bar" style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 8px 12px; margin: 8px 0;">
                        <div class="d-flex align-items-center">
                            <button class="btn btn-primary btn-sm me-2" disabled><i class="fas fa-plus"></i> Add Contact</button>
                            <button class="btn btn-outline-secondary btn-sm me-2"><i class="fas fa-sync-alt"></i> Refresh</button>
                            <button class="btn btn-outline-secondary btn-sm me-2" disabled><i class="fas fa-search"></i> Search</button>
                            <button class="btn btn-outline-secondary btn-sm me-2" disabled><i class="fas fa-filter"></i> Filter</button>
                            <button class="btn btn-outline-secondary btn-sm me-2"><i class="fas fa-download"></i> Export</button>
                            <button class="btn btn-outline-secondary btn-sm" disabled><i class="fas fa-upload"></i> Import</button>
                        </div>
                    </div>
                `;
            }
        } else {
            console.error('❌ ActionBar container (.module-actionbar) not found in DOM');
        }
    }
}

// Register with platform (Charter compliance)
if (window.modularApp) {
    window.modularApp.registerModule('Contacts', ContactsModule);
}

// Export for legacy compatibility
window.ContactsModule = ContactsModule;