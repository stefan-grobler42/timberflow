// Template Manager for Material Lists with Formula Integration
class TemplateManager {
    constructor() {
        this.templates = {};
        this.availableVariables = {};
        this.initializeTemplates();
    }

    initializeTemplates() {
        // Initialize standard material templates
        this.templates = {
            'corrugated-metal-roof': {
                name: 'Corrugated Metal Roof Package',
                description: 'Complete corrugated metal roofing solution',
                category: 'Roof Covering',
                groups: [
                    {
                        name: 'Roof Sheeting',
                        collapsible: true,
                        items: [
                            {
                                stockCode: 'SHEET-0.5-AZ100-CP-CORR',
                                description: '0.5mm AZ100 G550 Colorplus Corrugated Sheeting',
                                formula: 'ROOF_AREA / COVER_WIDTH',
                                variables: ['colour', 'length'],
                                unit: 'm',
                                hasVariables: true,
                                requiresTally: true
                            }
                        ]
                    },
                    {
                        name: 'Fasteners',
                        collapsible: true,
                        items: [
                            {
                                stockCode: 'SCREW-12X65-NEO',
                                description: '12x65mm Neo Screws with Seal',
                                formula: '(ROOF_AREA / COVER_WIDTH) * 8',
                                unit: 'ea',
                                consolidateToKg: true
                            }
                        ]
                    },
                    {
                        name: 'Ridge & Barge',
                        collapsible: true,
                        items: [
                            {
                                stockCode: 'RIDGE-0.5-CP-CORR',
                                description: 'Ridge Cap 0.5mm Colorplus Corrugated',
                                formula: 'RIDGE_LENGTH + BARGE_LENGTH',
                                variables: ['colour'],
                                unit: 'm',
                                hasVariables: true
                            }
                        ]
                    },
                    {
                        name: 'Gutters & Downpipes',
                        collapsible: true,
                        items: [
                            {
                                stockCode: 'GUTTER-115-CP',
                                description: '115mm Colorplus Half Round Gutter',
                                formula: 'GUTTER_LENGTH',
                                variables: ['colour'],
                                unit: 'm',
                                hasVariables: true
                            },
                            {
                                stockCode: 'DOWNPIPE-80-CP',
                                description: '80mm Colorplus Round Downpipe',
                                formula: 'DOWNPIPE_COUNT * DOWNPIPE_HEIGHT',
                                variables: ['colour'],
                                unit: 'm',
                                hasVariables: true
                            }
                        ]
                    }
                ]
            },
            'clay-tile-roof': {
                name: 'Clay Tile Roof Package', 
                description: 'Complete clay tile roofing solution',
                category: 'Roof Covering',
                groups: [
                    {
                        name: 'Concrete Tiles',
                        collapsible: true,
                        items: [
                            {
                                stockCode: 'TILE-CONCRETE-FRENCH',
                                description: 'Concrete French Pattern Roof Tiles',
                                formula: 'ROOF_AREA * 10.5',
                                variables: ['colour', 'finish'],
                                unit: 'ea',
                                hasVariables: true
                            }
                        ]
                    },
                    {
                        name: 'Underlays',
                        collapsible: true,
                        items: [
                            {
                                stockCode: 'UNDERLAY-SISALATION',
                                description: 'Sisalation Reflective Underlay',
                                formula: 'ROOF_AREA * 1.1',
                                unit: 'm2'
                            }
                        ]
                    },
                    {
                        name: 'Battens',
                        collapsible: true,
                        items: [
                            {
                                stockCode: '38x38',
                                description: 'Pine Timber Battens 38x38mm',
                                formula: 'BATTEN_TOTAL_LENGTH',
                                unit: 'm',
                                requiresTally: true,
                                nails: { code: 'NAIL-90', formula: 'BATTEN_TOTAL_LENGTH * 12' }
                            }
                        ]
                    },
                    {
                        name: 'Ridge & Hip Tiles',
                        collapsible: true,
                        items: [
                            {
                                stockCode: 'TILE-RIDGE-CONCRETE',
                                description: 'Concrete Ridge Tiles',
                                formula: '(RIDGE_LENGTH + HIP_LENGTH) / 0.33',
                                variables: ['colour', 'finish'],
                                unit: 'ea',
                                hasVariables: true
                            }
                        ]
                    }
                ]
            },
            'bracing-package': {
                name: 'Timber Bracing Package',
                description: 'Comprehensive timber bracing solution',
                category: 'Structural',
                groups: [
                    {
                        name: 'Top Chord Bracing',
                        collapsible: true,
                        items: [
                            {
                                stockCode: '38x114',
                                description: 'Pine Timber 38x114mm - Top Chord',
                                formula: 'TOP_CHORD_BRACING_LENGTH',
                                unit: 'm',
                                requiresTally: true,
                                nails: { code: 'NAIL-75', formula: 'TOP_CHORD_BRACING_LENGTH * 12' }
                            }
                        ]
                    },
                    {
                        name: 'Web Bracing',
                        collapsible: true,
                        items: [
                            {
                                stockCode: '38x76',
                                description: 'Pine Timber 38x76mm - Web Bracing',
                                formula: 'WEB_BRACING_LENGTH',
                                unit: 'm',
                                requiresTally: true,
                                nails: { code: 'NAIL-75', formula: 'WEB_BRACING_LENGTH * 8' }
                            }
                        ]
                    },
                    {
                        name: 'Bottom Chord Bracing',
                        collapsible: true,
                        items: [
                            {
                                stockCode: '38x76',
                                description: 'Pine Timber 38x76mm - Bottom Chord',
                                formula: 'BOTTOM_CHORD_BRACING_LENGTH',
                                unit: 'm',
                                requiresTally: true,
                                nails: { code: 'NAIL-75', formula: 'BOTTOM_CHORD_BRACING_LENGTH * 10' }
                            }
                        ]
                    }
                ]
            },
            'flashing-package': {
                name: 'Complete Flashing Package',
                description: 'All required flashings for roof completion',
                category: 'Weatherproofing',
                groups: [
                    {
                        name: 'Ridge Flashings',
                        collapsible: true,
                        items: [
                            {
                                stockCode: 'FLASH-RIDGE-0.5-CP',
                                description: 'Ridge Flashing 0.5mm Colorplus',
                                formula: 'RIDGE_LENGTH',
                                variables: ['colour', 'profile'],
                                unit: 'm',
                                hasVariables: true
                            }
                        ]
                    },
                    {
                        name: 'Barge Flashings',
                        collapsible: true,
                        items: [
                            {
                                stockCode: 'FLASH-BARGE-0.5-CP',
                                description: 'Barge Flashing 0.5mm Colorplus',
                                formula: 'BARGE_LENGTH',
                                variables: ['colour', 'girth'],
                                unit: 'm',
                                hasVariables: true
                            }
                        ]
                    },
                    {
                        name: 'Valley Flashings',
                        collapsible: true,
                        items: [
                            {
                                stockCode: 'FLASH-VALLEY-0.5-CP',
                                description: 'Valley Flashing 0.5mm Colorplus',
                                formula: 'VALLEY_LENGTH',
                                variables: ['colour', 'width'],
                                unit: 'm',
                                hasVariables: true
                            }
                        ]
                    },
                    {
                        name: 'Step Flashings',
                        collapsible: true,
                        items: [
                            {
                                stockCode: 'FLASH-STEP-0.5-CP',
                                description: 'Step Flashing 0.5mm Colorplus',
                                formula: 'STEP_FLASHING_COUNT * 0.3',
                                variables: ['colour'],
                                unit: 'm',
                                hasVariables: true
                            }
                        ]
                    }
                ]
            },
            'insulation-package': {
                name: 'Roof Insulation Package',
                description: 'Thermal and acoustic insulation solution',
                category: 'Insulation',
                groups: [
                    {
                        name: 'Bulk Insulation',
                        collapsible: true,
                        items: [
                            {
                                stockCode: 'INSUL-GLASSWOOL-R1.5',
                                description: 'Glasswool Insulation Batts R1.5',
                                formula: 'ROOF_AREA * 1.05',
                                unit: 'm2'
                            }
                        ]
                    },
                    {
                        name: 'Reflective Insulation',
                        collapsible: true,
                        items: [
                            {
                                stockCode: 'INSUL-REFLECTIVE-FOIL',
                                description: 'Reflective Foil Insulation',
                                formula: 'ROOF_AREA * 1.1',
                                unit: 'm2'
                            }
                        ]
                    }
                ]
            }
        };
    }

