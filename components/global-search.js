// Global Search Component for System-wide Search
class GlobalSearch {
    constructor() {
        this.searchInput = document.getElementById('global-search');
        this.searchResults = document.getElementById('search-results');
        this.searchTimeout = null;
        this.isSearching = false;
        
        this.searchableData = {
            customers: [],
            projects: [],
            quotes: [],
            orders: [],
            contacts: [],
            employees: []
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSearchableData();
    }

    setupEventListeners() {
        // Search input events
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value.trim()) {
                this.showResults();
            }
        });

        this.searchInput.addEventListener('blur', (e) => {
            // Delay hiding results to allow clicks on results
            setTimeout(() => {
                this.hideResults();
            }, 200);
        });

        // Keyboard navigation
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar-search')) {
                this.hideResults();
            }
        });
    }

    handleSearchInput(query) {
        clearTimeout(this.searchTimeout);
        
        if (query.trim().length < 2) {
            this.hideResults();
            return;
        }

        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    async performSearch(query) {
        if (this.isSearching) return;
        
        this.isSearching = true;
        this.showLoadingState();

        try {
            const results = await this.searchAllSources(query);
            this.displayResults(results);
        } catch (error) {
            console.error('Search failed:', error);
            this.showErrorState();
        } finally {
            this.isSearching = false;
        }
    }

    async searchAllSources(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        // Search in projects (from localStorage for now)
        const projects = this.getStoredProjects();
        projects.forEach(project => {
            if (this.matchesQuery(project, lowerQuery, ['clientName', 'number', 'siteAddress', 'description'])) {
                results.push({
                    type: 'project',
                    title: `${project.number} - ${project.clientName}`,
                    subtitle: project.siteAddress,
                    icon: 'fas fa-project-diagram',
                    data: project,
                    action: () => this.navigateToProject(project.id)
                });
            }
        });

        // Search in customers (mock data for now)
        const customers = this.searchableData.customers;
        customers.forEach(customer => {
            if (this.matchesQuery(customer, lowerQuery, ['name', 'company', 'email', 'phone'])) {
                results.push({
                    type: 'customer',
                    title: customer.name,
                    subtitle: customer.company || customer.email,
                    icon: 'fas fa-user-tie',
                    data: customer,
                    action: () => this.navigateToCustomer(customer.id)
                });
            }
        });

        // Search in quotes
        projects.forEach(project => {
            project.quotes?.forEach(quote => {
                if (this.matchesQuery(quote, lowerQuery, ['number', 'description'])) {
                    results.push({
                        type: 'quote',
                        title: `Quote ${quote.number}`,
                        subtitle: `${project.clientName} - R ${quote.amount?.toLocaleString() || '0'}`,
                        icon: 'fas fa-file-invoice',
                        data: { quote, project },
                        action: () => this.navigateToQuote(quote.id, project.id)
                    });
                }
            });
        });

        // Sort results by relevance
        return this.sortResultsByRelevance(results, query);
    }

    matchesQuery(item, query, fields) {
        return fields.some(field => {
            const value = item[field];
            return value && value.toString().toLowerCase().includes(query);
        });
    }

    sortResultsByRelevance(results, query) {
        return results.sort((a, b) => {
            const aScore = this.getRelevanceScore(a.title, query);
            const bScore = this.getRelevanceScore(b.title, query);
            return bScore - aScore;
        });
    }

    getRelevanceScore(text, query) {
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        
        // Exact match gets highest score
        if (lowerText === lowerQuery) return 100;
        
        // Starts with query gets high score
        if (lowerText.startsWith(lowerQuery)) return 80;
        
        // Contains query gets medium score
        if (lowerText.includes(lowerQuery)) return 60;
        
        // Word boundary match gets some score
        const words = lowerText.split(/\s+/);
        for (const word of words) {
            if (word.startsWith(lowerQuery)) return 40;
        }
        
        return 0;
    }

    displayResults(results) {
        if (results.length === 0) {
            this.showNoResults();
            return;
        }

        const html = results.map(result => `
            <div class="dropdown-item search-result-item" data-type="${result.type}">
                <div class="d-flex align-items-center">
                    <div class="search-result-icon me-3">
                        <i class="${result.icon} text-primary"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="search-result-title">${result.title}</div>
                        <div class="search-result-subtitle text-muted small">${result.subtitle}</div>
                    </div>
                    <div class="search-result-type">
                        <span class="badge bg-light text-dark">${result.type}</span>
                    </div>
                </div>
            </div>
        `).join('');

        this.searchResults.innerHTML = html;
        this.showResults();

        // Add click handlers
        this.searchResults.querySelectorAll('.search-result-item').forEach((item, index) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                results[index].action();
                this.hideResults();
                this.searchInput.blur();
            });
        });
    }

    showLoadingState() {
        this.searchResults.innerHTML = `
            <div class="dropdown-item">
                <div class="d-flex align-items-center">
                    <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                    <span>Searching...</span>
                </div>
            </div>
        `;
        this.showResults();
    }

    showErrorState() {
        this.searchResults.innerHTML = `
            <div class="dropdown-item text-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Search failed. Please try again.
            </div>
        `;
        this.showResults();
    }

    showNoResults() {
        this.searchResults.innerHTML = `
            <div class="dropdown-item text-muted">
                <i class="fas fa-search me-2"></i>
                No results found
            </div>
        `;
        this.showResults();
    }

    showResults() {
        this.searchResults.style.display = 'block';
        this.searchResults.classList.add('show');
    }

    hideResults() {
        this.searchResults.style.display = 'none';
        this.searchResults.classList.remove('show');
    }

    handleKeyboardNavigation(e) {
        const items = this.searchResults.querySelectorAll('.search-result-item');
        if (items.length === 0) return;

        let currentIndex = -1;
        items.forEach((item, index) => {
            if (item.classList.contains('active')) {
                currentIndex = index;
            }
        });

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                this.highlightResult(items, nextIndex);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                this.highlightResult(items, prevIndex);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (currentIndex >= 0) {
                    items[currentIndex].click();
                }
                break;
                
            case 'Escape':
                this.hideResults();
                this.searchInput.blur();
                break;
        }
    }

    highlightResult(items, index) {
        items.forEach(item => item.classList.remove('active'));
        if (items[index]) {
            items[index].classList.add('active');
        }
    }

    // Navigation methods
    navigateToProject(projectId) {
        // Navigate to projects module and highlight specific project
        window.app.switchTab('projects');
        // Additional logic to highlight specific project
        console.log('Navigate to project:', projectId);
    }

    navigateToCustomer(customerId) {
        window.app.switchTab('customers');
        console.log('Navigate to customer:', customerId);
    }

    navigateToQuote(quoteId, projectId) {
        window.app.switchTab('quotes');
        console.log('Navigate to quote:', quoteId, 'in project:', projectId);
    }

    // Data loading methods
    async loadSearchableData() {
        try {
            // Load sample customer data
            this.searchableData.customers = [
                {
                    id: '1',
                    name: 'John Smith',
                    company: 'Smith Construction',
                    email: 'john@smithconstruction.com',
                    phone: '+27 11 123 4567'
                },
                {
                    id: '2',
                    name: 'Sarah Wilson',
                    company: 'Wilson Builders',
                    email: 'sarah@wilsonbuilders.co.za',
                    phone: '+27 21 987 6543'
                }
            ];

            // In a real implementation, this would load from the API
            // const customers = await window.app.apiCall('/customers');
            // this.searchableData.customers = customers;
            
        } catch (error) {
            console.error('Failed to load searchable data:', error);
        }
    }

    getStoredProjects() {
        try {
            const stored = localStorage.getItem('millennium-projects');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load stored projects:', error);
            return [];
        }
    }

    // Public method to add new items to search index
    addToSearchIndex(type, items) {
        if (this.searchableData[type]) {
            this.searchableData[type].push(...items);
        }
    }

    // Public method to update search index
    updateSearchIndex(type, items) {
        if (this.searchableData[type]) {
            this.searchableData[type] = items;
        }
    }

    // Public method to refresh search data
    refreshSearchData() {
        this.loadSearchableData();
    }
}

// Make GlobalSearch globally accessible
window.GlobalSearch = GlobalSearch;