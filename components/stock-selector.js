// Stock Management Component
class StockSelector {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.stockItems = [];
        this.filteredItems = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.sortField = 'code';
        this.sortDirection = 'asc';
        
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
                    <!-- Stock Management Controls -->
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="fas fa-boxes"></i> Stock Management</h5>
                            <div>
                                <button class="btn btn-outline-success btn-sm me-2" id="import-stock-btn">
                                    <i class="fas fa-file-excel"></i> Import Excel
                                </button>
                                <button class="btn btn-primary btn-sm" id="add-stock-btn">
                                    <i class="fas fa-plus"></i> Add Stock Item
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fas fa-search"></i></span>
                                        <input type="text" class="form-control" id="stock-search-input" 
                                               placeholder="Search by code, description, or category...">
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <select class="form-select" id="category-filter">
                                        <option value="">All Categories</option>
                                        <option value="timber">Timber</option>
                                        <option value="hardware">Hardware</option>
                                        <option value="fasteners">Fasteners</option>
                                        <option value="plates">Plates</option>
                                        <option value="accessories">Accessories</option>
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <select class="form-select" id="stock-status-filter">
                                        <option value="">All Status</option>
                                        <option value="in-stock">In Stock</option>
                                        <option value="low-stock">Low Stock</option>
                                        <option value="out-of-stock">Out of Stock</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Stock Items Grid -->
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="fas fa-list"></i> Stock Items
                                <span class="badge bg-primary ms-2" id="stock-count">0</span>
                            </h6>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th class="sortable cursor-pointer" data-field="code">
                                                Code <i class="fas fa-sort"></i>
                                            </th>
                                            <th class="sortable cursor-pointer" data-field="description">
                                                Description <i class="fas fa-sort"></i>
                                            </th>
                                            <th class="sortable cursor-pointer" data-field="category">
                                                Category <i class="fas fa-sort"></i>
                                            </th>
                                            <th class="sortable cursor-pointer" data-field="uom">
                                                UOM <i class="fas fa-sort"></i>
                                            </th>
                                            <th class="sortable cursor-pointer" data-field="currentStock">
                                                Stock <i class="fas fa-sort"></i>
                                            </th>
                                            <th class="sortable cursor-pointer" data-field="reorderPoint">
                                                Reorder <i class="fas fa-sort"></i>
                                            </th>
                                            <th class="sortable cursor-pointer" data-field="unitCost">
                                                Cost <i class="fas fa-sort"></i>
                                            </th>
                                            <th class="sortable cursor-pointer" data-field="sellingPrice">
                                                Price <i class="fas fa-sort"></i>
                                            </th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="stock-table-body">
                                        <!-- Stock items will be loaded here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="card-footer">
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="text-muted">
                                    Showing <span id="items-showing">0</span> of <span id="total-items">0</span> items
                                </div>
                                <nav>
                                    <ul class="pagination pagination-sm mb-0" id="pagination">
                                        <!-- Pagination will be generated here -->
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add/Edit Stock Item Modal -->
            <div class="modal fade" id="stockItemModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="stockItemModalTitle">Add Stock Item</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="stock-item-form">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-floating mb-3">
                                            <input type="text" class="form-control" id="item-code" required>
                                            <label for="item-code">Item Code</label>
                                        </div>
                                        <div class="form-floating mb-3">
                                            <input type="text" class="form-control" id="item-description" required>
                                            <label for="item-description">Description</label>
                                        </div>
                                        <div class="form-floating mb-3">
                                            <select class="form-select" id="item-category" required>
                                                <option value="">Select category...</option>
                                                <option value="timber">Timber</option>
                                                <option value="hardware">Hardware</option>
                                                <option value="fasteners">Fasteners</option>
                                                <option value="plates">Plates</option>
                                                <option value="accessories">Accessories</option>
                                            </select>
                                            <label for="item-category">Category</label>
                                        </div>
                                        <div class="form-floating mb-3">
                                            <select class="form-select" id="item-uom" required>
                                                <option value="">Select UOM...</option>
                                                <option value="EA">Each (EA)</option>
                                                <option value="M">Meter (M)</option>
                                                <option value="M2">Square Meter (M²)</option>
                                                <option value="M3">Cubic Meter (M³)</option>
                                                <option value="KG">Kilogram (KG)</option>
                                                <option value="LM">Linear Meter (LM)</option>
                                            </select>
                                            <label for="item-uom">Unit of Measure</label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-floating mb-3">
                                            <input type="number" class="form-control" id="item-current-stock" 
                                                   min="0" step="0.01">
                                            <label for="item-current-stock">Current Stock</label>
                                        </div>
                                        <div class="form-floating mb-3">
                                            <input type="number" class="form-control" id="item-reorder-point" 
                                                   min="0" step="0.01">
                                            <label for="item-reorder-point">Reorder Point</label>
                                        </div>
                                        <div class="form-floating mb-3">
                                            <input type="number" class="form-control" id="item-unit-cost" 
                                                   min="0" step="0.01">
                                            <label for="item-unit-cost">Unit Cost (R)</label>
                                        </div>
                                        <div class="form-floating mb-3">
                                            <input type="number" class="form-control" id="item-selling-price" 
                                                   min="0" step="0.01">
                                            <label for="item-selling-price">Selling Price (R)</label>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="form-floating mb-3">
                                            <textarea class="form-control" id="item-properties" 
                                                      style="height: 100px;" placeholder="Enter properties as JSON..."></textarea>
                                            <label for="item-properties">Properties (JSON)</label>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="save-stock-item-btn">Save Item</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stock Import Modal -->
            <div class="modal fade" id="stockImportModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Import Stock from Excel</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="file-drop-zone" id="stock-file-drop">
                                <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                                <p class="mb-2">Drop Excel file here or click to browse</p>
                                <p class="small text-muted">Supported formats: .xlsx, .xls</p>
                                <input type="file" id="stock-file-input" accept=".xlsx,.xls" style="display: none;">
                            </div>
                            <div id="import-progress" class="mt-3" style="display: none;">
                                <div class="progress">
                                    <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                                </div>
                                <p class="small text-muted mt-2 mb-0">Processing file...</p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="process-import-btn" disabled>
                                Process Import
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('stock-search-input').addEventListener('input', (e) => {
            this.filterStockItems();
        });

