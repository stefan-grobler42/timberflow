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
                <div class="table-responsive">
                    <table class="table table-hover table-striped" id="data-grid-table">
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
        this.addResizableColumns();
    }

    addResizableColumns() {
        // Add CSS for column resizing
        if (!document.getElementById('resizable-columns-css')) {
            const style = document.createElement('style');
            style.id = 'resizable-columns-css';
            style.textContent = `
                .resizable-column {
                    min-width: 80px;
                    max-width: 500px;
                    position: relative;
                }
                .resize-handle {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 5px;
                    height: 100%;
                    cursor: col-resize;
                    background: transparent;
                    z-index: 1001;
                }
                .resize-handle:hover {
                    background: rgba(0, 123, 255, 0.3);
                }
                .table th.resizable-column {
                    border-right: 2px solid #dee2e6;
                }
                .resizing {
                    user-select: none;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add resize event listeners
        this.setupColumnResizing();
    }

    setupColumnResizing() {
        // Remove existing resize event listeners to prevent duplicates
        if (this.resizeListeners) {
            this.resizeListeners.forEach(listener => {
                document.removeEventListener(listener.type, listener.handler);
            });
        }
        
        this.resizeListeners = [];
        let isResizing = false;
        let currentColumn = null;
        let startX = 0;
        let startWidth = 0;

        // Use event delegation for mousedown on the container
        const mouseDownHandler = (e) => {
            if (e.target.classList.contains('resize-handle')) {
                console.log('Resize handle clicked! Starting resize...'); // Debug log
                isResizing = true;
                currentColumn = e.target.parentElement;
                startX = e.pageX;
                startWidth = parseInt(window.getComputedStyle(currentColumn).width, 10);
                document.body.classList.add('resizing');
                console.log('Initial width:', startWidth, 'Start X:', startX);
                e.preventDefault();
                e.stopPropagation();
            }
        };

        const mouseMoveHandler = (e) => {
            if (!isResizing) return;
            
            const width = startWidth + e.pageX - startX;
            console.log('Resizing to width:', width); // Debug log
            if (width >= 80 && width <= 500) {
                currentColumn.style.width = width + 'px';
                
                // Update the column configuration
                const field = currentColumn.dataset.field;
                const columnConfig = this.columns.find(col => col.field === field);
                if (columnConfig) {
                    columnConfig.width = width + 'px';
                }
            }
        };

        const mouseUpHandler = () => {
            if (isResizing) {
                console.log('Resize completed!'); // Debug log
                isResizing = false;
                currentColumn = null;
                document.body.classList.remove('resizing');
            }
        };

        this.container.addEventListener('mousedown', mouseDownHandler);
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
        
        // Store listeners for cleanup
        this.resizeListeners = [
            { type: 'mousemove', handler: mouseMoveHandler },
            { type: 'mouseup', handler: mouseUpHandler }
        ];
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
                <th style="width: 40px;">
                    <input type="checkbox" id="select-all-checkbox" class="form-check-input">
                </th>
                ${selectableColumns.map(col => `
                    <th class="sortable-header resizable-column" data-field="${col.field}" style="cursor: pointer; ${col.width ? `width: ${col.width};` : ''} position: relative; min-width: 80px; border-right: 2px solid #dee2e6;">
                        <div class="d-flex justify-content-between align-items-center" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none;">
                            <span style="overflow: hidden; text-overflow: ellipsis;">${col.header}</span>
                            <span class="sort-indicator">
                                ${this.getSortIndicator(col.field)}
                            </span>
                        </div>
                        <div class="resize-handle" style="position: absolute; top: 0; right: -2px; width: 8px; height: 100%; cursor: col-resize; background: rgba(255,0,0,0.1); z-index: 1001;" title="Drag to resize column"></div>
                    </th>
                `).join('')}
                <th style="width: 120px;">Actions</th>
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
                        <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: ${col.width || '200px'};" title="${this.getPlainTextValue(row[col.field])}">${this.formatCellValue(row[col.field], col)}</td>
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

    getPlainTextValue(value) {
        if (value === null || value === undefined) return '';
        return String(value);
    }

    updateSelectionInfo() {
        const selectedCountElement = document.getElementById('selected-count');
        const totalCountElement = document.getElementById('total-count');
        
        if (selectedCountElement) {
            selectedCountElement.textContent = this.selectedRows.size;
        }
        if (totalCountElement) {
            totalCountElement.textContent = this.filteredData.length;
        }
    }

    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        if (selectAllCheckbox && this.filteredData.length > 0) {
            const allSelected = this.filteredData.every(row => this.selectedRows.has(row.id));
            const someSelected = this.filteredData.some(row => this.selectedRows.has(row.id));
            
            selectAllCheckbox.checked = allSelected;
            selectAllCheckbox.indeterminate = someSelected && !allSelected;
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

        // Row selection and select all using event delegation
        this.container.addEventListener('change', (e) => {
            // Handle individual row checkboxes
            if (e.target.classList.contains('row-checkbox')) {
                const id = parseInt(e.target.dataset.id);
                if (e.target.checked) {
                    this.selectedRows.add(id);
                } else {
                    this.selectedRows.delete(id);
                }
                this.updateSelectionInfo();
                this.updateSelectAllCheckbox();
                this.onSelectionChange(Array.from(this.selectedRows));
            }
            
            // Handle select all checkbox
            if (e.target.id === 'select-all-checkbox') {
                if (e.target.checked) {
                    // Select all filtered rows
                    this.filteredData.forEach(row => this.selectedRows.add(row.id));
                } else {
                    // Clear all selections
                    this.selectedRows.clear();
                }
                this.updateTable();
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
        this.updateSelectAllCheckbox();
        
        // Re-setup column resizing after table update
        this.setupColumnResizing();
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
}