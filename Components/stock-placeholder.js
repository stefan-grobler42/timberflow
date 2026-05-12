// Stock Module Placeholder
class StockPlaceholder {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Stock Placeholder: Container not found:', this.containerId);
            return;
        }
        
        console.log('Stock Placeholder: Module loaded');
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="row justify-content-center">
                <div class="col-md-8 col-lg-6">
                    <div class="card shadow-sm">
                        <div class="card-body text-center py-5">
                            <div class="mb-4">
                                <i class="fas fa-boxes fa-4x text-muted"></i>
                            </div>
                            <h3 class="card-title text-muted mb-3">Stock Module</h3>
                            <p class="card-text text-muted">
                                The Stock Management module is currently under development.
                                <br>
                                This feature will be available in a future update.
                            </p>
                            <div class="mt-4">
                                <span class="badge bg-secondary px-3 py-2">Coming Soon</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Make StockPlaceholder globally accessible
window.StockPlaceholder = StockPlaceholder;