        // Filter dropdowns
        document.getElementById('category-filter').addEventListener('change', () => {
            this.filterStockItems();
        });

        document.getElementById('stock-status-filter').addEventListener('change', () => {
            this.filterStockItems();
        });

        // Sorting
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', (e) => {
                const field = e.target.getAttribute('data-field');
                this.sortStockItems(field);
            });
        });

        // Add stock item button
        document.getElementById('add-stock-btn').addEventListener('click', () => {
            this.openStockItemModal();
        });

        // Import stock button
        document.getElementById('import-stock-btn').addEventListener('click', () => {
            this.openImportModal();
        });

        // Save stock item
        document.getElementById('save-stock-item-btn').addEventListener('click', () => {
            this.saveStockItem();
        });

        // File drop zone
        this.setupFileDropZone();
    }

    async loadStockItems() {
        try {
            window.app.showLoading(true);
            const response = await window.app.apiCall('/stock/items');
            this.stockItems = response || [];
            this.filteredItems = [...this.stockItems];
            this.renderStockTable();
            this.updateStockCount();
        } catch (error) {
            console.error('Failed to load stock items:', error);
            this.stockItems = [];
            this.filteredItems = [];
            this.renderEmptyState();
        } finally {
            window.app.showLoading(false);
        }
    }

    filterStockItems() {
        const searchTerm = document.getElementById('stock-search-input').value.toLowerCase();
        const categoryFilter = document.getElementById('category-filter').value;
        const statusFilter = document.getElementById('stock-status-filter').value;

        this.filteredItems = this.stockItems.filter(item => {
            const matchesSearch = !searchTerm || 
                (item.code && item.code.toLowerCase().includes(searchTerm)) ||
                (item.description && item.description.toLowerCase().includes(searchTerm)) ||
                (item.category && item.category.toLowerCase().includes(searchTerm));

            const matchesCategory = !categoryFilter || item.category === categoryFilter;

            let matchesStatus = true;
            if (statusFilter === 'in-stock') {
                matchesStatus = (item.currentStock || 0) > (item.reorderPoint || 0);
            } else if (statusFilter === 'low-stock') {
                matchesStatus = (item.currentStock || 0) <= (item.reorderPoint || 0) && (item.currentStock || 0) > 0;
            } else if (statusFilter === 'out-of-stock') {
                matchesStatus = (item.currentStock || 0) === 0;
            }

            return matchesSearch && matchesCategory && matchesStatus;
        });

        this.currentPage = 1;
        this.renderStockTable();
        this.updateStockCount();
    }

    sortStockItems(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }

        this.filteredItems.sort((a, b) => {
            let aVal = a[field] || '';
            let bVal = b[field] || '';

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (this.sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        this.renderStockTable();
        this.updateSortIcons();
    }

    updateSortIcons() {
        document.querySelectorAll('.sortable i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });

        const activeHeader = document.querySelector(`[data-field="${this.sortField}"] i`);
        if (activeHeader) {
            activeHeader.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'}`;
        }
    }

    renderStockTable() {
        const tbody = document.getElementById('stock-table-body');
        
        if (this.filteredItems.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-2x mb-2"></i><br>
                        No stock items found
                    </td>
                </tr>
            `;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredItems.length);
        const pageItems = this.filteredItems.slice(startIndex, endIndex);

        tbody.innerHTML = pageItems.map(item => `
            <tr>
                <td><strong>${item.code || 'N/A'}</strong></td>
                <td>${item.description || 'No description'}</td>
                <td>
                    <span class="badge bg-secondary">${item.category || 'Uncategorized'}</span>
                </td>
                <td>${item.uom || 'EA'}</td>
                <td>${item.currentStock || 0}</td>
                <td>${item.reorderPoint || 0}</td>
                <td>R ${(item.unitCost || 0).toFixed(2)}</td>
                <td>R ${(item.sellingPrice || 0).toFixed(2)}</td>
                <td>${this.getStockStatusBadge(item)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="stockSelector.editStockItem(${item.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="stockSelector.deleteStockItem(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.renderPagination();
    }

    getStockStatusBadge(item) {
        const current = item.currentStock || 0;
        const reorder = item.reorderPoint || 0;

        if (current === 0) {
            return '<span class="status-indicator status-error"></span><span class="badge bg-danger">Out of Stock</span>';
        } else if (current <= reorder) {
            return '<span class="status-indicator status-pending"></span><span class="badge bg-warning">Low Stock</span>';
        } else {
            return '<span class="status-indicator status-active"></span><span class="badge bg-success">In Stock</span>';
        }
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHtml = `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="stockSelector.goToPage(${this.currentPage - 1})">Previous</a>
            </li>
        `;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || Math.abs(i - this.currentPage) <= 2) {
                paginationHtml += `
                    <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="stockSelector.goToPage(${i})">${i}</a>
                    </li>
                `;
            } else if (Math.abs(i - this.currentPage) === 3) {
                paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        paginationHtml += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="stockSelector.goToPage(${this.currentPage + 1})">Next</a>
            </li>
        `;

        pagination.innerHTML = paginationHtml;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderStockTable();
        }
    }

    updateStockCount() {
        document.getElementById('stock-count').textContent = this.filteredItems.length;
        document.getElementById('total-items').textContent = this.filteredItems.length;
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredItems.length);
        document.getElementById('items-showing').textContent = `${startIndex + 1}-${endIndex}`;
    }

    renderEmptyState() {
        const tbody = document.getElementById('stock-table-body');
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center text-muted py-5">
                    <i class="fas fa-boxes fa-3x mb-3"></i><br>
                    <h5>No stock items found</h5>
                    <p>Start by adding stock items or importing from Excel.</p>
                    <button class="btn btn-primary" onclick="stockSelector.openStockItemModal()">
                        <i class="fas fa-plus"></i> Add First Stock Item
                    </button>
                </td>
            </tr>
        `;
    }

    openStockItemModal(item = null) {
        const modal = new bootstrap.Modal(document.getElementById('stockItemModal'));
        const title = document.getElementById('stockItemModalTitle');
        
        if (item) {
            title.textContent = 'Edit Stock Item';
            this.populateStockForm(item);
        } else {
            title.textContent = 'Add Stock Item';
            document.getElementById('stock-item-form').reset();
        }
        
        modal.show();
    }

    populateStockForm(item) {
        document.getElementById('item-code').value = item.code || '';
        document.getElementById('item-description').value = item.description || '';
        document.getElementById('item-category').value = item.category || '';
        document.getElementById('item-uom').value = item.uom || '';
        document.getElementById('item-current-stock').value = item.currentStock || 0;
        document.getElementById('item-reorder-point').value = item.reorderPoint || 0;
        document.getElementById('item-unit-cost').value = item.unitCost || 0;
        document.getElementById('item-selling-price').value = item.sellingPrice || 0;
        document.getElementById('item-properties').value = item.properties ? JSON.stringify(item.properties, null, 2) : '';
    }

    async saveStockItem() {
        try {
            const formData = {
                code: document.getElementById('item-code').value,
                description: document.getElementById('item-description').value,
                category: document.getElementById('item-category').value,
                uom: document.getElementById('item-uom').value,
                currentStock: parseFloat(document.getElementById('item-current-stock').value) || 0,
                reorderPoint: parseFloat(document.getElementById('item-reorder-point').value) || 0,
                unitCost: parseFloat(document.getElementById('item-unit-cost').value) || 0,
                sellingPrice: parseFloat(document.getElementById('item-selling-price').value) || 0,
                properties: this.parseProperties(document.getElementById('item-properties').value)
            };

            window.app.showLoading(true);
            
            const response = await window.app.apiCall('/stock/items', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            bootstrap.Modal.getInstance(document.getElementById('stockItemModal')).hide();
            window.app.showAlert('Stock item saved successfully!', 'success');
            await this.loadStockItems();
            
        } catch (error) {
            console.error('Failed to save stock item:', error);
            window.app.showAlert('Failed to save stock item. Please try again.', 'danger');
        } finally {
            window.app.showLoading(false);
        }
    }

    parseProperties(propertiesString) {
        try {
            return propertiesString ? JSON.parse(propertiesString) : {};
        } catch (error) {
            console.warn('Invalid JSON in properties field:', error);
            return {};
        }
    }

    editStockItem(itemId) {
        const item = this.stockItems.find(i => i.id === itemId);
        if (item) {
            this.openStockItemModal(item);
        }
    }

    async deleteStockItem(itemId) {
        if (!confirm('Are you sure you want to delete this stock item? This action cannot be undone.')) {
            return;
        }

        try {
            window.app.showLoading(true);
            await window.app.apiCall(`/stock/items/${itemId}`, { method: 'DELETE' });
            window.app.showAlert('Stock item deleted successfully!', 'success');
            await this.loadStockItems();
        } catch (error) {
            console.error('Failed to delete stock item:', error);
            window.app.showAlert('Failed to delete stock item. Please try again.', 'danger');
        } finally {
            window.app.showLoading(false);
        }
    }

    openImportModal() {
        const modal = new bootstrap.Modal(document.getElementById('stockImportModal'));
        modal.show();
    }

    setupFileDropZone() {
        const dropZone = document.getElementById('stock-file-drop');
        const fileInput = document.getElementById('stock-file-input');

        dropZone.addEventListener('click', () => fileInput.click());
        
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
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelection(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelection(e.target.files[0]);
            }
        });
    }

    handleFileSelection(file) {
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            window.app.showAlert('Please select a valid Excel file (.xlsx or .xls)', 'warning');
            return;
        }

        document.getElementById('process-import-btn').disabled = false;
        document.getElementById('process-import-btn').onclick = () => this.processImport(file);
    }

    async processImport(file) {
        try {
            const progressContainer = document.getElementById('import-progress');
            const progressBar = progressContainer.querySelector('.progress-bar');
            
            progressContainer.style.display = 'block';
            progressBar.style.width = '10%';

            const formData = new FormData();
            formData.append('file', file);

            progressBar.style.width = '50%';

            const response = await fetch(`${window.app.apiBaseUrl}/stock/import`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Import failed: ${response.statusText}`);
            }

            progressBar.style.width = '100%';
            
            const result = await response.json();
            
            bootstrap.Modal.getInstance(document.getElementById('stockImportModal')).hide();
            window.app.showAlert(`Successfully imported ${result.importedCount || 0} stock items!`, 'success');
            
            await this.loadStockItems();
            
        } catch (error) {
            console.error('Import failed:', error);
            window.app.showAlert('Import failed. Please check the file format and try again.', 'danger');
        } finally {
            document.getElementById('import-progress').style.display = 'none';
            document.getElementById('process-import-btn').disabled = true;
        }
    }
}

// Make StockSelector globally accessible
window.StockSelector = StockSelector;
