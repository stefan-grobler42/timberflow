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
        this.columnWidths = new Map(); // Store column widths for persistence
        this.storageKey = `grid-settings-${this.config.entityName || 'default'}`; // Unique storage key per grid
        
        // Column configuration
        this.defaultColumns = [...(config.columns || [])]; // Keep original order
        this.columns = [...(config.columns || [])]; // Working copy
        this.visibleColumns = new Set(this.columns.map(col => col.field));
        
        // Callbacks
        this.onRowClick = config.onRowClick || (() => {});
        this.onRowDoubleClick = config.onRowDoubleClick || (() => {});
        this.onSelectionChange = config.onSelectionChange || (() => {});
        
        this.init();
    }

    init() {
        this.loadColumnSettings();
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
                    background: #59AAD5;
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
                        <button class="btn btn-outline-secondary" type="button" id="columnSettingsBtn">
                            <i class="fas fa-columns"></i> Column Settings
                        </button>
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
                        <thead class="sticky-top" style="z-index: 1050; background-color: #59AAD5; color: white;">
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

                <!-- Column Settings Modal -->
                <div class="modal fade" id="columnSettingsModal" tabindex="-1">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-columns"></i> Column Settings
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <p class="text-muted small mb-3">
                                    Show/hide columns, reorder them, and save your preferences as default.
                                </p>
                                <div id="column-settings-list">
                                    ${this.renderColumnSettingsList()}
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-secondary" id="resetColumnsBtn">
                                    <i class="fas fa-undo"></i> Reset to Default
                                </button>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                    Cancel
                                </button>
                                <button type="button" class="btn btn-primary" id="saveColumnSettingsBtn">
                                    <i class="fas fa-save"></i> Save as Default
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
        this.initializeColumnResizing();
    }

    renderColumnSettingsList() {
        return this.columns.map((col, index) => `
            <div class="d-flex align-items-center justify-content-between p-2 border-bottom" data-field="${col.field}">
                <div class="d-flex align-items-center gap-2" style="flex: 1;">
                    <i class="fas fa-grip-vertical text-muted" style="cursor: grab;"></i>
                    <input type="checkbox" class="form-check-input column-visibility-toggle" 
                           data-field="${col.field}" 
                           ${this.visibleColumns.has(col.field) ? 'checked' : ''}>
                    <label class="form-check-label" style="flex: 1; cursor: pointer;">
                        ${col.header}
                    </label>
                </div>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary btn-sm move-up-btn" 
                            ${index === 0 ? 'disabled' : ''}
                            data-field="${col.field}">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="btn btn-outline-secondary btn-sm move-down-btn" 
                            ${index === this.columns.length - 1 ? 'disabled' : ''}
                            data-field="${col.field}">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                </div>
            </div>
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
                        style="cursor: pointer; width: ${this.columnWidths.get(col.field) ? this.columnWidths.get(col.field) + 'px' : (col.width || '150px')}; min-width: 100px; position: relative;">
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
                        <td style="width: ${this.columnWidths.get(col.field) ? this.columnWidths.get(col.field) + 'px' : (col.width || '150px')}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.formatCellValue(row[col.field], col)}</td>
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



        // Row selection and select all - combined into one event listener
        this.container.addEventListener('change', (e) => {
            if (e.target.classList.contains('row-checkbox')) {
                const id = parseInt(e.target.dataset.id);
                if (e.target.checked) {
                    this.selectedRows.add(id);
                } else {
                    this.selectedRows.delete(id);
                }
                this.updateSelectionInfo();
                this.onSelectionChange(Array.from(this.selectedRows));
            } else if (e.target.id === 'select-all-checkbox') {
                if (e.target.checked) {
                    this.filteredData.forEach(row => this.selectedRows.add(row.id));
                } else {
                    this.selectedRows.clear();
                }
                this.updateTable();
                this.updateSelectionInfo();
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
            if (e.target.closest('.sortable-header') && !e.target.closest('.column-resizer')) {
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

        // Column Settings Button
        const columnSettingsBtn = document.getElementById('columnSettingsBtn');
        if (columnSettingsBtn) {
            columnSettingsBtn.addEventListener('click', () => {
                const modalEl = document.getElementById('columnSettingsModal');
                if (modalEl) {
                    const modal = new bootstrap.Modal(modalEl);
                    modal.show();
                    this.attachColumnSettingsListeners();
                }
            });
        }

        // Column Settings Modal Actions
        const saveSettingsBtn = document.getElementById('saveColumnSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveColumnSettings());
        }

        const resetBtn = document.getElementById('resetColumnsBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetColumnSettings());
        }
    }

    attachColumnSettingsListeners() {
        // Column visibility toggles in modal
        const visibilityToggles = document.querySelectorAll('.column-visibility-toggle');
        visibilityToggles.forEach(toggle => {
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

        // Move up buttons
        document.querySelectorAll('.move-up-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const field = e.currentTarget.dataset.field;
                const currentIndex = this.columns.findIndex(col => col.field === field);
                if (currentIndex > 0) {
                    // Swap with previous
                    [this.columns[currentIndex - 1], this.columns[currentIndex]] = 
                    [this.columns[currentIndex], this.columns[currentIndex - 1]];
                    
                    // Re-render the list and table
                    const settingsList = document.getElementById('column-settings-list');
                    if (settingsList) {
                        settingsList.innerHTML = this.renderColumnSettingsList();
                        this.attachColumnSettingsListeners();
                    }
                    this.updateTable();
                }
            });
        });

        // Move down buttons
        document.querySelectorAll('.move-down-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const field = e.currentTarget.dataset.field;
                const currentIndex = this.columns.findIndex(col => col.field === field);
                if (currentIndex < this.columns.length - 1) {
                    // Swap with next
                    [this.columns[currentIndex], this.columns[currentIndex + 1]] = 
                    [this.columns[currentIndex + 1], this.columns[currentIndex]];
                    
                    // Re-render the list and table
                    const settingsList = document.getElementById('column-settings-list');
                    if (settingsList) {
                        settingsList.innerHTML = this.renderColumnSettingsList();
                        this.attachColumnSettingsListeners();
                    }
                    this.updateTable();
                }
            });
        });
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

    loadColumnSettings() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const settings = JSON.parse(saved);
                
                // Load column widths
                if (settings.widths) {
                    this.columnWidths = new Map(Object.entries(settings.widths));
                }
                
                // Load column visibility
                if (settings.visibility) {
                    this.visibleColumns = new Set(settings.visibility);
                }
                
                // Load column order
                if (settings.order && settings.order.length > 0) {
                    // Reorder columns based on saved order
                    const orderedColumns = [];
                    settings.order.forEach(field => {
                        const col = this.columns.find(c => c.field === field);
                        if (col) orderedColumns.push(col);
                    });
                    // Add any new columns that weren't in saved order
                    this.columns.forEach(col => {
                        if (!settings.order.includes(col.field)) {
                            orderedColumns.push(col);
                        }
                    });
                    this.columns = orderedColumns;
                }
                
                // Load sort config
                if (settings.sort) {
                    this.sortConfig = settings.sort;
                }
            }
        } catch (error) {
            console.warn('Failed to load column settings:', error);
        }
    }

    saveColumnWidths() {
        // Auto-save just column widths during resize (lightweight)
        try {
            const saved = localStorage.getItem(this.storageKey);
            let settings = saved ? JSON.parse(saved) : {};
            settings.widths = Object.fromEntries(this.columnWidths);
            localStorage.setItem(this.storageKey, JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save column widths:', error);
        }
    }

    saveColumnSettings() {
        try {
            const settings = {
                widths: Object.fromEntries(this.columnWidths),
                visibility: Array.from(this.visibleColumns),
                order: this.columns.map(col => col.field),
                sort: this.sortConfig
            };
            localStorage.setItem(this.storageKey, JSON.stringify(settings));
            
            // Show success message
            const modalEl = document.getElementById('columnSettingsModal');
            if (modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modal.hide();
            }
            
            // Show toast or alert
            alert('Column settings saved successfully!');
        } catch (error) {
            console.warn('Failed to save column settings:', error);
            alert('Failed to save column settings');
        }
    }

    resetColumnSettings() {
        try {
            // Reset to default configuration
            this.columns = [...this.defaultColumns];
            this.visibleColumns = new Set(this.columns.map(col => col.field));
            this.columnWidths.clear();
            this.sortConfig = { field: null, direction: 'asc' };
            
            // Clear localStorage
            localStorage.removeItem(this.storageKey);
            
            // Re-render the modal content and table
            const settingsList = document.getElementById('column-settings-list');
            if (settingsList) {
                settingsList.innerHTML = this.renderColumnSettingsList();
                this.attachColumnSettingsListeners();
            }
            this.updateTable();
            
            alert('Column settings reset to default');
        } catch (error) {
            console.warn('Failed to reset column settings:', error);
        }
    }

    calculateOptimalColumnWidth(field) {
        // Find the column definition
        const column = this.columns.find(col => col.field === field);
        if (!column) return 150;

        // Create a temporary element to measure text width
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.whiteSpace = 'nowrap';
        tempDiv.style.font = window.getComputedStyle(this.container.querySelector('table')).font;
        document.body.appendChild(tempDiv);

        let maxWidth = 0;

        // Measure header width
        tempDiv.textContent = column.header;
        maxWidth = Math.max(maxWidth, tempDiv.offsetWidth);

        // Measure data content width (sample up to 20 rows for performance)
        const sampleData = this.filteredData.slice(0, 20);
        sampleData.forEach(row => {
            const value = this.formatCellValue(row[field], column);
            // Remove HTML tags for width calculation
            const textValue = value.replace(/<[^>]*>/g, '');
            tempDiv.textContent = textValue;
            maxWidth = Math.max(maxWidth, tempDiv.offsetWidth);
        });

        document.body.removeChild(tempDiv);

        // Add padding and minimum/maximum constraints
        const padding = 40; // Account for cell padding and sort icons
        const minWidth = 80;
        const maxWidth_limit = 400;
        
        return Math.min(Math.max(maxWidth + padding, minWidth), maxWidth_limit);
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
                e.stopPropagation(); // Prevent other click events
                document.body.style.cursor = 'col-resize';
            }
        });

        // Double-click to auto-fit column width
        this.container.addEventListener('dblclick', (e) => {
            if (e.target.classList.contains('column-resizer')) {
                const th = e.target.parentElement;
                const field = th.dataset.field;
                if (field) {
                    const optimalWidth = this.calculateOptimalColumnWidth(field);
                    th.style.width = optimalWidth + 'px';
                    
                    // Update corresponding body cells
                    const columnIndex = Array.from(th.parentElement.children).indexOf(th);
                    const tbody = this.container.querySelector('#grid-tbody');
                    if (tbody) {
                        const rows = tbody.querySelectorAll('tr');
                        rows.forEach(row => {
                            const cell = row.children[columnIndex];
                            if (cell) {
                                cell.style.width = optimalWidth + 'px';
                            }
                        });
                    }
                    
                    // Store the new width
                    this.columnWidths.set(field, optimalWidth);
                    this.saveColumnWidths();
                    
                    // Update table width
                    const table = this.container.querySelector('#data-grid-table');
                    if (table) {
                        const totalWidth = Array.from(th.parentElement.children)
                            .reduce((sum, header) => sum + parseInt(window.getComputedStyle(header).width, 10), 0);
                        table.style.minWidth = totalWidth + 'px';
                    }
                }
                e.preventDefault();
                e.stopPropagation();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const width = startWidth + e.clientX - startX;
            if (width > 50) { // Minimum column width
                currentTh.style.width = width + 'px';
                
                // Store the new width
                const field = currentTh.dataset.field;
                if (field) {
                    this.columnWidths.set(field, width);
                    this.saveColumnWidths();
                }
                
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