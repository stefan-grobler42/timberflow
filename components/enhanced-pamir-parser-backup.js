// Enhanced Pamir Parser for Complex BOM Generation
class EnhancedPamirParser {
    constructor() {
        this.variables = {};
        this.bomData = {
            trusses: [],
            infill: [],
            hangers: [],
            importedSundries: []
        };
        // Stock mappings removed - placeholder implementation
        this.stockMappings = {};
        this.materialContainers = this.initializeMaterialContainers();
    }

    initializeMaterialContainers() {
        // Material containers removed - placeholder implementation
        return {};
                        stockCode: 'FLASH-RIDGE-0.5-CP',
                        formula: 'RIDGE_LENGTH',
                        variables: ['colour']
                    },
                    {
                        group: 'Barge Flashing',
                        stockCode: 'FLASH-BARGE-0.5-CP',
                        formula: 'BARGE_LENGTH',
                        variables: ['colour', 'girth']
                    }
                ]
            }
        };
    }

    async parsePamirFiles(csvFile, excelFile) {
        try {
            console.log('Parsing Pamir export files...');
            
            // Parse CSV file for variables
            const csvData = await this.parseCSVFile(csvFile);
            this.extractVariables(csvData);
            
            // Parse Excel file for detailed BOM data
            if (excelFile) {
                const excelData = await this.parseExcelFile(excelFile);
                this.extractBOMData(excelData);
            }
            
            // Generate comprehensive BOM
            const generatedBOM = await this.generateComprehensiveBOM();
            
            return {
                variables: this.variables,
                bomData: this.bomData,
                generatedBOM: generatedBOM,
                summary: this.generateSummary()
            };
            
        } catch (error) {
            console.error('Pamir parsing failed:', error);
            throw new Error(`Failed to parse Pamir files: ${error.message}`);
        }
    }

    async parseCSVFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const csv = e.target.result;
                    const lines = csv.split('\n');
                    const data = [];
                    
                    lines.forEach(line => {
                        const [variable, value, unit] = line.split(',');
                        if (variable && value && unit) {
                            data.push({
                                variable: variable.trim(),
                                value: parseFloat(value.trim()) || value.trim(),
                                unit: unit.trim()
                            });
                        }
                    });
                    
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    async parseExcelFile(file) {
        // This would typically use a library like SheetJS
        // For now, return a structured format that represents expected Excel data
        return {
            trusses: [
                { type: 'Hip Truss', span: '8.5m', quantity: 14, timber: '38x114', plates: 24 },
                { type: 'Gable Truss', span: '8.5m', quantity: 2, timber: '38x114', plates: 20 }
            ],
            hangers: [
                { type: 'Standard Hanger', quantity: 16, code: 'HNG-STD' },
                { type: 'Torsional Restraint', quantity: 10, code: 'HNG-TOR' }
            ],
            timber: [
                { grade: 'Pine', size: '38x114', length: 3.0, quantity: 120 },
                { grade: 'Pine', size: '38x76', length: 2.4, quantity: 80 }
            ]
        };
    }

    extractVariables(csvData) {
        csvData.forEach(item => {
            this.variables[item.variable] = {
                value: item.value,
                unit: item.unit,
                description: this.getVariableDescription(item.variable)
            };
        });
        
        console.log('Extracted variables:', Object.keys(this.variables).length);
    }

    getVariableDescription(variable) {
        const descriptions = {
            'GABLE_COUNT': 'Number of gable end trusses',
            'TRUSS_VALLEY_INTERSECTS': 'Valley truss intersection points',
            'BATTEN_GABLE_INTERSECTS': 'Batten to gable intersections',
            'TRUSS_EAVE_INTERSECTS': 'Truss to eave intersections',
            'BATTEN_PARAPET_INTERSECTS': 'Batten to parapet intersections',
            'TRUSS_DUO_RIDGE_INTERSECTS': 'Duo ridge intersections',
            'TRUSS_MONO_RIDGE_INTERSECTS': 'Mono ridge intersections',
            'TRUSS_PARAPET_INTERSECTS': 'Truss to parapet intersections',
            'HANGER_TORSIONAL_RESTRAINT_STRAPS': 'Torsional restraint straps required'
        };
        
        return descriptions[variable] || variable.replace(/_/g, ' ').toLowerCase();
    }

    extractBOMData(excelData) {
        // Extract truss data
        if (excelData.trusses) {
            this.bomData.trusses = excelData.trusses.map(truss => ({
                ...truss,
                stockCode: this.generateTrussCode(truss),
                bomItems: this.generateTrussBOM(truss)
            }));
        }

        // Extract hanger data
        if (excelData.hangers) {
            this.bomData.hangers = excelData.hangers;
        }

        // Process timber for infill
        if (excelData.timber) {
            this.bomData.infill = excelData.timber.map(timber => ({
                stockCode: timber.size,
                description: `${timber.grade} Timber ${timber.size}mm`,
                quantity: timber.quantity,
                length: timber.length,
                unit: 'm'
            }));
        }
    }

    generateTrussCode(truss) {
        const type = truss.type.replace(/\s+/g, '-').toUpperCase();
        const span = truss.span.replace('m', '').replace('.', '_');
        return `TT-${type}-${span}M`;
    }

    generateTrussBOM(truss) {
        // Calculate timber requirements based on truss specifications
        const timberPerTruss = this.calculateTimberPerTruss(truss.span, truss.type);
        const platesPerTruss = truss.plates / truss.quantity;

        return [
            {
                stockCode: truss.timber,
                description: `Pine Timber ${truss.timber}mm`,
                quantity: timberPerTruss * truss.quantity,
                unit: 'm'
            },
            {
                stockCode: 'PLT-20',
                description: '20ga Nail Plates',
                quantity: truss.plates,
                unit: 'ea'
            }
        ];
    }

    calculateTimberPerTruss(span, type) {
        // Simplified calculation - would be more complex in reality
        const baseSpan = parseFloat(span.replace('m', ''));
        const multiplier = type.includes('Hip') ? 1.8 : 1.5;
        return Math.round(baseSpan * multiplier * 100) / 100;
    }

    async generateComprehensiveBOM() {
        const bom = {
            header: {
                trusses: [],
                infill: [],
                hangers: []
            },
            importedSundries: []
        };

        // Add manufactured trusses to header
        bom.header.trusses = this.bomData.trusses.map(truss => ({
            stockCode: truss.stockCode,
            description: `${truss.type} - ${truss.span}`,
            quantity: truss.quantity,
            unit: 'ea',
            bomItems: truss.bomItems,
            collapsible: true,
            group: 'Roof Trusses'
        }));

        // Add infill timber
        bom.header.infill = this.bomData.infill.map(item => ({
            ...item,
            group: 'Infill Timber',
            collapsible: true
        }));

        // Add hangers
        bom.header.hangers = this.bomData.hangers.map(hanger => ({
            stockCode: hanger.code,
            description: hanger.type,
            quantity: hanger.quantity,
            unit: 'ea',
            group: 'Hangers & Connectors',
            collapsible: true
        }));

        // Process material containers with formulas
        for (const [containerKey, container] of Object.entries(this.materialContainers)) {
            const containerItems = this.processContainer(container);
            if (containerItems.length > 0) {
                bom.importedSundries.push({
                    name: container.name,
                    items: containerItems,
                    collapsible: true
                });
            }
        }

        // Consolidate nails by weight
        this.consolidateNails(bom);

        return bom;
    }

    processContainer(container) {
        const processedItems = [];
        
        container.items.forEach(item => {
            const quantity = this.calculateFormulaValue(item.formula);
            
            if (quantity > 0) {
                processedItems.push({
                    stockCode: item.stockCode,
                    description: this.getStockDescription(item.stockCode),
                    quantity: quantity,
                    unit: this.getStockUnit(item.stockCode),
                    group: item.group
                });

                // Add associated nails if present
                if (item.nails && quantity > 0) {
                    const nailQuantity = this.calculateFormulaValue(item.nails.formula);
                    if (nailQuantity > 0) {
                        processedItems.push({
                            stockCode: item.nails.code,
                            description: this.getStockDescription(item.nails.code),
                            quantity: nailQuantity,
                            unit: 'ea',
                            group: item.group,
                            consolidateToKg: true
                        });
                    }
                }
            }
        });

        return processedItems;
    }

    calculateFormulaValue(formula) {
        // Simplified formula calculation using extracted variables
        // In reality, this would be much more sophisticated
        
        const formulaCalculations = {
            'TOP_CHORD_BRACING_LENGTH': () => {
                const gableCount = this.variables['GABLE_COUNT']?.value || 0;
                const eaveIntersects = this.variables['TRUSS_EAVE_INTERSECTS']?.value || 0;
                return (gableCount * 8.5) + (eaveIntersects * 0.6);
            },
            'WEB_BRACING_LENGTH': () => {
                const ridgeIntersects = (this.variables['TRUSS_DUO_RIDGE_INTERSECTS']?.value || 0) + 
                                     (this.variables['TRUSS_MONO_RIDGE_INTERSECTS']?.value || 0);
                return ridgeIntersects * 2.4;
            },
            'BOTTOM_CHORD_BRACING_LENGTH': () => {
                const valleyIntersects = this.variables['TRUSS_VALLEY_INTERSECTS']?.value || 0;
                return valleyIntersects * 1.8;
            },
            'TOP_CHORD_NAILS': () => {
                const length = formulaCalculations['TOP_CHORD_BRACING_LENGTH']();
                return Math.ceil(length * 12); // 12 nails per meter
            },
            'WEB_BRACING_NAILS': () => {
                const length = formulaCalculations['WEB_BRACING_LENGTH']();
                return Math.ceil(length * 8); // 8 nails per meter
            },
            'BOTTOM_CHORD_NAILS': () => {
                const length = formulaCalculations['BOTTOM_CHORD_BRACING_LENGTH']();
                return Math.ceil(length * 10); // 10 nails per meter
            }
        };

        const calculation = formulaCalculations[formula];
        return calculation ? Math.round(calculation() * 100) / 100 : 0;
    }

    consolidateNails(bom) {
        const nailConsolidation = {};
        
        // Collect all nail quantities
        const processItems = (items) => {
            items.forEach(item => {
                if (item.consolidateToKg && item.stockCode.includes('NAIL')) {
                    if (!nailConsolidation[item.stockCode]) {
                        nailConsolidation[item.stockCode] = {
                            description: item.description,
                            totalEach: 0,
                            groups: []
                        };
                    }
                    nailConsolidation[item.stockCode].totalEach += item.quantity;
                    nailConsolidation[item.stockCode].groups.push(item.group);
                }
                
                if (item.items) {
                    processItems(item.items);
                }
                if (item.bomItems) {
                    processItems(item.bomItems);
                }
            });
        };

        // Process all BOM sections
        Object.values(bom.header).flat().forEach(items => processItems(Array.isArray(items) ? items : [items]));
        bom.importedSundries.forEach(container => processItems(container.items));

        // Add consolidated nails section
        if (Object.keys(nailConsolidation).length > 0) {
            const consolidatedNails = Object.entries(nailConsolidation).map(([code, data]) => ({
                stockCode: code,
                description: `${data.description} (Consolidated)`,
                quantity: this.convertNailsToKg(data.totalEach, code),
                unit: 'kg',
                group: 'Consolidated Fasteners',
                originalQuantity: data.totalEach,
                usedIn: data.groups.join(', ')
            }));

            bom.importedSundries.push({
                name: 'Consolidated Nails & Fasteners',
                items: consolidatedNails,
                collapsible: true
            });
        }
    }

    convertNailsToKg(quantity, nailCode) {
        // Nail weight conversions (nails per kg)
        const nailWeights = {
            'NAIL-75': 180,  // 75mm nails per kg
            'NAIL-90': 150,  // 90mm nails per kg
            'NAIL-65': 200   // 65mm nails per kg
        };
        
        const nailsPerKg = nailWeights[nailCode] || 180;
        return Math.ceil((quantity / nailsPerKg) * 100) / 100;
    }

    getStockDescription(stockCode) {
        const descriptions = {
            '38x114': 'Pine Timber 38x114mm',
            '38x76': 'Pine Timber 38x76mm',
            '38x38': 'Pine Timber 38x38mm',
            'PLT-20': '20ga Nail Plates',
            'PLT-18': '18ga Nail Plates',
            'HNG-STD': 'Standard Timber Hanger',
            'HNG-TOR': 'Torsional Restraint Hanger',
            'NAIL-75': '75mm Galvanised Nails',
            'NAIL-90': '90mm Galvanised Nails',
            'SCREW-12X65': '12x65mm Timber Screws'
        };
        
        return descriptions[stockCode] || stockCode;
    }

    getStockUnit(stockCode) {
        if (stockCode.includes('TIMBER') || stockCode.match(/^\d+x\d+$/)) {
            return 'm';
        }
        if (stockCode.includes('NAIL') || stockCode.includes('SCREW') || stockCode.includes('PLT')) {
            return 'ea';
        }
        return 'ea';
    }

    generateSummary() {
        const trussCount = this.bomData.trusses.reduce((sum, truss) => sum + truss.quantity, 0);
        const hangerCount = this.bomData.hangers.reduce((sum, hanger) => sum + hanger.quantity, 0);
        
        return {
            totalTrusses: trussCount,
            totalHangers: hangerCount,
            variablesExtracted: Object.keys(this.variables).length,
            bomSections: Object.keys(this.bomData).length,
            processingDate: new Date().toISOString()
        };
    }

    // Public method to get formatted BOM for display
    getFormattedBOM() {
        return {
            variables: this.variables,
            bom: this.bomData,
            summary: this.generateSummary()
        };
    }

    // Public method to export BOM data
    exportBOMData(format = 'json') {
        const data = this.getFormattedBOM();
        
        if (format === 'csv') {
            return this.convertToCSV(data);
        }
        
        return JSON.stringify(data, null, 2);
    }

    convertToCSV(data) {
        const rows = [];
        rows.push(['Stock Code', 'Description', 'Quantity', 'Unit', 'Group']);
        
        // Add all BOM items to CSV
        const addItems = (items, groupName) => {
            items.forEach(item => {
                rows.push([
                    item.stockCode,
                    item.description,
                    item.quantity,
                    item.unit,
                    item.group || groupName
                ]);
            });
        };

        Object.entries(data.bom.header).forEach(([key, items]) => {
            addItems(Array.isArray(items) ? items : [items], key);
        });

        data.bom.importedSundries.forEach(container => {
            addItems(container.items, container.name);
        });

        return rows.map(row => row.join(',')).join('\n');
    }
}

// Make globally accessible
window.EnhancedPamirParser = EnhancedPamirParser;