// System Grid - Universal Enterprise Data Grid Component
class SystemGrid {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        // Apply system defaults
        this.options = {
            ...window.SystemDefaults?.grid || {},
            ...options
        };
        
        this.data = [];
        this.columns = [];
        this.filteredData = [];
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.selectedRows = new Set();
        this.currentPage = 1;
        this.pageSize = this.options.pageSize || 25;
        this.columnWidths = {};
        
        this.init();
    }

    init() {
        this.loadColumnState();
        this.render();
        this.setupEventListeners();
    }

    setData(data, columns) {
        this.data = data || [];
        this.columns = columns || [];
        this.filteredData = [...this.data];
        this.currentPage = 1;
        this.selectedRows.clear();
        this.renderGrid();
        this.renderPagination();
        this.updateRowCount();
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="system-grid" id="${this.containerId}-grid">
                ${this.renderToolbar()}
                <div class="grid-container">
                    <div class="grid-wrapper">
                        <table class="grid-table table table-hover mb-0">
                            <thead class="grid-header sticky-top">
                                ${this.renderHeaders()}
                            </thead>
                            <tbody class="grid-body">
                                ${this.renderRows()}
                            </tbody>
                        </table>
                    </div>
                </div>
                ${this.renderPagination()}
            </div>
        `;

        this.setupGridEventListeners();
    }

    renderToolbar() {
        return `
            <div class="grid-toolbar d-flex justify-content-between align-items-center mb-3">
                <div class="toolbar-left d-flex align-items-center">
                    <div class="btn-group me-3" role="group">
                        <button type="button" class="btn btn-outline-primary btn-sm grid-add">
                            <i class="fas fa-plus"></i> Add
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-sm grid-edit" disabled>
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-sm grid-delete" disabled>
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                    
                    <div class="btn-group me-3" role="group">
                        <button type="button" class="btn btn-outline-success btn-sm grid-export">
                            <i class="fas fa-file-excel"></i> Export
                        </button>
                        <button type="button" class="btn btn-outline-info btn-sm grid-refresh">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>

                    <div class="grid-search me-3">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text">
                                <i class="fas fa-search"></i>
                            </span>
                            <input type="text" class="form-control" placeholder="Search..." id="${this.containerId}-search">
                        </div>
                    </div>

                    <div class="grid-row-count">
                        <small class="text-muted">
                            <span id="${this.containerId}-row-count">0 rows</span>
                        </small>
                    </div>
                </div>

                <div class="toolbar-right">
                    <div class="dropdown">
                        <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            <i class="fas fa-cog"></i> Columns
                        </button>
                        <ul class="dropdown-menu" id="${this.containerId}-column-menu">
                            ${this.renderColumnMenu()}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    renderColumnMenu() {
        return this.columns.map(col => `
            <li>
                <label class="dropdown-item">
                    <input type="checkbox" ${col.visible !== false ? 'checked' : ''} 
                           data-column="${col.key}" class="me-2">
                    ${col.title}
                </label>
            </li>
        `).join('');
    }

    renderHeaders() {
        const visibleColumns = this.columns.filter(col => col.visible !== false);
        
        return `
            <tr>
                <th class="select-column" style="width: 40px;">
                    <input type="checkbox" class="form-check-input select-all-checkbox">
                </th>
                ${visibleColumns.map(col => `
                    <th class="sortable-header ${this.sortColumn === col.key ? 'sorted' : ''}" 
                        data-column="${col.key}"
                        style="width: ${this.columnWidths[col.key] || col.width || 'auto'}">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="column-title">${col.title}</span>
                            <div class="column-controls">
                                ${this.sortColumn === col.key ? 
                                    `<i class="fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'}"></i>` :
                                    '<i class="fas fa-sort text-muted"></i>'
                                }
                            </div>
                        </div>
                        <div class="column-resizer"></div>
                    </th>
                `).join('')}
                <th class="actions-column" style="width: 100px;">Actions</th>
            </tr>
        `;
    }

    renderRows() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageData = this.filteredData.slice(startIndex, endIndex);
        const visibleColumns = this.columns.filter(col => col.visible !== false);

        if (pageData.length === 0) {
            return `
                <tr>
                    <td colspan="${visibleColumns.length + 2}" class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-2x mb-2"></i>
                        <div>No records found</div>
                    </td>
                </tr>
            `;
        }

        return pageData.map((row, index) => `
            <tr data-index="${startIndex + index}" class="${this.selectedRows.has(startIndex + index) ? 'selected' : ''}">
                <td class="select-column">
                    <input type="checkbox" class="form-check-input row-checkbox" 
                           ${this.selectedRows.has(startIndex + index) ? 'checked' : ''}>
                </td>
                ${visibleColumns.map(col => `
                    <td data-column="${col.key}">
                        ${this.formatCellValue(row[col.key], col)}
                    </td>
                `).join('')}
                <td class="actions-column">
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-primary btn-sm row-edit" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-sm row-delete" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    formatCellValue(value, column) {
        if (value === null || value === undefined) return '';
        
        switch (column.type) {
            case 'date':
                return new Date(value).toLocaleDateString();
            case 'currency':
                return new Intl.NumberFormat('en-ZA', { 
                    style: 'currency', 
                    currency: 'ZAR' 
                }).format(value);
            case 'number':
                return parseFloat(value).toLocaleString();
            case 'boolean':
                return value ? 
                    '<i class="fas fa-check text-success"></i>' : 
                    '<i class="fas fa-times text-muted"></i>';
            default:
                return String(value);
        }
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        if (totalPages <= 1) return '';

        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return `
            <div class="grid-pagination d-flex justify-content-between align-items-center mt-3">
                <div class="page-info">
                    <small class="text-muted">
                        Showing ${((this.currentPage - 1) * this.pageSize) + 1} to 
                        ${Math.min(this.currentPage * this.pageSize, this.filteredData.length)} 
                        of ${this.filteredData.length} entries
                    </small>
                </div>
                <nav>
                    <ul class="pagination pagination-sm mb-0">
                        <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                            <button class="page-link" data-page="1">First</button>
                        </li>
                        <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                            <button class="page-link" data-page="${this.currentPage - 1}">Previous</button>
                        </li>
                        ${pages.map(page => `
                            <li class="page-item ${page === this.currentPage ? 'active' : ''}">
                                <button class="page-link" data-page="${page}">${page}</button>
                            </li>
                        `).join('')}
                        <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                            <button class="page-link" data-page="${this.currentPage + 1}">Next</button>
                        </li>
                        <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                            <button class="page-link" data-page="${totalPages}">Last</button>
                        </li>
                    </ul>
                </nav>
            </div>
        `;
    }

    setupEventListeners() {
        // Listen for system events
        document.addEventListener('system-grid-refresh', (event) => {
            if (event.detail.gridId === this.containerId) {
                this.refresh();
            }
        });
    }

    setupGridEventListeners() {
        // Search functionality
        const searchInput = document.getElementById(`${this.containerId}-search`);
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Column sorting
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.sortable-header')) {
                const header = e.target.closest('.sortable-header');
                const column = header.getAttribute('data-column');
                this.handleSort(column);
            }
        });

        // Row selection
        this.container.addEventListener('change', (e) => {
            if (e.target.classList.contains('select-all-checkbox')) {
                this.handleSelectAll(e.target.checked);
            } else if (e.target.classList.contains('row-checkbox')) {
                const row = e.target.closest('tr');
                const index = parseInt(row.getAttribute('data-index'));
                this.handleRowSelect(index, e.target.checked);
            }
        });

        // Toolbar actions
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.grid-add')) {
                this.dispatchEvent('add');
            } else if (e.target.closest('.grid-edit')) {
                this.dispatchEvent('edit', { selectedRows: Array.from(this.selectedRows) });
            } else if (e.target.closest('.grid-delete')) {
                this.dispatchEvent('delete', { selectedRows: Array.from(this.selectedRows) });
            } else if (e.target.closest('.grid-export')) {
                this.exportToExcel();
            } else if (e.target.closest('.grid-refresh')) {
                this.dispatchEvent('refresh');
            } else if (e.target.closest('.row-edit')) {
                const row = e.target.closest('tr');
                const index = parseInt(row.getAttribute('data-index'));
                this.dispatchEvent('edit-row', { index, data: this.filteredData[index] });
            } else if (e.target.closest('.row-delete')) {
                const row = e.target.closest('tr');
                const index = parseInt(row.getAttribute('data-index'));
                this.dispatchEvent('delete-row', { index, data: this.filteredData[index] });
            }
        });

        // Pagination
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-link')) {
                e.preventDefault();
                const page = parseInt(e.target.getAttribute('data-page'));
                this.goToPage(page);
            }
        });
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.filteredData = [...this.data];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredData = this.data.filter(row => {
                return this.columns.some(col => {
                    const value = row[col.key];
                    return value && String(value).toLowerCase().includes(searchTerm);
                });
            });
        }
        
        this.currentPage = 1;
        this.selectedRows.clear();
        this.renderGrid();
        this.renderPagination();
        this.updateRowCount();
    }

    handleSort(columnKey) {
        if (this.sortColumn === columnKey) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = columnKey;
            this.sortDirection = 'asc';
        }

        this.filteredData.sort((a, b) => {
            let aVal = a[columnKey];
            let bVal = b[columnKey];

            // Handle null/undefined values
            if (aVal === null || aVal === undefined) aVal = '';
            if (bVal === null || bVal === undefined) bVal = '';

            // Convert to comparable values
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            let result = 0;
            if (aVal < bVal) result = -1;
            else if (aVal > bVal) result = 1;

            return this.sortDirection === 'asc' ? result : -result;
        });

        this.renderGrid();
    }

    handleSelectAll(checked) {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;

        for (let i = startIndex; i < endIndex && i < this.filteredData.length; i++) {
            if (checked) {
                this.selectedRows.add(i);
            } else {
                this.selectedRows.delete(i);
            }
        }

        this.updateRowSelection();
        this.updateToolbarState();
    }

    handleRowSelect(index, checked) {
        if (checked) {
            this.selectedRows.add(index);
        } else {
            this.selectedRows.delete(index);
        }

        this.updateToolbarState();
    }

    updateRowSelection() {
        const checkboxes = this.container.querySelectorAll('.row-checkbox');
        const rows = this.container.querySelectorAll('.grid-body tr[data-index]');

        checkboxes.forEach((checkbox, idx) => {
            const row = rows[idx];
            const index = parseInt(row.getAttribute('data-index'));
            const isSelected = this.selectedRows.has(index);
            
            checkbox.checked = isSelected;
            row.classList.toggle('selected', isSelected);
        });
    }

    updateToolbarState() {
        const hasSelection = this.selectedRows.size > 0;
        const editBtn = this.container.querySelector('.grid-edit');
        const deleteBtn = this.container.querySelector('.grid-delete');

        if (editBtn) editBtn.disabled = !hasSelection;
        if (deleteBtn) deleteBtn.disabled = !hasSelection;
    }

    updateRowCount() {
        const countElement = document.getElementById(`${this.containerId}-row-count`);
        if (countElement) {
            const count = this.filteredData.length;
            countElement.textContent = `${count} row${count !== 1 ? 's' : ''}`;
        }
    }

    renderGrid() {
        const tbody = this.container.querySelector('.grid-body');
        const thead = this.container.querySelector('.grid-header');
        
        if (tbody) {
            tbody.innerHTML = this.renderRows();
        }
        
        if (thead) {
            thead.innerHTML = this.renderHeaders();
        }

        this.updateRowSelection();
        this.updateToolbarState();
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderGrid();
            this.renderPagination();
        }
    }

    exportToExcel() {
        // Implement Excel export
        this.dispatchEvent('export', { 
            data: this.filteredData,
            columns: this.columns.filter(col => col.visible !== false)
        });
    }

    dispatchEvent(eventType, data = {}) {
        const event = new CustomEvent(`system-grid-${eventType}`, {
            detail: {
                gridId: this.containerId,
                ...data
            }
        });
        document.dispatchEvent(event);
    }

    refresh() {
        this.dispatchEvent('refresh');
    }

    loadColumnState() {
        const state = localStorage.getItem(`millennium-grid-${this.containerId}`);
        if (state) {
            const parsedState = JSON.parse(state);
            this.columnWidths = parsedState.columnWidths || {};
        }
    }

    saveColumnState() {
        const state = {
            columnWidths: this.columnWidths
        };
        localStorage.setItem(`millennium-grid-${this.containerId}`, JSON.stringify(state));
    }
}

// Make globally accessible
window.SystemGrid = SystemGrid;