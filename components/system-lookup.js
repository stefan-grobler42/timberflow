// System Lookup - Universal Searchable Lookup Field Component
class SystemLookup {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        // Apply system defaults
        this.options = {
            ...window.SystemDefaults?.getLookupConfig(options.fieldName || 'lookup') || {},
            ...options
        };
        
        this.items = [];
        this.filteredItems = [];
        this.selectedItem = null;
        this.isOpen = false;
        this.cache = new Map();
        this.searchTimeout = null;
        
        this.init();
    }

    init() {
        if (!this.container) return;
        this.render();
        this.setupEventListeners();
        this.loadData();
    }

    render() {
        this.container.innerHTML = `
            <div class="system-lookup">
                <div class="lookup-input-group">
                    <div class="input-group">
                        <input type="text" 
                               class="form-control lookup-search" 
                               placeholder="${this.options.placeholder || 'Type to search...'}"
                               autocomplete="off"
                               data-field="${this.options.fieldName}">
                        <button class="btn btn-outline-secondary lookup-browse" type="button" title="Browse all items">
                            <i class="fas fa-search"></i>
                        </button>
                        <button class="btn btn-outline-secondary lookup-clear" type="button" style="display: none;" title="Clear selection">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="lookup-dropdown" style="display: none;">
                    <div class="dropdown-menu show w-100" style="position: absolute; z-index: 1050; max-height: 300px; overflow-y: auto;">
                        <div class="lookup-results">
                            <!-- Search results will be rendered here -->
                        </div>
                        <div class="lookup-loading text-center p-2" style="display: none;">
                            <i class="fas fa-spinner fa-spin"></i> Loading...
                        </div>
                        <div class="lookup-no-results text-center text-muted p-2" style="display: none;">
                            No results found
                        </div>
                    </div>
                </div>
                
                <!-- Hidden field for form data -->
                <input type="hidden" class="lookup-value" data-field="${this.options.fieldName}_id">
                <input type="hidden" class="lookup-display" data-field="${this.options.fieldName}_display">
            </div>
        `;

        this.setupLookupEventListeners();
    }

    setupEventListeners() {
        // Listen for system lookup events
        document.addEventListener('system-lookup-refresh', (event) => {
            if (event.detail.fieldName === this.options.fieldName) {
                this.refresh();
            }
        });

        // Listen for value changes from parent forms
        document.addEventListener('system-lookup-set-value', (event) => {
            if (event.detail.fieldName === this.options.fieldName) {
                this.setValue(event.detail.value);
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!this.container.contains(event.target)) {
                this.closeDropdown();
            }
        });
    }

    setupLookupEventListeners() {
        const searchInput = this.container.querySelector('.lookup-search');
        const browseBtn = this.container.querySelector('.lookup-browse');
        const clearBtn = this.container.querySelector('.lookup-clear');

        // Search input events
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        searchInput.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim() || this.options.showAllOnFocus) {
                this.openDropdown();
            }
        });

        // Browse button
        browseBtn.addEventListener('click', () => {
            this.openDropdown(true);
        });

        // Clear button
        clearBtn.addEventListener('click', () => {
            this.clearValue();
        });

        // Dropdown clicks
        const dropdown = this.container.querySelector('.lookup-dropdown');
        dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('[data-item-id]');
            if (item) {
                const itemId = item.getAttribute('data-item-id');
                this.selectItem(itemId);
            }
        });
    }

    async loadData() {
        if (!this.options.dataSource) {
            console.warn('No data source configured for lookup field');
            return;
        }

        try {
            this.showLoading();
            
            // Check cache first
            const cacheKey = `${this.options.fieldName}_all`;
            if (this.cache.has(cacheKey)) {
                const cachedData = this.cache.get(cacheKey);
                if (Date.now() - cachedData.timestamp < this.options.cacheTimeout) {
                    this.items = cachedData.data;
                    this.filteredItems = [...this.items];
                    this.hideLoading();
                    return;
                }
            }

            // Fetch from API
            const response = await this.fetchData(this.options.dataSource);
            this.items = response.data || response || [];
            this.filteredItems = [...this.items];

            // Cache the results
            this.cache.set(cacheKey, {
                data: this.items,
                timestamp: Date.now()
            });

            this.hideLoading();
        } catch (error) {
            console.error('Failed to load lookup data:', error);
            this.hideLoading();
            this.showError('Failed to load data');
        }
    }

    async fetchData(endpoint, params = {}) {
        // Use global API call method if available
        if (window.app && window.app.apiCall) {
            return await window.app.apiCall(endpoint, 'GET', null, params);
        }
        
        // Fallback to fetch
        const url = new URL(endpoint, window.location.origin);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    handleSearch(query) {
        clearTimeout(this.searchTimeout);
        
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, this.options.debounceDelay);
    }

    performSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredItems = [...this.items];
        } else {
            this.filteredItems = this.items.filter(item => {
                const searchFields = this.options.searchFields || ['code', 'description', 'name'];
                return searchFields.some(field => {
                    const value = item[field];
                    return value && String(value).toLowerCase().includes(searchTerm);
                });
            });
        }

        this.filteredItems = this.filteredItems.slice(0, this.options.maxResults);
        this.renderResults();
        
        if (query.length >= this.options.searchThreshold) {
            this.openDropdown();
        }
    }

    renderResults() {
        const resultsContainer = this.container.querySelector('.lookup-results');
        const noResults = this.container.querySelector('.lookup-no-results');
        
        if (this.filteredItems.length === 0) {
            resultsContainer.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }

        noResults.style.display = 'none';
        
        resultsContainer.innerHTML = this.filteredItems.map(item => `
            <div class="dropdown-item lookup-item" data-item-id="${item.id}">
                ${this.renderItemTemplate(item)}
            </div>
        `).join('');
    }

    renderItemTemplate(item) {
        if (this.options.itemTemplate) {
            return this.options.itemTemplate.replace(/\{\{(\w+)\}\}/g, (match, field) => {
                return item[field] || '';
            });
        }

        // Default template
        return `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${item.code || item.name || item.id}</strong>
                    ${item.description ? `<br><small class="text-muted">${item.description}</small>` : ''}
                </div>
                ${item.status ? `<span class="badge bg-secondary">${item.status}</span>` : ''}
            </div>
        `;
    }

    handleKeyDown(event) {
        const dropdown = this.container.querySelector('.lookup-dropdown');
        const isOpen = dropdown.style.display !== 'none';
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (!isOpen) {
                    this.openDropdown();
                } else {
                    this.selectNextItem();
                }
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                if (isOpen) {
                    this.selectPreviousItem();
                }
                break;
                
            case 'Enter':
                event.preventDefault();
                if (isOpen) {
                    const selectedItem = this.container.querySelector('.lookup-item.active');
                    if (selectedItem) {
                        const itemId = selectedItem.getAttribute('data-item-id');
                        this.selectItem(itemId);
                    }
                }
                break;
                
            case 'Escape':
                this.closeDropdown();
                break;
                
            case 'Tab':
                this.closeDropdown();
                break;
        }
    }

    selectNextItem() {
        const items = this.container.querySelectorAll('.lookup-item');
        const activeItem = this.container.querySelector('.lookup-item.active');
        
        if (!activeItem) {
            items[0]?.classList.add('active');
        } else {
            const currentIndex = Array.from(items).indexOf(activeItem);
            activeItem.classList.remove('active');
            
            const nextIndex = (currentIndex + 1) % items.length;
            items[nextIndex]?.classList.add('active');
        }
    }

    selectPreviousItem() {
        const items = this.container.querySelectorAll('.lookup-item');
        const activeItem = this.container.querySelector('.lookup-item.active');
        
        if (!activeItem) {
            items[items.length - 1]?.classList.add('active');
        } else {
            const currentIndex = Array.from(items).indexOf(activeItem);
            activeItem.classList.remove('active');
            
            const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
            items[prevIndex]?.classList.add('active');
        }
    }

    selectItem(itemId) {
        const item = this.items.find(i => String(i.id) === String(itemId));
        if (!item) return;

        this.selectedItem = item;
        
        // Update search input
        const searchInput = this.container.querySelector('.lookup-search');
        const displayValue = this.getDisplayValue(item);
        searchInput.value = displayValue;

        // Update hidden fields
        const valueField = this.container.querySelector('.lookup-value');
        const displayField = this.container.querySelector('.lookup-display');
        
        if (valueField) valueField.value = item.id;
        if (displayField) displayField.value = displayValue;

        // Show clear button
        const clearBtn = this.container.querySelector('.lookup-clear');
        if (clearBtn) clearBtn.style.display = 'block';

        this.closeDropdown();
        
        // Dispatch change event
        this.dispatchEvent('change', {
            selectedItem: this.selectedItem,
            value: item.id,
            display: displayValue
        });
    }

    getDisplayValue(item) {
        if (this.options.displayTemplate) {
            return this.options.displayTemplate.replace(/\{\{(\w+)\}\}/g, (match, field) => {
                return item[field] || '';
            });
        }

        // Default display format
        return `${item.code || item.name || item.id}${item.description ? ' - ' + item.description : ''}`;
    }

    clearValue() {
        this.selectedItem = null;

        // Clear search input
        const searchInput = this.container.querySelector('.lookup-search');
        searchInput.value = '';

        // Clear hidden fields
        const valueField = this.container.querySelector('.lookup-value');
        const displayField = this.container.querySelector('.lookup-display');
        
        if (valueField) valueField.value = '';
        if (displayField) displayField.value = '';

        // Hide clear button
        const clearBtn = this.container.querySelector('.lookup-clear');
        if (clearBtn) clearBtn.style.display = 'none';

        this.closeDropdown();
        
        // Dispatch change event
        this.dispatchEvent('change', {
            selectedItem: null,
            value: '',
            display: ''
        });
    }

    openDropdown(showAll = false) {
        const dropdown = this.container.querySelector('.lookup-dropdown');
        
        if (showAll || this.filteredItems.length > 0) {
            if (showAll) {
                this.filteredItems = [...this.items];
                this.renderResults();
            }
            
            dropdown.style.display = 'block';
            this.isOpen = true;
        }
    }

    closeDropdown() {
        const dropdown = this.container.querySelector('.lookup-dropdown');
        dropdown.style.display = 'none';
        this.isOpen = false;

        // Remove active states
        this.container.querySelectorAll('.lookup-item.active').forEach(item => {
            item.classList.remove('active');
        });
    }

    showLoading() {
        const loading = this.container.querySelector('.lookup-loading');
        const results = this.container.querySelector('.lookup-results');
        const noResults = this.container.querySelector('.lookup-no-results');
        
        if (loading) loading.style.display = 'block';
        if (results) results.innerHTML = '';
        if (noResults) noResults.style.display = 'none';
    }

    hideLoading() {
        const loading = this.container.querySelector('.lookup-loading');
        if (loading) loading.style.display = 'none';
    }

    showError(message) {
        const results = this.container.querySelector('.lookup-results');
        const noResults = this.container.querySelector('.lookup-no-results');
        
        if (results) results.innerHTML = '';
        if (noResults) {
            noResults.textContent = message;
            noResults.style.display = 'block';
        }
    }

    setValue(value, display = null) {
        if (!value) {
            this.clearValue();
            return;
        }

        // Find item by ID
        const item = this.items.find(i => String(i.id) === String(value));
        if (item) {
            this.selectItem(item.id);
        } else {
            // Set value even if item not found in current list
            const searchInput = this.container.querySelector('.lookup-search');
            const valueField = this.container.querySelector('.lookup-value');
            const displayField = this.container.querySelector('.lookup-display');
            
            if (searchInput) searchInput.value = display || value;
            if (valueField) valueField.value = value;
            if (displayField) displayField.value = display || value;

            const clearBtn = this.container.querySelector('.lookup-clear');
            if (clearBtn) clearBtn.style.display = 'block';
        }
    }

    getValue() {
        return {
            item: this.selectedItem,
            value: this.selectedItem?.id || '',
            display: this.selectedItem ? this.getDisplayValue(this.selectedItem) : ''
        };
    }

    refresh() {
        // Clear cache and reload data
        this.cache.clear();
        this.loadData();
    }

    dispatchEvent(eventType, data = {}) {
        const event = new CustomEvent(`system-lookup-${eventType}`, {
            detail: {
                fieldName: this.options.fieldName,
                containerId: this.containerId,
                ...data
            }
        });
        document.dispatchEvent(event);
    }
}

// Make globally accessible
window.SystemLookup = SystemLookup;