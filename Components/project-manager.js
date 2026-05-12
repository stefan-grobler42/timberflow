// Project Management Component for Millennium Timber Roof ERP
class ProjectManager {
    constructor() {
        this.projects = [];
        this.currentProject = null;
        this.clientTypes = {
            HOMEOWNER: 'homeowner',
            CONTRACTOR: 'contractor', 
            DEVELOPER: 'developer'
        };
        
        this.projectCounter = 1;
        this.quoteCounter = {};
        this.tenderCounter = {};
        
        this.initializeComponent();
    }

    initializeComponent() {
        this.loadExistingProjects();
        this.renderProjectManagement();
        this.setupEventListeners();
    }

    renderProjectManagement() {
        const container = document.getElementById('project-management-content');
        if (!container) return;

        container.innerHTML = `
            <div class="project-manager">
                <!-- Project Creation Section -->
                <div class="card mb-4">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5><i class="fas fa-plus-circle"></i> Create New Project</h5>
                        <button class="btn btn-primary btn-sm" id="new-project-btn">
                            <i class="fas fa-plus"></i> New Project
                        </button>
                    </div>
                    <div class="card-body" id="new-project-form" style="display: none;">
                        <form id="project-form">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Project Number</label>
                                        <input type="text" class="form-control" id="project-number" readonly>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Client Name *</label>
                                        <input type="text" class="form-control" id="client-name" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Client Type *</label>
                                        <select class="form-select" id="client-type" required>
                                            <option value="">Select Client Type</option>
                                            <option value="homeowner">Home Owner / Small Builder</option>
                                            <option value="contractor">Large Contractor / Builder</option>
                                            <option value="developer">Developer</option>
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Contact Person</label>
                                        <input type="text" class="form-control" id="contact-person">
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Email</label>
                                        <input type="email" class="form-control" id="contact-email">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Phone</label>
                                        <input type="tel" class="form-control" id="contact-phone">
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Site Address *</label>
                                        <textarea class="form-control" id="site-address" rows="3" required></textarea>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Description</label>
                                        <textarea class="form-control" id="project-description" rows="3"></textarea>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Sales Person</label>
                                        <select class="form-select" id="sales-person">
                                            <option value="">Select Sales Person</option>
                                            <option value="internal">Internal Sales</option>
                                            <option value="external">External Sales</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex gap-2">
                                <button type="submit" class="btn btn-success">
                                    <i class="fas fa-save"></i> Create Project
                                </button>
                                <button type="button" class="btn btn-secondary" id="cancel-project-btn">
                                    <i class="fas fa-times"></i> Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Projects List -->
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-list"></i> Active Projects</h5>
                        <div class="row mt-2">
                            <div class="col-md-6">
                                <input type="text" class="form-control" id="project-search" placeholder="Search projects...">
                            </div>
                            <div class="col-md-3">
                                <select class="form-select" id="client-type-filter">
                                    <option value="">All Client Types</option>
                                    <option value="homeowner">Home Owners</option>
                                    <option value="contractor">Contractors</option>
                                    <option value="developer">Developers</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select" id="status-filter">
                                    <option value="">All Status</option>
                                    <option value="enquiry">Enquiry</option>
                                    <option value="quoted">Quoted</option>
                                    <option value="ordered">Ordered</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <div id="projects-list">
                            <div class="text-center text-muted">
                                <i class="fas fa-folder-open fa-3x mb-3"></i>
                                <p>No projects found. Create your first project above.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Project Details Modal -->
                <div class="modal fade" id="project-details-modal" tabindex="-1">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="project-modal-title">Project Details</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body" id="project-modal-body">
                                <!-- Project details content will be dynamically loaded -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.generateProjectNumber();
    }

    setupEventListeners() {
        // New project button
        document.getElementById('new-project-btn')?.addEventListener('click', () => {
            this.toggleProjectForm(true);
        });

        // Cancel project button
        document.getElementById('cancel-project-btn')?.addEventListener('click', () => {
            this.toggleProjectForm(false);
        });

        // Project form submission
        document.getElementById('project-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createProject();
        });

        // Search and filters
        document.getElementById('project-search')?.addEventListener('input', (e) => {
            this.filterProjects();
        });

        document.getElementById('client-type-filter')?.addEventListener('change', () => {
            this.filterProjects();
        });

        document.getElementById('status-filter')?.addEventListener('change', () => {
            this.filterProjects();
        });

        // Client type change handler
        document.getElementById('client-type')?.addEventListener('change', (e) => {
            this.handleClientTypeChange(e.target.value);
        });
    }

    toggleProjectForm(show) {
        const form = document.getElementById('new-project-form');
        if (form) {
            form.style.display = show ? 'block' : 'none';
            if (show) {
                this.generateProjectNumber();
                document.getElementById('client-name')?.focus();
            } else {
                document.getElementById('project-form')?.reset();
            }
        }
    }

    generateProjectNumber() {
        const year = new Date().getFullYear().toString().slice(-2);
        const projectNum = this.projectCounter.toString().padStart(3, '0');
        const projectNumber = `E${year}-1-${projectNum}`;
        
        const input = document.getElementById('project-number');
        if (input) {
            input.value = projectNumber;
        }
        
        return projectNumber;
    }

    createProject() {
        const formData = this.getFormData();
        
        if (!this.validateProjectForm(formData)) {
            return;
        }

        const project = {
            id: Date.now().toString(),
            number: formData.projectNumber,
            clientName: formData.clientName,
            clientType: formData.clientType,
            contactPerson: formData.contactPerson,
            contactEmail: formData.contactEmail,
            contactPhone: formData.contactPhone,
            siteAddress: formData.siteAddress,
            description: formData.description,
            salesPerson: formData.salesPerson,
            status: 'enquiry',
            createdDate: new Date().toISOString(),
            quotes: [],
            tenders: [],
            orders: [],
            documents: [],
            notes: []
        };

        this.projects.push(project);
        this.projectCounter++;
        this.saveProjects();
        this.renderProjectsList();
        this.toggleProjectForm(false);
        
        this.showNotification('Project created successfully!', 'success');
        
        // Update dashboard
        this.updateDashboard();
    }

    getFormData() {
        return {
            projectNumber: document.getElementById('project-number')?.value,
            clientName: document.getElementById('client-name')?.value,
            clientType: document.getElementById('client-type')?.value,
            contactPerson: document.getElementById('contact-person')?.value,
            contactEmail: document.getElementById('contact-email')?.value,
            contactPhone: document.getElementById('contact-phone')?.value,
            siteAddress: document.getElementById('site-address')?.value,
            description: document.getElementById('project-description')?.value,
            salesPerson: document.getElementById('sales-person')?.value
        };
    }

    validateProjectForm(data) {
        const errors = [];
        
        if (!data.clientName?.trim()) {
            errors.push('Client name is required');
        }
        
        if (!data.clientType) {
            errors.push('Client type is required');
        }
        
        if (!data.siteAddress?.trim()) {
            errors.push('Site address is required');
        }

        if (errors.length > 0) {
            this.showNotification(errors.join(', '), 'error');
            return false;
        }

        return true;
    }

    renderProjectsList() {
        const container = document.getElementById('projects-list');
        if (!container) return;

        if (this.projects.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-folder-open fa-3x mb-3"></i>
                    <p>No projects found. Create your first project above.</p>
                </div>
            `;
            return;
        }

