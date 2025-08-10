/**
 * Company Types Module - Charter Compliant
 * Manages company type classifications
 */

class CompanyTypesModule {
    constructor(container) {
        this.container = container;
        this.apiEndpoint = '/api/settings/companytypes';
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="companytypes-module">
                <div class="module-header mb-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h2><i class="fas fa-building text-primary"></i> Company Types</h2>
                            <p class="text-muted mb-0">Manage company type classifications</p>
                        </div>
                        <div class="module-actions">
                            <button class="btn btn-primary" disabled>
                                <i class="fas fa-plus"></i> Add Type
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="coming-soon-placeholder">
                    <div class="text-center py-5">
                        <i class="fas fa-hard-hat fa-3x text-warning mb-3"></i>
                        <h4 class="text-warning">Coming Soon</h4>
                        <p class="text-muted">The Company Types module is under construction</p>
                        <div class="planned-features mt-4">
                            <h6>Planned Features:</h6>
                            <ul class="list-unstyled text-start d-inline-block">
                                <li><i class="fas fa-check text-success"></i> Company classification</li>
                                <li><i class="fas fa-check text-success"></i> Industry types</li>
                                <li><i class="fas fa-check text-success"></i> Client categories</li>
                                <li><i class="fas fa-check text-success"></i> Business rules</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Register with platform (Charter compliance)
if (window.modularApp) {
    window.modularApp.registerModule('CompanyTypes', CompanyTypesModule);
}

// Export for legacy compatibility
window.CompanyTypesModule = CompanyTypesModule;