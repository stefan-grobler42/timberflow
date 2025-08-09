// Interactive Spreadsheet-like Grid Component with Excel Import/Export
class InteractiveGrid {
    constructor(containerId, config = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.config = {
            columns: [],
            data: [],
            editable: true,
            selectable: true,
            exportable: true,
            importable: true,
            auditTrail: true,
            ...config
        };
        
        this.data = this.config.data || [];
        this.columns = this.config.columns || [];
        this.selectedCells = new Set();
        this.selectedRows = new Set();
        this.clipboardData = null;
        this.editingCell = null;
        this.auditTrail = [];
        
        // Keyboard navigation
        this.currentCell = { row: 0, col: 0 };
        
        if (!this.container) {
            console.error('InteractiveGrid: Container not found:', containerId);
            return;
        }
        
        this.init();
    }
    
    init() {
        this.createToolbar();
        this.createGrid();
        this.attachEventListeners();
        this.render();
    }
    
    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'grid-toolbar d-flex justify-content-between align-items-center mb-3';
        toolbar.innerHTML = `
            <div class="btn-group">
                <button class="btn btn-outline-primary btn-sm" id="add-row-btn">
                    <i class="fas fa-plus me-1"></i>Add Row
                </button>
                <button class="btn btn-outline-danger btn-sm" id="delete-row-btn" disabled>
                    <i class="fas fa-trash me-1"></i>Delete Row
                </button>
                <button class="btn btn-outline-info btn-sm" id="copy-btn" disabled>
                    <i class="fas fa-copy me-1"></i>Copy
                </button>
                <button class="btn btn-outline-info btn-sm" id="paste-btn" disabled>
                    <i class="fas fa-paste me-1"></i>Paste
                </button>
            </div>
            
            <div class="btn-group">
                <button class="btn btn-success btn-sm" id="export-excel-btn">
                    <i class="fas fa-file-excel me-1"></i>Export to Excel
                </button>
                <button class="btn btn-primary btn-sm" id="import-excel-btn">
                    <i class="fas fa-upload me-1"></i>Import from Excel
                </button>
                <input type="file" id="excel-file-input" accept=".xlsx,.xls,.csv" style="display: none;">
            </div>
            
            <div class="grid-info">
                <small class="text-muted">
                    <span id="grid-stats">0 rows</span> | 
                    <span id="selection-info">No selection</span>
                </small>
            </div>
        `;
        