        const projectsHtml = this.projects.map(project => `
            <div class="project-item border rounded p-3 mb-3" data-project-id="${project.id}">
                <div class="row">
                    <div class="col-md-8">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">
                                    <span class="badge bg-primary me-2">${project.number}</span>
                                    ${project.clientName}
                                </h6>
                                <p class="text-muted mb-1">
                                    <i class="fas fa-user"></i> ${this.getClientTypeLabel(project.clientType)} |
                                    <i class="fas fa-calendar"></i> ${new Date(project.createdDate).toLocaleDateString()}
                                </p>
                                <p class="mb-1">
                                    <i class="fas fa-map-marker-alt"></i> ${project.siteAddress}
                                </p>
                                ${project.contactPerson ? `<p class="mb-0 text-muted"><i class="fas fa-user-tie"></i> ${project.contactPerson}</p>` : ''}
                            </div>
                            <span class="badge bg-${this.getStatusBadgeColor(project.status)} ms-2">
                                ${project.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="mb-2">
                            <small class="text-muted">
                                Quotes: ${project.quotes.length} | 
                                Tenders: ${project.tenders.length} |
                                Orders: ${project.orders.length}
                            </small>
                        </div>
                        <div class="btn-group" role="group">
                            <button class="btn btn-outline-primary btn-sm" onclick="projectManager.viewProject('${project.id}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="btn btn-outline-success btn-sm" onclick="projectManager.createQuote('${project.id}')">
                                <i class="fas fa-plus"></i> Quote
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="projectManager.createTender('${project.id}')">
                                <i class="fas fa-file-contract"></i> Tender
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = projectsHtml;
    }

    filterProjects() {
        const searchTerm = document.getElementById('project-search')?.value.toLowerCase() || '';
        const clientTypeFilter = document.getElementById('client-type-filter')?.value || '';
        const statusFilter = document.getElementById('status-filter')?.value || '';

        const filteredProjects = this.projects.filter(project => {
            const matchesSearch = project.clientName.toLowerCase().includes(searchTerm) ||
                                project.number.toLowerCase().includes(searchTerm) ||
                                project.siteAddress.toLowerCase().includes(searchTerm);
            
            const matchesClientType = !clientTypeFilter || project.clientType === clientTypeFilter;
            const matchesStatus = !statusFilter || project.status === statusFilter;

            return matchesSearch && matchesClientType && matchesStatus;
        });

        this.renderFilteredProjects(filteredProjects);
    }

    renderFilteredProjects(filteredProjects) {
        const container = document.getElementById('projects-list');
        if (!container) return;

        if (filteredProjects.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-search fa-3x mb-3"></i>
                    <p>No projects match your search criteria.</p>
                </div>
            `;
            return;
        }