    getAvailableTemplates() {
        return Object.entries(this.templates).map(([key, template]) => ({
            id: key,
            name: template.name,
            description: template.description,
            category: template.category,
            groupCount: template.groups.length,
            itemCount: template.groups.reduce((sum, group) => sum + group.items.length, 0)
        }));
    }

    getTemplate(templateId) {
        return this.templates[templateId];
    }

    setAvailableVariables(variables) {
        this.availableVariables = variables;
        console.log('Template variables updated:', Object.keys(variables).length);
    }

    processTemplate(templateId, variables = null) {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`Template ${templateId} not found`);
        }

        const processedTemplate = {
            ...template,
            groups: template.groups.map(group => ({
                ...group,
                items: group.items.map(item => this.processTemplateItem(item, variables || this.availableVariables))
            }))
        };

        return processedTemplate;
    }

    processTemplateItem(item, variables) {
        const processedItem = { ...item };
        
        // Calculate quantity using formula
        if (item.formula) {
            try {
                processedItem.calculatedQuantity = this.evaluateFormula(item.formula, variables);
                processedItem.hasCalculation = true;
            } catch (error) {
                console.warn(`Formula evaluation failed for ${item.stockCode}:`, error.message);
                processedItem.calculatedQuantity = 0;
                processedItem.hasCalculation = false;
                processedItem.formulaError = error.message;
            }
        }

        // Process nail calculations
        if (item.nails && processedItem.calculatedQuantity > 0) {
            try {
                processedItem.nailQuantity = this.evaluateFormula(item.nails.formula, variables);
                processedItem.nailCode = item.nails.code;
            } catch (error) {
                console.warn(`Nail formula evaluation failed for ${item.stockCode}:`, error.message);
            }
        }

        // Set default pricing structure
        processedItem.pricing = {
            unitCost: 0,
            unitPrice: 0,
            margin: 0,
            discount: 0,
            commission: 0
        };

        return processedItem;
    }

    evaluateFormula(formula, variables) {
        // Create a safe evaluation context
        const context = { ...variables };
        
        // Define common constants
        context.COVER_WIDTH = context.COVER_WIDTH || 0.765; // Standard sheeting cover width
        
        // Replace variable names in formula
        let processedFormula = formula;
        
        // Handle division and multiplication
        Object.entries(context).forEach(([variable, data]) => {
            const value = typeof data === 'object' ? data.value : data;
            processedFormula = processedFormula.replace(new RegExp(`\\b${variable}\\b`, 'g'), value);
        });

        try {
            // Use Function constructor for safe evaluation (restricted context)
            const result = Function('"use strict"; return (' + processedFormula + ')')();
            return Math.round(result * 100) / 100; // Round to 2 decimal places
        } catch (error) {
            console.error('Formula evaluation error:', processedFormula, error);
            return 0;
        }
    }

    insertTemplateIntoQuote(templateId, quoteBuilder, variables) {
        const processedTemplate = this.processTemplate(templateId, variables);
        
        // Add template groups to quote
        processedTemplate.groups.forEach(group => {
            quoteBuilder.addMaterialGroup(group.name, group.items);
        });

        // Consolidate nails if required
        this.consolidateNailsInQuote(quoteBuilder, processedTemplate);

        return {
            template: processedTemplate,
            addedItems: this.countTemplateItems(processedTemplate)
        };
    }

    consolidateNailsInQuote(quoteBuilder, template) {
        const nailConsolidation = {};
        
        // Collect all nail items
        template.groups.forEach(group => {
            group.items.forEach(item => {
                if (item.nailCode && item.nailQuantity > 0) {
                    if (!nailConsolidation[item.nailCode]) {
                        nailConsolidation[item.nailCode] = {
                            totalEach: 0,
                            sources: []
                        };
                    }
                    nailConsolidation[item.nailCode].totalEach += item.nailQuantity;
                    nailConsolidation[item.nailCode].sources.push(group.name);
                }
            });
        });

        // Add consolidated nails group
        if (Object.keys(nailConsolidation).length > 0) {
            const consolidatedItems = Object.entries(nailConsolidation).map(([code, data]) => ({
                stockCode: code,
                description: `${this.getNailDescription(code)} (Consolidated)`,
                calculatedQuantity: this.convertNailsToKg(data.totalEach, code),
                unit: 'kg',
                originalQuantityEach: data.totalEach,
                sources: data.sources.join(', '),
                pricing: {
                    unitCost: 0,
                    unitPrice: 0,
                    margin: 0,
                    discount: 0,
                    commission: 0
                }
            }));

            quoteBuilder.addMaterialGroup('Consolidated Fasteners', consolidatedItems);
        }
    }

    convertNailsToKg(quantity, nailCode) {
        const nailWeights = {
            'NAIL-75': 180,
            'NAIL-90': 150,
            'NAIL-65': 200,
            'SCREW-12X65': 160
        };
        
        const nailsPerKg = nailWeights[nailCode] || 180;
        return Math.ceil((quantity / nailsPerKg) * 100) / 100;
    }

    getNailDescription(nailCode) {
        const descriptions = {
            'NAIL-75': '75mm Galvanised Nails',
            'NAIL-90': '90mm Galvanised Nails', 
            'NAIL-65': '65mm Galvanised Nails',
            'SCREW-12X65': '12x65mm Timber Screws'
        };
        
        return descriptions[nailCode] || nailCode;
    }

    countTemplateItems(template) {
        let totalItems = 0;
        let itemsWithQuantity = 0;
        
        template.groups.forEach(group => {
            group.items.forEach(item => {
                totalItems++;
                if (item.calculatedQuantity > 0) {
                    itemsWithQuantity++;
                }
            });
        });

        return {
            total: totalItems,
            withQuantity: itemsWithQuantity,
            withoutQuantity: totalItems - itemsWithQuantity
        };
    }

    renderTemplateSelector() {
        const templates = this.getAvailableTemplates();
        
        return `
            <div class="template-selector">
                <h6><i class="fas fa-layer-group"></i> Insert Material Template</h6>
                <div class="row">
                    ${templates.map(template => `
                        <div class="col-md-6 col-lg-4 mb-3">
                            <div class="card template-card h-100" data-template-id="${template.id}">
                                <div class="card-body">
                                    <h6 class="card-title">${template.name}</h6>
                                    <p class="card-text small text-muted">${template.description}</p>
                                    <div class="template-stats">
                                        <small class="text-info">
                                            <i class="fas fa-layer-group"></i> ${template.groupCount} groups
                                            <i class="fas fa-boxes ms-2"></i> ${template.itemCount} items
                                        </small>
                                    </div>
                                </div>
                                <div class="card-footer">
                                    <button class="btn btn-primary btn-sm w-100 insert-template" 
                                            data-template-id="${template.id}">
                                        <i class="fas fa-plus"></i> Insert Template
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderTemplatePreview(templateId) {
        const template = this.getTemplate(templateId);
        if (!template) return '';

        return `
            <div class="template-preview">
                <h6><i class="fas fa-eye"></i> Template Preview: ${template.name}</h6>
                <p class="text-muted">${template.description}</p>
                
                ${template.groups.map(group => `
                    <div class="card mb-2">
                        <div class="card-header">
                            <strong>${group.name}</strong>
                            <small class="text-muted">(${group.items.length} items)</small>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Stock Code</th>
                                            <th>Description</th>
                                            <th>Formula</th>
                                            <th>Variables</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${group.items.map(item => `
                                            <tr>
                                                <td><code>${item.stockCode}</code></td>
                                                <td>${item.description}</td>
                                                <td><small class="text-info">${item.formula || 'Manual'}</small></td>
                                                <td>
                                                    ${item.hasVariables ? 
                                                        `<span class="badge bg-warning">${item.variables?.join(', ') || 'Yes'}</span>` : 
                                                        '<span class="text-muted">None</span>'
                                                    }
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Method to create custom templates
    createCustomTemplate(templateData) {
        const templateId = templateData.name.toLowerCase().replace(/\s+/g, '-');
        this.templates[templateId] = templateData;
        return templateId;
    }

    // Method to update existing template
    updateTemplate(templateId, templateData) {
        if (this.templates[templateId]) {
            this.templates[templateId] = { ...this.templates[templateId], ...templateData };
            return true;
        }
        return false;
    }

    // Method to delete template
    deleteTemplate(templateId) {
        if (this.templates[templateId]) {
            delete this.templates[templateId];
            return true;
        }
        return false;
    }

    // Export templates for backup
    exportTemplates() {
        return JSON.stringify(this.templates, null, 2);
    }

    // Import templates from backup
    importTemplates(templatesJSON) {
        try {
            const importedTemplates = JSON.parse(templatesJSON);
            this.templates = { ...this.templates, ...importedTemplates };
            return Object.keys(importedTemplates).length;
        } catch (error) {
            console.error('Template import failed:', error);
            return 0;
        }
    }
}

// Make globally accessible
window.TemplateManager = TemplateManager;