        this.container.appendChild(toolbar);
        this.toolbar = toolbar;
    }
    
    createGrid() {
        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid-container';
        gridContainer.style.cssText = `
            max-height: 600px;
            overflow: auto;
            border: 1px solid #dee2e6;
            border-radius: 0.375rem;
        `;
        
        const table = document.createElement('table');
        table.className = 'table table-bordered table-sm mb-0 interactive-grid-table';
        table.style.cssText = `
            margin-bottom: 0;
            font-size: 0.875rem;
        `;
        
        gridContainer.appendChild(table);
        this.container.appendChild(gridContainer);
        
        this.gridContainer = gridContainer;
        this.table = table;
    }
    
    render() {
        if (!this.table) return;
        
        // Create header
        const thead = document.createElement('thead');
        thead.className = 'table-dark sticky-top';
        
        const headerRow = document.createElement('tr');
        
        // Row selector column
        const selectorHeader = document.createElement('th');
        selectorHeader.innerHTML = '<input type="checkbox" id="select-all-checkbox">';
        selectorHeader.style.width = '40px';
        headerRow.appendChild(selectorHeader);
        
        // Data columns
        this.columns.forEach((column, index) => {
            const th = document.createElement('th');
            th.textContent = column.title || column.key;
            th.style.minWidth = column.width || '120px';
            th.dataset.column = index;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        
        // Create body
        const tbody = document.createElement('tbody');
        
        this.data.forEach((row, rowIndex) => {
            const tr = this.createRow(row, rowIndex);
            tbody.appendChild(tr);
        });
        
        // Clear and rebuild table
        this.table.innerHTML = '';
        this.table.appendChild(thead);
        this.table.appendChild(tbody);
        
        this.updateGridStats();
    }
    
    createRow(rowData, rowIndex) {
        const tr = document.createElement('tr');
        tr.dataset.rowIndex = rowIndex;
        
        // Row selector
        const selectorCell = document.createElement('td');
        selectorCell.innerHTML = `<input type="checkbox" class="row-selector" data-row="${rowIndex}">`;
        selectorCell.style.textAlign = 'center';
        tr.appendChild(selectorCell);
        
        // Data cells
        this.columns.forEach((column, colIndex) => {
            const td = document.createElement('td');
            td.dataset.row = rowIndex;
            td.dataset.col = colIndex;
            td.dataset.key = column.key;
            
            const value = rowData[column.key] || '';
            
            if (column.type === 'select') {
                td.innerHTML = `
                    <select class="form-select form-select-sm cell-editor" style="border: none; background: transparent;">
                        ${column.options.map(opt => 
                            `<option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.label}</option>`
                        ).join('')}
                    </select>
                `;
            } else if (column.type === 'checkbox') {
                td.innerHTML = `<input type="checkbox" class="form-check-input cell-editor" ${value ? 'checked' : ''}>`;
                td.style.textAlign = 'center';
            } else if (column.type === 'number') {
                td.innerHTML = `<input type="number" class="form-control form-control-sm cell-editor" value="${value}" style="border: none; background: transparent;">`;
            } else {
                td.innerHTML = `<input type="text" class="form-control form-control-sm cell-editor" value="${value}" style="border: none; background: transparent;">`;
            }
            
            tr.appendChild(td);
        });
        
        return tr;
    }
    
    attachEventListeners() {
        // Toolbar events
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('#add-row-btn')) {
                this.addRow();
            } else if (e.target.closest('#delete-row-btn')) {
                this.deleteSelectedRows();
            } else if (e.target.closest('#copy-btn')) {
                this.copySelection();
            } else if (e.target.closest('#paste-btn')) {
                this.pasteSelection();
            } else if (e.target.closest('#export-excel-btn')) {
                this.exportToExcel();
            } else if (e.target.closest('#import-excel-btn')) {
                document.getElementById('excel-file-input').click();
            }
        });
        
        // File input for Excel import
        const fileInput = document.getElementById('excel-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.importFromExcel(e.target.files[0]);
                }
            });
        }
        
        // Grid events
        this.container.addEventListener('change', (e) => {
            if (e.target.classList.contains('cell-editor')) {
                this.handleCellChange(e.target);
            } else if (e.target.classList.contains('row-selector')) {
                this.handleRowSelection(e.target);
            } else if (e.target.id === 'select-all-checkbox') {
                this.handleSelectAll(e.target);
            }
        });
        
        // Cell selection and navigation
        this.container.addEventListener('click', (e) => {
            const cell = e.target.closest('td[data-row]');
            if (cell) {
                this.selectCell(cell);
            }
        });
        
        // Keyboard navigation
        this.container.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
        
        // Copy/Paste keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'c' && this.selectedCells.size > 0) {
                    e.preventDefault();
                    this.copySelection();
                } else if (e.key === 'v' && this.clipboardData) {
                    e.preventDefault();
                    this.pasteSelection();
                }
            }
        });
    }
    
    addRow() {
        const newRow = {};
        this.columns.forEach(column => {
            newRow[column.key] = column.defaultValue || '';
        });
        
        this.data.push(newRow);
        this.recordAuditEvent('CREATE', this.data.length - 1, newRow);
        this.render();
        this.updateGridStats();
    }
    
    deleteSelectedRows() {
        const selectedRows = Array.from(this.selectedRows).sort((a, b) => b - a);
        
        selectedRows.forEach(rowIndex => {
            if (rowIndex < this.data.length) {
                const deletedRow = this.data[rowIndex];
                this.recordAuditEvent('DELETE', rowIndex, deletedRow);
                this.data.splice(rowIndex, 1);
            }
        });
        
        this.selectedRows.clear();
        this.selectedCells.clear();
        this.render();
        this.updateToolbarState();
        this.updateGridStats();
    }
    
    handleCellChange(input) {
        const cell = input.closest('td');
        const rowIndex = parseInt(cell.dataset.row);
        const colIndex = parseInt(cell.dataset.col);
        const key = cell.dataset.key;
        const column = this.columns[colIndex];
        
        let newValue = input.value;
        const oldValue = this.data[rowIndex][key];
        
        // Type conversion
        if (column.type === 'number') {
            newValue = parseFloat(newValue) || 0;
        } else if (column.type === 'checkbox') {
            newValue = input.checked;
        }
        
        // Update data
        this.data[rowIndex][key] = newValue;
        
        // Record audit trail
        this.recordAuditEvent('UPDATE', rowIndex, {
            field: key,
            oldValue,
            newValue
        });
        
        console.log(`Cell updated: Row ${rowIndex}, ${key}: ${oldValue} → ${newValue}`);
    }
    
    handleRowSelection(checkbox) {
        const rowIndex = parseInt(checkbox.dataset.row);
        
        if (checkbox.checked) {
            this.selectedRows.add(rowIndex);
        } else {
            this.selectedRows.delete(rowIndex);
        }
        
        this.updateToolbarState();
        this.updateSelectionInfo();
    }
    
    handleSelectAll(checkbox) {
        const rowSelectors = this.container.querySelectorAll('.row-selector');
        
        rowSelectors.forEach(selector => {
            selector.checked = checkbox.checked;
            const rowIndex = parseInt(selector.dataset.row);
            
            if (checkbox.checked) {
                this.selectedRows.add(rowIndex);
            } else {
                this.selectedRows.delete(rowIndex);
            }
        });
        
        this.updateToolbarState();
        this.updateSelectionInfo();
    }
    
    selectCell(cell) {
        // Clear previous selections
        this.container.querySelectorAll('.selected-cell').forEach(c => 
            c.classList.remove('selected-cell')
        );
        
        cell.classList.add('selected-cell');
        this.selectedCells.clear();
        this.selectedCells.add(`${cell.dataset.row}-${cell.dataset.col}`);
        
        this.currentCell = {
            row: parseInt(cell.dataset.row),
            col: parseInt(cell.dataset.col)
        };
        
        this.updateToolbarState();
        this.updateSelectionInfo();
    }
    
    copySelection() {
        if (this.selectedCells.size === 0 && this.selectedRows.size === 0) return;
        
        let data = [];
        
        if (this.selectedRows.size > 0) {
            // Copy entire rows
            Array.from(this.selectedRows).sort().forEach(rowIndex => {
                if (rowIndex < this.data.length) {
                    data.push(this.data[rowIndex]);
                }
            });
        } else {
            // Copy selected cells (simplified for now - copy current row)
            const rowIndex = this.currentCell.row;
            if (rowIndex < this.data.length) {
                data.push(this.data[rowIndex]);
            }
        }
        
        this.clipboardData = data;
        this.updateToolbarState();
        
        // Also copy to system clipboard as tab-separated values
        const textData = data.map(row => 
            this.columns.map(col => row[col.key] || '').join('\t')
        ).join('\n');
        
        navigator.clipboard.writeText(textData).catch(console.error);
        
        console.log('Data copied to clipboard:', data.length, 'rows');
    }
    
    pasteSelection() {
        if (!this.clipboardData || this.clipboardData.length === 0) return;
        
        const startRow = this.currentCell.row;
        
        this.clipboardData.forEach((sourceRow, index) => {
            const targetRowIndex = startRow + index;
            
            if (targetRowIndex >= this.data.length) {
                // Add new row if needed
                const newRow = {};
                this.columns.forEach(column => {
                    newRow[column.key] = column.defaultValue || '';
                });
                this.data.push(newRow);
            }
            
            // Copy data
            const targetRow = this.data[targetRowIndex];
            Object.keys(sourceRow).forEach(key => {
                if (targetRow.hasOwnProperty(key)) {
                    const oldValue = targetRow[key];
                    targetRow[key] = sourceRow[key];
                    
                    this.recordAuditEvent('UPDATE', targetRowIndex, {
                        field: key,
                        oldValue,
                        newValue: sourceRow[key]
                    });
                }
            });
        });
        
        this.render();
        this.updateGridStats();
        console.log('Data pasted:', this.clipboardData.length, 'rows');
    }
    
    exportToExcel() {
        // Create workbook data
        const wsData = [];
        
        // Add headers
        const headers = this.columns.map(col => col.title || col.key);
        wsData.push(headers);
        
        // Add data rows
        this.data.forEach(row => {
            const rowData = this.columns.map(col => row[col.key] || '');
            wsData.push(rowData);
        });
        
        // Create and download Excel file
        this.downloadAsExcel(wsData, 'grid-export.xlsx');
    }
    
    downloadAsExcel(data, filename) {
        // Create CSV content (simplified Excel export)
        const csvContent = data.map(row => 
            row.map(cell => {
                // Escape quotes and wrap in quotes if contains comma
                const escaped = String(cell).replace(/"/g, '""');
                return escaped.includes(',') || escaped.includes('\n') ? `"${escaped}"` : escaped;
            }).join(',')
        ).join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename.replace('.xlsx', '.csv');
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Excel file exported:', filename);
    }
    
    async importFromExcel(file) {
        try {
            const text = await file.text();
            const rows = this.parseCSV(text);
            
            if (rows.length === 0) return;
            
            // First row as headers
            const headers = rows[0];
            const dataRows = rows.slice(1);
            
            // Map headers to columns
            const columnMap = {};
            headers.forEach((header, index) => {
                const column = this.columns.find(col => 
                    (col.title || col.key).toLowerCase() === header.toLowerCase()
                );
                if (column) {
                    columnMap[index] = column.key;
                }
            });
            
            // Import data
            const importedData = [];
            dataRows.forEach(row => {
                const newRow = {};
                this.columns.forEach(column => {
                    newRow[column.key] = column.defaultValue || '';
                });
                
                row.forEach((cell, index) => {
                    if (columnMap[index]) {
                        newRow[columnMap[index]] = cell;
                    }
                });
                
                importedData.push(newRow);
            });
            
            // Replace or append data
            const action = confirm('Replace existing data? Click Cancel to append instead.');
            
            if (action) {
                this.data = importedData;
                this.recordAuditEvent('IMPORT_REPLACE', null, { count: importedData.length });
            } else {
                this.data.push(...importedData);
                this.recordAuditEvent('IMPORT_APPEND', null, { count: importedData.length });
            }
            
            this.render();
            this.updateGridStats();
            
            console.log('Excel data imported:', importedData.length, 'rows');
            
        } catch (error) {
            console.error('Error importing Excel file:', error);
            alert('Error importing file. Please check the format and try again.');
        }
    }
    
    parseCSV(text) {
        const rows = [];
        const lines = text.split('\n');
        
        lines.forEach(line => {
            if (line.trim()) {
                const row = [];
                let current = '';
                let inQuotes = false;
                
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        row.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                
                row.push(current.trim());
                rows.push(row);
            }
        });
        
        return rows;
    }
    
    handleKeyboardNavigation(e) {
        const cell = this.container.querySelector('.selected-cell');
        if (!cell) return;
        
        let newRow = this.currentCell.row;
        let newCol = this.currentCell.col;
        
        switch (e.key) {
            case 'ArrowUp':
                newRow = Math.max(0, newRow - 1);
                break;
            case 'ArrowDown':
                newRow = Math.min(this.data.length - 1, newRow + 1);
                break;
            case 'ArrowLeft':
                newCol = Math.max(0, newCol - 1);
                break;
            case 'ArrowRight':
                newCol = Math.min(this.columns.length - 1, newCol + 1);
                break;
            case 'Enter':
                newRow = Math.min(this.data.length - 1, newRow + 1);
                break;
            case 'Tab':
                e.preventDefault();
                if (e.shiftKey) {
                    newCol = newCol > 0 ? newCol - 1 : this.columns.length - 1;
                    if (newCol === this.columns.length - 1) newRow = Math.max(0, newRow - 1);
                } else {
                    newCol = newCol < this.columns.length - 1 ? newCol + 1 : 0;
                    if (newCol === 0) newRow = Math.min(this.data.length - 1, newRow + 1);
                }
                break;
            default:
                return;
        }
        
        if (newRow !== this.currentCell.row || newCol !== this.currentCell.col) {
            const newCell = this.container.querySelector(`td[data-row="${newRow}"][data-col="${newCol}"]`);
            if (newCell) {
                this.selectCell(newCell);
                newCell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
        }
    }
    
    updateToolbarState() {
        const deleteBtn = document.getElementById('delete-row-btn');
        const copyBtn = document.getElementById('copy-btn');
        const pasteBtn = document.getElementById('paste-btn');
        
        if (deleteBtn) {
            deleteBtn.disabled = this.selectedRows.size === 0;
        }
        
        if (copyBtn) {
            copyBtn.disabled = this.selectedCells.size === 0 && this.selectedRows.size === 0;
        }
        
        if (pasteBtn) {
            pasteBtn.disabled = !this.clipboardData || this.clipboardData.length === 0;
        }
    }
    
    updateSelectionInfo() {
        const info = document.getElementById('selection-info');
        if (!info) return;
        
        if (this.selectedRows.size > 0) {
            info.textContent = `${this.selectedRows.size} rows selected`;
        } else if (this.selectedCells.size > 0) {
            info.textContent = `${this.selectedCells.size} cells selected`;
        } else {
            info.textContent = 'No selection';
        }
    }
    
    updateGridStats() {
        const stats = document.getElementById('grid-stats');
        if (stats) {
            stats.textContent = `${this.data.length} rows`;
        }
    }
    
    recordAuditEvent(action, rowIndex, data) {
        if (!this.config.auditTrail) return;
        
        this.auditTrail.push({
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            action,
            rowIndex,
            data,
            user: 'current_user' // Would come from authentication
        });
        
        // Keep only last 500 audit entries
        if (this.auditTrail.length > 500) {
            this.auditTrail = this.auditTrail.slice(-500);
        }
    }
    
    getAuditTrail() {
        return this.auditTrail;
    }
    
    // Public API methods
    setData(data) {
        this.data = data || [];
        this.render();
        this.updateGridStats();
    }
    
    getData() {
        return this.data;
    }
    
    setColumns(columns) {
        this.columns = columns || [];
        this.render();
    }
    
    getColumns() {
        return this.columns;
    }
}

// Add CSS styles for the interactive grid
const gridStyles = `
    .interactive-grid-table {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .interactive-grid-table td {
        padding: 0;
        position: relative;
    }
    
    .interactive-grid-table .cell-editor {
        border: none !important;
        border-radius: 0 !important;
        padding: 0.375rem 0.5rem;
        font-size: 0.875rem;
        background: transparent !important;
        box-shadow: none !important;
    }
    
    .interactive-grid-table .cell-editor:focus {
        background: #fff !important;
        border: 2px solid #0d6efd !important;
        box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25) !important;
        z-index: 10;
        position: relative;
    }
    
    .interactive-grid-table .selected-cell {
        background-color: #e7f3ff !important;
        border: 2px solid #0d6efd;
    }
    
    .interactive-grid-table tr:hover {
        background-color: #f8f9fa;
    }
    
    .grid-toolbar {
        background: #f8f9fa;
        border-radius: 0.375rem;
        padding: 0.75rem;
        border: 1px solid #dee2e6;
    }
    
    .grid-container {
        background: white;
        border-radius: 0.375rem;
    }
    
    .grid-info {
        font-size: 0.875rem;
    }
`;

// Inject styles if not already present
if (!document.getElementById('interactive-grid-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'interactive-grid-styles';
    styleSheet.textContent = gridStyles;
    document.head.appendChild(styleSheet);
}

// Make it globally available
window.InteractiveGrid = InteractiveGrid;