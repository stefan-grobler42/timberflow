// Power Apps-style Business Application Framework
class PowerAppsFramework {
    constructor(containerId, config = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.config = {
            entityName: config.entityName || 'Item',
            entityPluralName: config.entityPluralName || 'Items',
            fields: config.fields || [],
            primaryKey: config.primaryKey || 'id',
            displayField: config.displayField || 'name',
            allowAdd: config.allowAdd !== false,
            allowEdit: config.allowEdit !== false,
            allowDelete: config.allowDelete !== false,
            allowSearch: config.allowSearch !== false,
            allowFilter: config.allowFilter !== false,
            pageSize: config.pageSize || 25,
            ...config
        };
        
        this.data = [];
        this.filteredData = [];
        this.currentView = 'list'; // 'list' or 'form'
        this.currentItem = null;
        this.currentPage = 1;
        this.searchTerm = '';
        this.activeFilters = {};
        this.sortField = null;
        this.sortDirection = 'asc';
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error(`PowerAppsFramework: Container ${this.containerId} not found`);
            return;
        }

        this.render();
        this.setupEventListeners();
        this.loadData();
    }

    render() {
        if (this.currentView === 'list') {
            this.renderListView();
        } else {
            this.renderFormView();
        }
    }

    renderListView() {
        this.container.innerHTML = `
            <div class="power-apps-container">
                <!-- Command Bar -->
                <div class="command-bar bg-white border-bottom p-3 mb-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <h4 class="mb-0 me-3">
                                <i class="fas fa-table me-2 text-primary"></i>
                                ${this.config.entityPluralName}
                            </h4>
                            ${this.config.allowAdd ? `
                                <button class="btn btn-primary me-2" id="new-item-btn">
                                    <i class="fas fa-plus me-1"></i>New
                                </button>
                            ` : ''}
                            <button class="btn btn-outline-secondary me-2" id="refresh-btn">
                                <i class="fas fa-sync-alt me-1"></i>Refresh
                            </button>
                            <div class="dropdown me-2">
                                <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                    <i class="fas fa-download me-1"></i>Export
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#" id="export-excel-btn">
                                        <i class="fas fa-file-excel me-2"></i>Export to Excel
                                    </a></li>
                                    <li><a class="dropdown-item" href="#" id="export-csv-btn">
                                        <i class="fas fa-file-csv me-2"></i>Export to CSV
                                    </a></li>
                                </ul>
                            </div>
                        </div>
                        
                        <!-- Search and Filter Section -->
                        <div class="d-flex align-items-center">
                            ${this.config.allowSearch ? `
                                <div class="input-group me-3" style="width: 300px;">
                                    <span class="input-group-text">
                                        <i class="fas fa-search"></i>
                                    </span>
                                    <input type="text" class="form-control" id="search-input" 
                                           placeholder="Search ${this.config.entityPluralName.toLowerCase()}..." 
                                           value="${this.searchTerm}">
                                    ${this.searchTerm ? `
                                        <button class="btn btn-outline-secondary" id="clear-search-btn" type="button">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            ` : ''}
                            
                            ${this.config.allowFilter ? `
                                <button class="btn btn-outline-secondary me-2" id="filter-btn">
                                    <i class="fas fa-filter me-1"></i>Filter
                                    ${Object.keys(this.activeFilters).length > 0 ? 
                                        `<span class="badge bg-primary ms-1">${Object.keys(this.activeFilters).length}</span>` : ''
                                    }
                                </button>
                            ` : ''}
                            
                            <div class="dropdown">
                                <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                    <i class="fas fa-columns me-1"></i>Columns
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end" id="column-selector">
                                    ${this.config.fields.map(field => `
                                        <li>
                                            <label class="dropdown-item mb-0">
                                                <input type="checkbox" class="form-check-input me-2" 
                                                       data-field="${field.name}" ${field.visible !== false ? 'checked' : ''}>
                                                ${field.label || field.name}
                                            </label>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Data Grid -->
                <div class="data-grid-container">
                    <div class="table-responsive">
                        <table class="table table-hover table-sm">
                            <thead class="table-light sticky-top">
                                <tr>
                                    <th width="40" class="text-center">
                                        <input type="checkbox" id="select-all-checkbox" class="form-check-input">
                                    </th>
                                    ${this.getVisibleFields().map(field => `
                                        <th class="sortable-header" data-field="${field.name}" style="cursor: pointer;">
                                            ${field.label || field.name}
                                            ${this.sortField === field.name ? 
                                                `<i class="fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'} ms-1"></i>` :
                                                '<i class="fas fa-sort ms-1 text-muted"></i>'
                                            }
                                        </th>
                                    `).join('')}
                                    <th width="120" class="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="data-table-body">
                                ${this.renderTableRows()}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Pagination -->
                    <nav class="d-flex justify-content-between align-items-center mt-3">
                        <div class="text-muted">
                            Showing ${this.getPageStartIndex()} to ${this.getPageEndIndex()} of ${this.filteredData.length} entries
                            ${this.filteredData.length !== this.data.length ? 
                                `(filtered from ${this.data.length} total entries)` : ''
                            }
                        </div>
                        
                        <div class="d-flex align-items-center">
                            <select class="form-select form-select-sm me-3" id="page-size-select" style="width: auto;">
                                <option value="10" ${this.config.pageSize === 10 ? 'selected' : ''}>10</option>
                                <option value="25" ${this.config.pageSize === 25 ? 'selected' : ''}>25</option>
                                <option value="50" ${this.config.pageSize === 50 ? 'selected' : ''}>50</option>
                                <option value="100" ${this.config.pageSize === 100 ? 'selected' : ''}>100</option>
                            </select>
                            
                            ${this.renderPagination()}
                        </div>
                    </nav>
                </div>
            </div>
        `;

        this.setupListEventListeners();
    }

    renderFormView() {
        const isEdit = !!this.currentItem;
        const title = isEdit ? `Edit ${this.config.entityName}` : `New ${this.config.entityName}`;

        this.container.innerHTML = `
            <div class="power-apps-form-container">
                <!-- Form Command Bar -->
                <div class="form-command-bar bg-white border-bottom p-3 mb-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <button class="btn btn-outline-secondary me-3" id="back-to-list-btn">
                                <i class="fas fa-arrow-left me-1"></i>Back
                            </button>
                            <h4 class="mb-0">
                                <i class="fas fa-edit me-2 text-primary"></i>
                                ${title}
                            </h4>
                        </div>
                        
                        <div class="btn-group">
                            <button class="btn btn-outline-secondary" id="form-refresh-btn">
                                <i class="fas fa-sync-alt me-1"></i>Refresh
                            </button>
                            <button class="btn btn-success" id="save-btn">
                                <i class="fas fa-save me-1"></i>Save
                            </button>
                            ${isEdit && this.config.allowDelete ? `
                                <button class="btn btn-outline-danger" id="delete-btn">
                                    <i class="fas fa-trash me-1"></i>Delete
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Form Content -->
                <div class="form-content">
                    <div class="row">
                        <!-- Main Form -->
                        <div class="col-lg-8">
                            <form id="entity-form" class="needs-validation" novalidate>
                                ${this.renderFormSections()}
                            </form>
                        </div>
                        
                        <!-- Side Panel -->
                        <div class="col-lg-4">
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">
                                        <i class="fas fa-info-circle me-2"></i>Information
                                    </h6>
                                </div>
                                <div class="card-body">
                                    ${isEdit ? this.renderRecordInfo() : this.renderNewRecordInfo()}
                                </div>
                            </div>
                            
                            ${isEdit ? this.renderRelatedData() : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupFormEventListeners();
        if (isEdit) {
            this.populateForm();
        }
    }

    renderFormSections() {
        const sections = this.groupFieldsBySection();
        return Object.keys(sections).map(sectionName => `
            <div class="card mb-4">
                <div class="card-header">
                    <h6 class="mb-0">${sectionName}</h6>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        ${sections[sectionName].map(field => this.renderFormField(field)).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderFormField(field) {
        const value = this.currentItem ? (this.currentItem[field.name] || '') : (field.defaultValue || '');
        const isRequired = field.required ? 'required' : '';
        const requiredMark = field.required ? '<span class="text-danger">*</span>' : '';

        switch (field.type) {
            case 'text':
            case 'email':
            case 'url':
                return `
                    <div class="col-md-${field.width || '6'}">
                        <label class="form-label">${field.label || field.name} ${requiredMark}</label>
                        <input type="${field.type}" class="form-control" name="${field.name}" 
                               value="${value}" ${isRequired} ${field.readonly ? 'readonly' : ''}>
                        <div class="invalid-feedback">Please provide a valid ${field.label || field.name}.</div>
                        ${field.description ? `<div class="form-text">${field.description}</div>` : ''}
                    </div>
                `;

            case 'number':
            case 'currency':
                return `
                    <div class="col-md-${field.width || '6'}">
                        <label class="form-label">${field.label || field.name} ${requiredMark}</label>
                        <div class="input-group">
                            ${field.type === 'currency' ? '<span class="input-group-text">R</span>' : ''}
                            <input type="number" class="form-control" name="${field.name}" 
                                   value="${value}" ${isRequired} ${field.readonly ? 'readonly' : ''}
                                   step="${field.step || (field.type === 'currency' ? '0.01' : '1')}">
                        </div>
                        <div class="invalid-feedback">Please provide a valid ${field.label || field.name}.</div>
                        ${field.description ? `<div class="form-text">${field.description}</div>` : ''}
                    </div>
                `;

            case 'select':
                return `
                    <div class="col-md-${field.width || '6'}">
                        <label class="form-label">${field.label || field.name} ${requiredMark}</label>
                        <select class="form-select" name="${field.name}" ${isRequired} ${field.readonly ? 'disabled' : ''}>
                            <option value="">Choose...</option>
                            ${(field.options || []).map(option => `
                                <option value="${option.value}" ${value === option.value ? 'selected' : ''}>
                                    ${option.label}
                                </option>
                            `).join('')}
                        </select>
                        <div class="invalid-feedback">Please select a valid ${field.label || field.name}.</div>
                        ${field.description ? `<div class="form-text">${field.description}</div>` : ''}
                    </div>
                `;

            case 'textarea':
                return `
                    <div class="col-md-${field.width || '12'}">
                        <label class="form-label">${field.label || field.name} ${requiredMark}</label>
                        <textarea class="form-control" name="${field.name}" rows="${field.rows || '3'}" 
                                  ${isRequired} ${field.readonly ? 'readonly' : ''}>${value}</textarea>
                        <div class="invalid-feedback">Please provide a valid ${field.label || field.name}.</div>
                        ${field.description ? `<div class="form-text">${field.description}</div>` : ''}
                    </div>
                `;

            case 'checkbox':
                return `
                    <div class="col-md-${field.width || '6'}">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" name="${field.name}" 
                                   ${value ? 'checked' : ''} ${field.readonly ? 'disabled' : ''}>
                            <label class="form-check-label">${field.label || field.name} ${requiredMark}</label>
                        </div>
                        ${field.description ? `<div class="form-text">${field.description}</div>` : ''}
                    </div>
                `;

            case 'date':
                return `
                    <div class="col-md-${field.width || '6'}">
                        <label class="form-label">${field.label || field.name} ${requiredMark}</label>
                        <input type="date" class="form-control" name="${field.name}" 
                               value="${value}" ${isRequired} ${field.readonly ? 'readonly' : ''}>
                        <div class="invalid-feedback">Please provide a valid ${field.label || field.name}.</div>
                        ${field.description ? `<div class="form-text">${field.description}</div>` : ''}
                    </div>
                `;

            default:
                return `
                    <div class="col-md-${field.width || '6'}">
                        <label class="form-label">${field.label || field.name} ${requiredMark}</label>
                        <input type="text" class="form-control" name="${field.name}" 
                               value="${value}" ${isRequired} ${field.readonly ? 'readonly' : ''}>
                        <div class="invalid-feedback">Please provide a valid ${field.label || field.name}.</div>
                        ${field.description ? `<div class="form-text">${field.description}</div>` : ''}
                    </div>
                `;
        }
    }

    renderTableRows() {
        const pageData = this.getPageData();
        if (pageData.length === 0) {
            return `
                <tr>
                    <td colspan="${this.getVisibleFields().length + 2}" class="text-center py-4">
                        <div class="text-muted">
                            <i class="fas fa-inbox fa-2x mb-3"></i>
                            <p class="mb-0">No ${this.config.entityPluralName.toLowerCase()} found</p>
                            ${this.config.allowAdd ? `
                                <button class="btn btn-primary btn-sm mt-2" onclick="powerApp.showForm()">
                                    <i class="fas fa-plus me-1"></i>Create ${this.config.entityName}
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }

        return pageData.map(item => `
            <tr class="table-row" data-id="${item[this.config.primaryKey]}" style="cursor: pointer;">
                <td class="text-center">
                    <input type="checkbox" class="form-check-input row-checkbox" 
                           value="${item[this.config.primaryKey]}">
                </td>
                ${this.getVisibleFields().map(field => `
                    <td>${this.formatFieldValue(item[field.name], field)}</td>
                `).join('')}
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary edit-btn" data-id="${item[this.config.primaryKey]}">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${this.config.allowDelete ? `
                            <button class="btn btn-outline-danger delete-btn" data-id="${item[this.config.primaryKey]}">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.config.pageSize);
        if (totalPages <= 1) return '';

        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        let pagination = `
            <nav>
                <ul class="pagination pagination-sm mb-0">
                    <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                        <button class="page-link" data-page="1" ${this.currentPage === 1 ? 'disabled' : ''}>
                            <i class="fas fa-angle-double-left"></i>
                        </button>
                    </li>
                    <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                        <button class="page-link" data-page="${this.currentPage - 1}" ${this.currentPage === 1 ? 'disabled' : ''}>
                            <i class="fas fa-angle-left"></i>
                        </button>
                    </li>
        `;

        for (let i = startPage; i <= endPage; i++) {
            pagination += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <button class="page-link" data-page="${i}">${i}</button>
                </li>
            `;
        }

        pagination += `
                    <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                        <button class="page-link" data-page="${this.currentPage + 1}" ${this.currentPage === totalPages ? 'disabled' : ''}>
                            <i class="fas fa-angle-right"></i>
                        </button>
                    </li>
                    <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                        <button class="page-link" data-page="${totalPages}" ${this.currentPage === totalPages ? 'disabled' : ''}>
                            <i class="fas fa-angle-double-right"></i>
                        </button>
                    </li>
                </ul>
            </nav>
        `;

        return pagination;
    }

    renderRecordInfo() {
        const item = this.currentItem;
        const createdDate = item.createdDate ? new Date(item.createdDate).toLocaleDateString() : 'Unknown';
        const modifiedDate = item.modifiedDate ? new Date(item.modifiedDate).toLocaleDateString() : 'Unknown';

        return `
            <div class="record-info">
                <div class="row g-2">
                    <div class="col-12">
                        <small class="text-muted">Created</small>
                        <div>${createdDate}</div>
                    </div>
                    <div class="col-12">
                        <small class="text-muted">Modified</small>
                        <div>${modifiedDate}</div>
                    </div>
                    <div class="col-12">
                        <small class="text-muted">Record ID</small>
                        <div class="font-monospace">${item[this.config.primaryKey]}</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderNewRecordInfo() {
        return `
            <div class="new-record-info">
                <p class="text-muted mb-0">
                    <i class="fas fa-info-circle me-2"></i>
                    New ${this.config.entityName} will be created when saved.
                </p>
            </div>
        `;
    }

    renderRelatedData() {
        // Placeholder for related data - can be extended based on entity relationships
        return `
            <div class="card mt-3">
                <div class="card-header">
                    <h6 class="mb-0">
                        <i class="fas fa-link me-2"></i>Related Information
                    </h6>
                </div>
                <div class="card-body">
                    <p class="text-muted mb-0">No related data to display.</p>
                </div>
            </div>
        `;
    }

    // Utility Methods
    getVisibleFields() {
        return this.config.fields.filter(field => field.visible !== false && field.showInList !== false);
    }

    getPageData() {
        const startIndex = (this.currentPage - 1) * this.config.pageSize;
        const endIndex = startIndex + this.config.pageSize;
        return this.filteredData.slice(startIndex, endIndex);
    }

    getPageStartIndex() {
        return this.filteredData.length === 0 ? 0 : (this.currentPage - 1) * this.config.pageSize + 1;
    }

    getPageEndIndex() {
        const endIndex = this.currentPage * this.config.pageSize;
        return Math.min(endIndex, this.filteredData.length);
    }

    groupFieldsBySection() {
        const sections = {};
        this.config.fields.forEach(field => {
            const sectionName = field.section || 'General Information';
            if (!sections[sectionName]) {
                sections[sectionName] = [];
            }
            sections[sectionName].push(field);
        });
        return sections;
    }

    formatFieldValue(value, field) {
        if (value === null || value === undefined || value === '') {
            return '<span class="text-muted">-</span>';
        }

        switch (field.type) {
            case 'currency':
                return `R ${parseFloat(value).toFixed(2)}`;
            case 'date':
                return new Date(value).toLocaleDateString();
            case 'checkbox':
                return value ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-muted"></i>';
            case 'email':
                return `<a href="mailto:${value}">${value}</a>`;
            case 'url':
                return `<a href="${value}" target="_blank">${value}</a>`;
            default:
                return String(value).length > 50 ? String(value).substring(0, 50) + '...' : String(value);
        }
    }

    // Event Handlers
    setupListEventListeners() {
        // New item button
        const newBtn = document.getElementById('new-item-btn');
        if (newBtn) {
            newBtn.addEventListener('click', () => this.showForm());
        }

        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.filterData();
                this.currentPage = 1;
                this.updateTableContent();
            });
        }

        // Clear search
        const clearSearchBtn = document.getElementById('clear-search-btn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.searchTerm = '';
                this.filterData();
                this.currentPage = 1;
                this.render();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadData());
        }

        // Table row clicks for editing
        document.addEventListener('click', (e) => {
            const row = e.target.closest('.table-row');
            if (row && !e.target.closest('button') && !e.target.closest('input')) {
                const id = row.getAttribute('data-id');
                this.editItem(id);
            }
        });

        // Edit buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-btn')) {
                const id = e.target.closest('.edit-btn').getAttribute('data-id');
                this.editItem(id);
            }
        });

        // Delete buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) {
                const id = e.target.closest('.delete-btn').getAttribute('data-id');
                this.deleteItem(id);
            }
        });

        // Pagination
        document.addEventListener('click', (e) => {
            if (e.target.closest('.page-link')) {
                const page = parseInt(e.target.closest('.page-link').getAttribute('data-page'));
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.updateTableContent();
                }
            }
        });

        // Page size change
        const pageSizeSelect = document.getElementById('page-size-select');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                this.config.pageSize = parseInt(e.target.value);
                this.currentPage = 1;
                this.updateTableContent();
            });
        }

        // Sort headers
        document.addEventListener('click', (e) => {
            if (e.target.closest('.sortable-header')) {
                const field = e.target.closest('.sortable-header').getAttribute('data-field');
                this.sortData(field);
            }
        });

        // Select all checkbox
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('.row-checkbox');
                checkboxes.forEach(cb => cb.checked = e.target.checked);
            });
        }
    }

    setupFormEventListeners() {
        // Back to list button
        const backBtn = document.getElementById('back-to-list-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showList());
        }

        // Save button
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveItem());
        }

        // Delete button
        const deleteBtn = document.getElementById('delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteCurrentItem());
        }

        // Form refresh button
        const refreshBtn = document.getElementById('form-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshForm());
        }
    }

    // Data Management Methods
    async loadData() {
        // Override this method to load data from API
        // For demo purposes, using sample data
        this.data = this.getSampleData();
        this.filterData();
        this.updateTableContent();
    }

    getSampleData() {
        // Override this method to provide actual data
        return [];
    }

    filterData() {
        this.filteredData = this.data.filter(item => {
            // Search filter
            if (this.searchTerm) {
                const searchFields = this.config.fields.filter(f => f.searchable !== false);
                const matchesSearch = searchFields.some(field => {
                    const value = item[field.name];
                    return value && String(value).toLowerCase().includes(this.searchTerm.toLowerCase());
                });
                if (!matchesSearch) return false;
            }

            // Additional filters
            for (const [filterField, filterValue] of Object.entries(this.activeFilters)) {
                if (item[filterField] !== filterValue) return false;
            }

            return true;
        });

        // Apply sorting
        if (this.sortField) {
            this.filteredData.sort((a, b) => {
                const aValue = a[this.sortField];
                const bValue = b[this.sortField];
                
                if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
                if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
    }

    sortData(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        this.filterData();
        this.updateTableContent();
    }

    updateTableContent() {
        const tbody = document.getElementById('data-table-body');
        if (tbody) {
            tbody.innerHTML = this.renderTableRows();
        }

        // Update pagination
        const paginationContainer = document.querySelector('nav:last-child');
        if (paginationContainer) {
            paginationContainer.innerHTML = this.renderPagination();
        }

        // Update record count
        const recordInfo = document.querySelector('.text-muted');
        if (recordInfo) {
            recordInfo.innerHTML = `
                Showing ${this.getPageStartIndex()} to ${this.getPageEndIndex()} of ${this.filteredData.length} entries
                ${this.filteredData.length !== this.data.length ? 
                    `(filtered from ${this.data.length} total entries)` : ''
                }
            `;
        }
    }

    // Navigation Methods
    showList() {
        this.currentView = 'list';
        this.currentItem = null;
        this.render();
    }

    showForm(item = null) {
        this.currentView = 'form';
        this.currentItem = item;
        this.render();
    }

    editItem(id) {
        const item = this.data.find(item => item[this.config.primaryKey] == id);
        if (item) {
            this.showForm(item);
        }
    }

    // CRUD Operations
    saveItem() {
        const form = document.getElementById('entity-form');
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const formData = new FormData(form);
        const data = {};

        // Convert form data to object
        for (const [key, value] of formData.entries()) {
            const field = this.config.fields.find(f => f.name === key);
            if (field) {
                switch (field.type) {
                    case 'number':
                    case 'currency':
                        data[key] = value ? parseFloat(value) : null;
                        break;
                    case 'checkbox':
                        data[key] = true; // If present in FormData, it's checked
                        break;
                    default:
                        data[key] = value || null;
                }
            }
        }

        // Handle unchecked checkboxes
        this.config.fields.filter(f => f.type === 'checkbox').forEach(field => {
            if (!formData.has(field.name)) {
                data[field.name] = false;
            }
        });

        if (this.currentItem) {
            // Update existing item
            Object.assign(this.currentItem, data);
            this.currentItem.modifiedDate = new Date().toISOString();
            this.showNotification(`${this.config.entityName} updated successfully`, 'success');
        } else {
            // Create new item
            data[this.config.primaryKey] = this.generateId();
            data.createdDate = new Date().toISOString();
            data.modifiedDate = new Date().toISOString();
            this.data.push(data);
            this.showNotification(`${this.config.entityName} created successfully`, 'success');
        }

        this.filterData();
        this.showList();
    }

    deleteCurrentItem() {
        if (this.currentItem && confirm(`Are you sure you want to delete this ${this.config.entityName.toLowerCase()}?`)) {
            this.deleteItem(this.currentItem[this.config.primaryKey]);
        }
    }

    deleteItem(id) {
        const index = this.data.findIndex(item => item[this.config.primaryKey] == id);
        if (index > -1) {
            this.data.splice(index, 1);
            this.filterData();
            this.showNotification(`${this.config.entityName} deleted successfully`, 'success');
            
            if (this.currentView === 'form') {
                this.showList();
            } else {
                this.updateTableContent();
            }
        }
    }

    populateForm() {
        if (!this.currentItem) return;

        const form = document.getElementById('entity-form');
        Object.keys(this.currentItem).forEach(key => {
            const element = form.querySelector(`[name="${key}"]`);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = !!this.currentItem[key];
                } else {
                    element.value = this.currentItem[key] || '';
                }
            }
        });
    }

    refreshForm() {
        if (this.currentItem) {
            // In a real app, you'd reload from server
            this.populateForm();
            this.showNotification('Form refreshed', 'info');
        }
    }

    // Utility Methods
    generateId() {
        return Math.max(...this.data.map(item => parseInt(item[this.config.primaryKey]) || 0), 0) + 1;
    }

    showNotification(message, type = 'info') {
        const alertClass = type === 'error' ? 'danger' : type;
        const notification = document.createElement('div');
        notification.className = `alert alert-${alertClass} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}