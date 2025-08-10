// Enhanced Data Grid with sorting, column management, multi-select, and export
class EnhancedDataGrid {
    constructor(containerId, config) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.config = config;
        this.data = [];
        this.filteredData = [];
        this.selectedRows = new Set();
        this.sortConfig = { field: null, direction: 'asc' };
        this.searchTerm = '';
        
        // Column configuration
        this.columns = config.columns || [];
        this.visibleColumns = new Set(this.columns.map(col => col.field));
        
        // Callbacks
        this.onRowClick = config.onRowClick || (() => {});
        this.onRowDoubleClick = config.onRowDoubleClick || (() => {});
        this.onSelectionChange = config.onSelectionChange || (() => {});
        
        this.init();
    }

    init() {
        this.render();
    }

    setData(data) {
        this.data = data;
        this.filteredData = [...data];
        this.selectedRows.clear();
        this.applyFiltersAndSort();
        this.updateTable();
    }

    render() {
        this.container.innerHTML = `
            <style>
                .column-resizer {
                    position: absolute;
                    right: 0;
                    top: 0;
                    bottom: 0;
                    width: 3px;
                    background: transparent;
                    cursor: col-resize;
                    z-index: 1051;
                }
                .column-resizer:hover {
                    background: #007bff;
                }
                .resizable-header {
                    position: relative;
                    overflow: hidden;
                }
                .resizable-table td {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .table-responsive {
                    max-width: 100%;
                }
            </style>
            <div class="enhanced-grid-container">
                <!-- Toolbar -->
                <div class="grid-toolbar d-flex justify-content-between align-items-center mb-3">
                    <div class="d-flex align-items-center gap-2">
                        <div class="input-group" style="width: 300px;">
                            <span class="input-group-text">
                                <i class="fas fa-search"></i>
                            </span>
                            <input type="text" class="form-control" id="grid-search" placeholder="Search...">
                        </div>
                        <button class="btn btn-outline-secondary dropdown-toggle" type="button" 
                                id="columnsDropdown" data-bs-toggle="dropdown">
                            <i class="fas fa-columns"></i> Columns
                        </button>
                        <ul class="dropdown-menu" id="columns-menu" style="z-index: 1060;">
                            ${this.renderColumnMenu()}
                        </ul>
                    </div>
                    
                    <div class="d-flex align-items-center gap-2">
                        <div class="text-muted small" id="selection-info">
                            <span id="selected-count">0</span> of <span id="total-count">${this.data.length}</span> selected
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-success dropdown-toggle" type="button" 
                                    id="exportDropdown" data-bs-toggle="dropdown">
                                <i class="fas fa-download"></i> Export
                            </button>
                            <ul class="dropdown-menu" style="z-index: 1060;">
                                <li><a class="dropdown-item" id="export-all" href="#"><i class="fas fa-table"></i> Export All to Excel</a></li>
                                <li><a class="dropdown-item" id="export-selected" href="#"><i class="fas fa-check-square"></i> Export Selected to Excel</a></li>
                            </ul>
                        </div>
                        ${this.config.showNewButton !== false ? `
                            <button class="btn btn-primary" id="new-record-btn">
                                <i class="fas fa-plus"></i> New ${this.config.entityName || 'Record'}
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Table Container -->
                <div class="table-responsive" style="overflow-x: auto;">
                    <table class="table table-hover table-striped resizable-table" id="data-grid-table" style="min-width: 100%; table-layout: fixed;">
                        <thead class="table-dark sticky-top" style="z-index: 1050;">
                            ${this.renderTableHeader()}
                        </thead>
                        <tbody id="grid-tbody">
                            ${this.renderTableRows()}
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div class="d-flex justify-content-between align-items-center mt-3">
                    <div class="text-muted small">
                        Showing ${this.filteredData.length} of ${this.data.length} records
                    </div>
                    <nav id="grid-pagination">
                        <!-- Pagination will be added here if needed -->
                    </nav>
                </div>
            </div>
        `;

        this.attachEventListeners();
        this.initializeColumnResizing();
    }

    renderColumnMenu() {
        return this.columns.map(col => `
            <li>
                <label class="dropdown-item">
                    <input type="checkbox" class="column-toggle me-2" 
                           data-field="${col.field}" 
                           ${this.visibleColumns.has(col.field) ? 'checked' : ''}>
                    ${col.header}
                </label>
            </li>
        `).join('');
    }

    renderTableHeader() {
        const selectableColumns = this.columns.filter(col => this.visibleColumns.has(col.field));
        
        return `
            <tr>
                <th class="resizable-header" style="width: 50px; min-width: 50px;">
                    <input type="checkbox" id="select-all-checkbox" class="form-check-input">
                    <div class="column-resizer"></div>
                </th>
                ${selectableColumns.map(col => `
                    <th class="sortable-header resizable-header" data-field="${col.field}" 
                        style="cursor: pointer; width: ${col.width || '150px'}; min-width: 100px; position: relative;">
                        <div class="d-flex justify-content-between align-items-center">
                            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${col.header}</span>
                            <span class="sort-indicator">
                                ${this.getSortIndicator(col.field)}
                            </span>
                        </div>
                        <div class="column-resizer"></div>
                    </th>
                `).join('')}
                <th class="resizable-header" style="width: 120px; min-width: 100px;">
                    Actions
                    <div class="column-resizer"></div>
                </th>
            </tr>
        `;
    }

    getSortIndicator(field) {
        if (this.sortConfig.field !== field) {
            return '<i class="fas fa-sort text-muted"></i>';
        }
        return this.sortConfig.direction === 'asc' 
            ? '<i class="fas fa-sort-up text-primary"></i>'
            : '<i class="fas fa-sort-down text-primary"></i>';
    }

    renderTableRows() {
        if (this.filteredData.length === 0) {
            const colCount = this.columns.filter(col => this.visibleColumns.has(col.field)).length + 2;
            return `
                <tr>
                    <td colspan="${colCount}" class="text-center py-4">
                        <div class="text-muted">
                            <i class="fas fa-inbox fa-2x mb-3"></i>
                            <p>No records found</p>
                        </div>
                    </td>
                </tr>
            `;
        }

        return this.filteredData.map(row => {
            const isSelected = this.selectedRows.has(row.id);
            const selectableColumns = this.columns.filter(col => this.visibleColumns.has(col.field));
            
            return `
                <tr class="data-row ${isSelected ? 'table-active' : ''}" data-id="${row.id}">
                    <td>
                        <input type="checkbox" class="row-checkbox form-check-input" 
                               data-id="${row.id}" ${isSelected ? 'checked' : ''}>
                    </td>
                    ${selectableColumns.map(col => `
                        <td>${this.formatCellValue(row[col.field], col)}</td>
                    `).join('')}
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary edit-btn" data-id="${row.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger delete-btn" data-id="${row.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    formatCellValue(value, column) {
        if (value === null || value === undefined) return '';
        
        switch (column.type) {
            case 'currency':
                return `R ${parseFloat(value).toFixed(2)}`;
            case 'number':
                return parseFloat(value).toLocaleString();
            case 'date':
                return new Date(value).toLocaleDateString();
            case 'boolean':
                return value ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-danger"></i>';
            case 'badge':
                const badgeClass = column.badgeClasses?.[value] || 'bg-secondary';
                return `<span class="badge ${badgeClass}">${value}</span>`;
            default:
                return String(value);
        }
    }

    attachEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('grid-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.applyFiltersAndSort();
                this.updateTable();
            });
        }

        // Column visibility toggles
        const columnToggles = document.querySelectorAll('.column-toggle');
        columnToggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const field = e.target.dataset.field;
                if (e.target.checked) {
                    this.visibleColumns.add(field);
                } else {
                    this.visibleColumns.delete(field);
                }
                this.updateTable();
            });
        });

        // Select all checkbox
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.filteredData.forEach(row => this.selectedRows.add(row.id));
                } else {
                    this.selectedRows.clear();
                }
                this.updateTable();
                this.onSelectionChange(Array.from(this.selectedRows));
            });
        }

        // Row selection
        this.container.addEventListener('change', (e) => {
            if (e.target.classList.contains('row-checkbox')) {
                const id = parseInt(e.target.dataset.id);
                if (e.target.checked) {
                    this.selectedRows.add(id);
                } else {
                    this.selectedRows.delete(id);
                }
                this.updateSelectionDisplay();
                this.onSelectionChange(Array.from(this.selectedRows));
            }
        });

        // Row clicks
        this.container.addEventListener('click', (e) => {
            const row = e.target.closest('.data-row');
            if (row && !e.target.closest('button') && !e.target.closest('input')) {
                const id = parseInt(row.dataset.id);
                this.onRowClick(id);
            }

            // Edit buttons
            if (e.target.closest('.edit-btn')) {
                const id = parseInt(e.target.closest('.edit-btn').dataset.id);
                this.onRowClick(id);
            }

            // Delete buttons
            if (e.target.closest('.delete-btn')) {
                const id = parseInt(e.target.closest('.delete-btn').dataset.id);
                if (this.config.onDelete) {
                    this.config.onDelete(id);
                }
            }
        });

        // Row double clicks
        this.container.addEventListener('dblclick', (e) => {
            const row = e.target.closest('.data-row');
            if (row) {
                const id = parseInt(row.dataset.id);
                this.onRowDoubleClick(id);
            }
        });

        // Column sorting
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.sortable-header')) {
                const field = e.target.closest('.sortable-header').dataset.field;
                this.sort(field);
            }
        });

        // Export buttons
        const exportAll = document.getElementById('export-all');
        const exportSelected = document.getElementById('export-selected');
        if (exportAll) {
            exportAll.addEventListener('click', () => this.exportToExcel());
        }
        if (exportSelected) {
            exportSelected.addEventListener('click', () => this.exportToExcel(true));
        }

        // New record button
        const newBtn = document.getElementById('new-record-btn');
        if (newBtn && this.config.onNew) {
            newBtn.addEventListener('click', () => this.config.onNew());
        }
    }

    sort(field) {
        if (this.sortConfig.field === field) {
            this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortConfig.field = field;
            this.sortConfig.direction = 'asc';
        }
        
        this.applyFiltersAndSort();
        this.updateTable();
    }

    applyFiltersAndSort() {
        // Apply search filter
        this.filteredData = this.data.filter(row => {
            if (!this.searchTerm) return true;
            
            const searchLower = this.searchTerm.toLowerCase();
            return this.columns.some(col => {
                const value = row[col.field];
                if (value === null || value === undefined) return false;
                return String(value).toLowerCase().includes(searchLower);
            });
        });

        // Apply sorting
        if (this.sortConfig.field) {
            this.filteredData.sort((a, b) => {
                const aVal = a[this.sortConfig.field];
                const bVal = b[this.sortConfig.field];
                
                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;
                
                let comparison = 0;
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    comparison = aVal - bVal;
                } else {
                    comparison = String(aVal).localeCompare(String(bVal));
                }
                
                return this.sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }
    }

    updateTable() {
        const tbody = document.getElementById('grid-tbody');
        const thead = this.container.querySelector('thead');
        if (tbody) {
            tbody.innerHTML = this.renderTableRows();
        }
        if (thead) {
            thead.innerHTML = this.renderTableHeader();
        }
        this.updateSelectionInfo();
        this.initializeColumnResizing();
    }

    updateSelectionInfo() {
        const selectedCount = document.getElementById('selected-count');
        const totalCount = document.getElementById('total-count');
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        
        if (selectedCount) {
            selectedCount.textContent = this.selectedRows.size;
        }
        if (totalCount) {
            totalCount.textContent = this.filteredData.length;
        }
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = this.selectedRows.size === this.filteredData.length && this.filteredData.length > 0;
            selectAllCheckbox.indeterminate = this.selectedRows.size > 0 && this.selectedRows.size < this.filteredData.length;
        }
    }

    exportToExcel(selectedOnly = false) {
        const dataToExport = selectedOnly 
            ? this.data.filter(row => this.selectedRows.has(row.id))
            : this.filteredData;

        if (selectedOnly && dataToExport.length === 0) {
            alert('No records selected for export');
            return;
        }

        // Create workbook
        const ws_data = [];
        
        // Headers
        const visibleColumns = this.columns.filter(col => this.visibleColumns.has(col.field));
        ws_data.push(visibleColumns.map(col => col.header));
        
        // Data rows
        dataToExport.forEach(row => {
            ws_data.push(visibleColumns.map(col => {
                const value = row[col.field];
                if (value === null || value === undefined) return '';
                return value;
            }));
        });

        // Convert to CSV for simple export
        const csvContent = ws_data.map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const filename = `${this.config.entityName || 'export'}_${selectedOnly ? 'selected_' : ''}${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    getSelectedData() {
        return this.data.filter(row => this.selectedRows.has(row.id));
    }

    clearSelection() {
        this.selectedRows.clear();
        this.updateTable();
        this.onSelectionChange([]);
    }

    selectAll() {
        this.filteredData.forEach(row => this.selectedRows.add(row.id));
        this.updateTable();
        this.onSelectionChange(Array.from(this.selectedRows));
    }

    initializeColumnResizing() {
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        let currentTh = null;

        // Add event listeners to column resizers
        this.container.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('column-resizer')) {
                isResizing = true;
                startX = e.clientX;
                currentTh = e.target.parentElement;
                startWidth = parseInt(window.getComputedStyle(currentTh).width, 10);
                
                e.preventDefault();
                document.body.style.cursor = 'col-resize';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const width = startWidth + e.clientX - startX;
            if (width > 50) { // Minimum column width
                currentTh.style.width = width + 'px';
                
                // Update corresponding body cells
                const columnIndex = Array.from(currentTh.parentElement.children).indexOf(currentTh);
                const tbody = this.container.querySelector('#grid-tbody');
                if (tbody) {
                    const rows = tbody.querySelectorAll('tr');
                    rows.forEach(row => {
                        const cell = row.children[columnIndex];
                        if (cell) {
                            cell.style.width = width + 'px';
                        }
                    });
                }
                
                // Increase total table width to accommodate wider columns
                const table = this.container.querySelector('#data-grid-table');
                if (table) {
                    const totalWidth = Array.from(currentTh.parentElement.children)
                        .reduce((sum, th) => sum + parseInt(window.getComputedStyle(th).width, 10), 0);
                    table.style.minWidth = totalWidth + 'px';
                }
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                currentTh = null;
                document.body.style.cursor = '';
            }
        });
    }
}