        const projectsHtml = filteredProjects.map(project => `
            <div class="project-item border rounded p-3 mb-3" data-project-id="${project.id}">
                <div class="row">
                    <div class="col-md-8">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">
                                    <span class="badge bg-primary me-2">${project.number}</span>
                                    ${project.clientName}
                                </h6>
                                <p class="text-muted mb-1">
                                    <i class="fas fa-user"></i> ${this.getClientTypeLabel(project.clientType)} |
                                    <i class="fas fa-calendar"></i> ${new Date(project.createdDate).toLocaleDateString()}
                                </p>
                                <p class="mb-1">
                                    <i class="fas fa-map-marker-alt"></i> ${project.siteAddress}
                                </p>
                                ${project.contactPerson ? `<p class="mb-0 text-muted"><i class="fas fa-user-tie"></i> ${project.contactPerson}</p>` : ''}
                            </div>
                            <span class="badge bg-${this.getStatusBadgeColor(project.status)} ms-2">
                                ${project.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="mb-2">
                            <small class="text-muted">
                                Quotes: ${project.quotes.length} | 
                                Tenders: ${project.tenders.length} |
                                Orders: ${project.orders.length}
                            </small>
                        </div>
                        <div class="btn-group" role="group">
                            <button class="btn btn-outline-primary btn-sm" onclick="projectManager.viewProject('${project.id}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="btn btn-outline-success btn-sm" onclick="projectManager.createQuote('${project.id}')">
                                <i class="fas fa-plus"></i> Quote
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="projectManager.createTender('${project.id}')">
                                <i class="fas fa-file-contract"></i> Tender
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = projectsHtml;
    }

    viewProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        this.currentProject = project;
        this.renderProjectDetails(project);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('project-details-modal'));
        modal.show();
    }

    renderProjectDetails(project) {
        const modalTitle = document.getElementById('project-modal-title');
        const modalBody = document.getElementById('project-modal-body');
        
        if (modalTitle) {
            modalTitle.textContent = `${project.number} - ${project.clientName}`;
        }

        if (modalBody) {
            modalBody.innerHTML = `
                <div class="project-details">
                    <!-- Project Information -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h6><i class="fas fa-info-circle"></i> Project Information</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Project Number:</strong> ${project.number}</p>
                                    <p><strong>Client Name:</strong> ${project.clientName}</p>
                                    <p><strong>Client Type:</strong> ${this.getClientTypeLabel(project.clientType)}</p>
                                    <p><strong>Contact Person:</strong> ${project.contactPerson || 'Not specified'}</p>
                                    <p><strong>Email:</strong> ${project.contactEmail || 'Not specified'}</p>  
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Phone:</strong> ${project.contactPhone || 'Not specified'}</p>
                                    <p><strong>Sales Person:</strong> ${project.salesPerson || 'Not specified'}</p>
                                    <p><strong>Status:</strong> <span class="badge bg-${this.getStatusBadgeColor(project.status)}">${project.status.toUpperCase()}</span></p>
                                    <p><strong>Created:</strong> ${new Date(project.createdDate).toLocaleDateString()}</p>
                                </div>
                                <div class="col-12">
                                    <p><strong>Site Address:</strong><br>${project.siteAddress}</p>
                                    ${project.description ? `<p><strong>Description:</strong><br>${project.description}</p>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Quotes Section -->
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6><i class="fas fa-file-invoice"></i> Quotes (${project.quotes.length})</h6>
                            <button class="btn btn-success btn-sm" onclick="projectManager.createQuote('${project.id}')">
                                <i class="fas fa-plus"></i> New Quote
                            </button>
                        </div>
                        <div class="card-body">
                            ${this.renderQuotesList(project.quotes)}
                        </div>
                    </div>

                    <!-- Tenders Section -->
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6><i class="fas fa-file-contract"></i> Tenders (${project.tenders.length})</h6>
                            <button class="btn btn-info btn-sm" onclick="projectManager.createTender('${project.id}')">
                                <i class="fas fa-plus"></i> New Tender
                            </button>
                        </div>
                        <div class="card-body">
                            ${this.renderTendersList(project.tenders)}
                        </div>
                    </div>

                    <!-- Orders Section -->
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="fas fa-shopping-cart"></i> Orders (${project.orders.length})</h6>
                        </div>
                        <div class="card-body">
                            ${this.renderOrdersList(project.orders)}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    renderQuotesList(quotes) {
        if (quotes.length === 0) {
            return '<p class="text-muted">No quotes created yet.</p>';
        }

        return `
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Quote Number</th>
                            <th>Building Type</th>
                            <th>Option</th>
                            <th>Revision</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${quotes.map(quote => `
                            <tr>
                                <td>${quote.number}</td>
                                <td>${quote.buildingType || 'Standard'}</td>
                                <td>${quote.option || 'A'}</td>
                                <td>${quote.revision || '0'}</td>
                                <td>R ${quote.amount?.toLocaleString() || '0.00'}</td>
                                <td><span class="badge bg-${this.getStatusBadgeColor(quote.status)}">${quote.status}</span></td>
                                <td>
                                    <button class="btn btn-outline-primary btn-sm" onclick="projectManager.editQuote('${quote.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderTendersList(tenders) {
        if (tenders.length === 0) {
            return '<p class="text-muted">No tenders created yet.</p>';
        }

        return `
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Tender Number</th>
                            <th>Building Type</th>
                            <th>Quantity</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tenders.map(tender => `
                            <tr>
                                <td>${tender.number}</td>
                                <td>${tender.buildingType || 'Standard'}</td>
                                <td>${tender.quantity || 1}</td>
                                <td>R ${tender.amount?.toLocaleString() || '0.00'}</td>
                                <td><span class="badge bg-${this.getStatusBadgeColor(tender.status)}">${tender.status}</span></td>
                                <td>
                                    <button class="btn btn-outline-primary btn-sm" onclick="projectManager.editTender('${tender.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderOrdersList(orders) {
        if (orders.length === 0) {
            return '<p class="text-muted">No orders created yet.</p>';
        }

        return `
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Order Number</th>
                            <th>Based On</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => `
                            <tr>
                                <td>${order.number}</td>
                                <td>${order.basedOn}</td>
                                <td>R ${order.amount?.toLocaleString() || '0.00'}</td>
                                <td><span class="badge bg-${this.getStatusBadgeColor(order.status)}">${order.status}</span></td>
                                <td>
                                    <button class="btn btn-outline-primary btn-sm" onclick="projectManager.editOrder('${order.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    createQuote(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        // Generate quote number based on project and existing quotes
        const quoteNumber = this.generateQuoteNumber(project);
        
        // Navigate to quote builder with project context
        this.navigateToQuoteBuilder(project, quoteNumber);
    }

    createTender(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        // Generate tender number
        const tenderNumber = this.generateTenderNumber(project);
        
        this.showNotification(`Tender ${tenderNumber} creation initiated for ${project.clientName}`, 'info');
    }

    generateQuoteNumber(project) {
        // Extract project sequence from project number (E25-1-001 -> 001)
        const projectSequence = project.number.split('-')[2];
        
        // Count existing quotes for this project
        const quoteCount = project.quotes.length + 1;
        const quotePadded = quoteCount.toString().padStart(3, '0');
        
        return `Q${projectSequence}${quotePadded}A`;
    }

    generateTenderNumber(project) {
        // Extract project sequence from project number
        const projectSequence = project.number.split('-')[2];
        
        // Count existing tenders for this project
        const tenderCount = project.tenders.length + 1;
        const tenderPadded = tenderCount.toString().padStart(3, '0');
        
        return `T${projectSequence}${tenderPadded}A`;
    }

    navigateToQuoteBuilder(project, quoteNumber) {
        // Store project context
        sessionStorage.setItem('currentProject', JSON.stringify(project));
        sessionStorage.setItem('quoteNumber', quoteNumber);
        
        // Switch to quote builder tab
        document.querySelector('[data-tab="quote-builder"]')?.click();
        
        this.showNotification(`Creating quote ${quoteNumber} for ${project.clientName}`, 'info');
    }

    editQuote(quoteId) {
        this.showNotification('Quote editing functionality will be implemented', 'info');
    }

    editTender(tenderId) {
        this.showNotification('Tender editing functionality will be implemented', 'info');
    }

    editOrder(orderId) {
        this.showNotification('Order editing functionality will be implemented', 'info');
    }

    getClientTypeLabel(type) {
        const labels = {
            homeowner: 'Home Owner / Small Builder',
            contractor: 'Large Contractor / Builder',
            developer: 'Developer'
        };
        return labels[type] || type;
    }

    getStatusBadgeColor(status) {
        const colors = {
            enquiry: 'primary',
            quoted: 'info',
            ordered: 'warning',
            completed: 'success',
            cancelled: 'danger'
        };
        return colors[status] || 'secondary';
    }

    handleClientTypeChange(clientType) {
        // This method can be used to show/hide fields based on client type
        // For now, just log the change
        console.log('Client type changed to:', clientType);
    }

    loadExistingProjects() {
        try {
            const saved = localStorage.getItem('millennium-projects');
            if (saved) {
                this.projects = JSON.parse(saved);
                // Update counter to avoid duplicates
                if (this.projects.length > 0) {
                    const lastProjectNum = Math.max(...this.projects.map(p => {
                        const parts = p.number.split('-');
                        return parseInt(parts[2]) || 0;
                    }));
                    this.projectCounter = lastProjectNum + 1;
                }
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
            this.projects = [];
        }
        
        // Render projects after loading
        setTimeout(() => this.renderProjectsList(), 100);
    }

    saveProjects() {
        try {
            localStorage.setItem('millennium-projects', JSON.stringify(this.projects));
        } catch (error) {
            console.error('Failed to save projects:', error);
            this.showNotification('Failed to save project data', 'error');
        }
    }

    updateDashboard() {
        // Update dashboard counters
        const activeProjectsEl = document.getElementById('active-projects');
        if (activeProjectsEl) {
            activeProjectsEl.textContent = this.projects.filter(p => p.status !== 'completed').length;
        }

        const activeQuotesEl = document.getElementById('active-quotes');
        if (activeQuotesEl) {
            const totalQuotes = this.projects.reduce((sum, p) => sum + p.quotes.length, 0);
            activeQuotesEl.textContent = totalQuotes;
        }

        const pendingOrdersEl = document.getElementById('pending-orders');
        if (pendingOrdersEl) {
            const totalOrders = this.projects.reduce((sum, p) => sum + p.orders.length, 0);
            pendingOrdersEl.textContent = totalOrders;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // Public method to get project data for other components
    getProjectData() {
        return {
            projects: this.projects,
            currentProject: this.currentProject
        };
    }

    // Public method to add quote to project
    addQuoteToProject(projectId, quoteData) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            project.quotes.push(quoteData);
            this.saveProjects();
            return true;
        }
        return false;
    }
}

// Initialize project manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.projectManager = new ProjectManager();
});