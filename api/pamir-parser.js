// Pamir Data Parser API Layer
class PamirParser {
    constructor() {
        this.apiBaseUrl = window.app?.apiBaseUrl || 'https://cloud-mroofing.co.za/api';
        this.supportedFormats = ['.xlsx', '.xls', '.json'];
        this.variablePatterns = {
            // Common Pamir variable patterns
            dimensions: /(?:length|width|height|span|rise|pitch)[\s_]*[:=]?\s*([0-9]+\.?[0-9]*)/gi,
            materials: /(?:timber|steel|plate|fastener)[\s_]*[:=]?\s*([a-zA-Z0-9\-_]+)/gi,
            quantities: /(?:qty|quantity|count|number)[\s_]*[:=]?\s*([0-9]+\.?[0-9]*)/gi,
            grades: /(?:grade|class|strength)[\s_]*[:=]?\s*([a-zA-Z0-9]+)/gi
        };
    }

    /**
     * Parse uploaded Pamir files and extract variables and materials
     * @param {FileList} files - Files to parse
     * @returns {Promise<Object>} Parsed data with variables and materials
     */
    async parseFiles(files) {
        const results = {
            projectInfo: {},
            variables: {},
            materials: [],
            statistics: {
                filesProcessed: 0,
                variablesFound: 0,
                materialsFound: 0,
                processingTime: null
            },
            errors: []
        };

        const startTime = Date.now();

        try {
            for (const file of files) {
                if (!this.isValidFile(file)) {
                    results.errors.push(`Unsupported file format: ${file.name}`);
                    continue;
                }

                try {
                    const fileData = await this.parseFile(file);
                    this.mergeResults(results, fileData);
                    results.statistics.filesProcessed++;
                } catch (error) {
                    results.errors.push(`Error parsing ${file.name}: ${error.message}`);
                }
            }

            results.statistics.variablesFound = Object.keys(results.variables).length;
            results.statistics.materialsFound = results.materials.length;
            results.statistics.processingTime = `${Date.now() - startTime}ms`;

            return results;

        } catch (error) {
            throw new Error(`Pamir parsing failed: ${error.message}`);
        }
    }

    /**
     * Parse a single file based on its type
     * @param {File} file - File to parse
     * @returns {Promise<Object>} Parsed file data
     */
    async parseFile(file) {
        const extension = this.getFileExtension(file.name);
        
        switch (extension) {
            case '.json':
                return await this.parseJsonFile(file);
            case '.xlsx':
            case '.xls':
                return await this.parseExcelFile(file);
            default:
                throw new Error(`Unsupported file type: ${extension}`);
        }
    }

    /**
     * Parse JSON file from Pamir export
     * @param {File} file - JSON file
     * @returns {Promise<Object>} Parsed JSON data
     */
    async parseJsonFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    const parsedData = this.extractFromJson(jsonData);
                    resolve(parsedData);
                } catch (error) {
                    reject(new Error(`JSON parsing error: ${error.message}`));
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read JSON file'));
            reader.readAsText(file);
        });
    }

    /**
     * Parse Excel file from Pamir export
     * @param {File} file - Excel file
     * @returns {Promise<Object>} Parsed Excel data
     */
    async parseExcelFile(file) {
        // For Excel parsing, we'll send to the server-side parser
        // as JavaScript doesn't have robust Excel parsing capabilities
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/pamir/parse-excel`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Server parsing failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            // Fallback: try to parse as CSV if it's a simple Excel export
            return await this.parseExcelAsCsv(file);
        }
    }

    /**
     * Fallback method to parse Excel file as CSV
     * @param {File} file - Excel file
     * @returns {Promise<Object>} Parsed data
     */
    async parseExcelAsCsv(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const csvData = e.target.result;
                    const parsedData = this.extractFromCsv(csvData);
                    resolve(parsedData);
                } catch (error) {
                    reject(new Error(`CSV parsing error: ${error.message}`));
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read Excel file'));
            reader.readAsText(file);
        });
    }

    /**
     * Extract data from JSON structure
     * @param {Object} jsonData - Parsed JSON data
     * @returns {Object} Extracted variables and materials
     */
    extractFromJson(jsonData) {
        const result = {
            projectInfo: {},
            variables: {},
            materials: []
        };

        // Extract project information
        if (jsonData.project) {
            result.projectInfo = {
                name: jsonData.project.name || jsonData.project.title,
                version: jsonData.project.version,
                dateCreated: jsonData.project.date || jsonData.project.created,
                revision: jsonData.project.revision || 'A'
            };
        }

        // Extract variables from various JSON structures
        this.extractVariablesFromObject(jsonData, result.variables);

        // Extract materials
        if (jsonData.materials) {
            result.materials = this.processMaterials(jsonData.materials);
        } else if (jsonData.components) {
            result.materials = this.processMaterials(jsonData.components);
        } else if (jsonData.items) {
            result.materials = this.processMaterials(jsonData.items);
        }

        return result;
    }

    /**
     * Extract data from CSV structure
     * @param {string} csvData - CSV data string
     * @returns {Object} Extracted variables and materials
     */
    extractFromCsv(csvData) {
        const result = {
            projectInfo: {},
            variables: {},
            materials: []
        };

        const lines = csvData.split('\n').map(line => line.trim()).filter(line => line);
        const headers = this.parseCsvLine(lines[0] || '');
        
        // Process each line
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCsvLine(lines[i]);
            const rowData = {};
            
            headers.forEach((header, index) => {
                rowData[header] = values[index] || '';
            });

            // Try to identify if this is a variable or material row
            if (this.isVariableRow(rowData)) {
                this.extractVariableFromRow(rowData, result.variables);
            } else if (this.isMaterialRow(rowData)) {
                result.materials.push(this.processMaterialRow(rowData));
            }
        }

        return result;
    }

    /**
     * Recursively extract variables from nested objects
     * @param {Object} obj - Object to search
     * @param {Object} variables - Variables object to populate
     * @param {string} prefix - Prefix for nested variables
     */
    extractVariablesFromObject(obj, variables, prefix = '') {
        if (!obj || typeof obj !== 'object') return;

        for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            
            if (typeof value === 'number' || (typeof value === 'string' && this.isNumericValue(value))) {
                // This looks like a variable
                if (this.isValidVariableName(key)) {
                    variables[fullKey] = parseFloat(value) || value;
                }
            } else if (typeof value === 'object' && !Array.isArray(value)) {
                // Recurse into nested objects
                this.extractVariablesFromObject(value, variables, fullKey);
            } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                // Process array of objects (like materials)
                value.forEach((item, index) => {
                    this.extractVariablesFromObject(item, variables, `${fullKey}[${index}]`);
                });
            }
        }
    }

    /**
     * Process materials array into standardized format
     * @param {Array} materials - Raw materials data
     * @returns {Array} Processed materials
     */
    processMaterials(materials) {
        if (!Array.isArray(materials)) return [];

        return materials.map(material => this.processMaterial(material)).filter(m => m);
    }

    /**
     * Process a single material into standardized format
     * @param {Object} material - Raw material data
     * @returns {Object} Processed material
     */
    processMaterial(material) {
        if (!material || typeof material !== 'object') return null;

        return {
            code: material.code || material.partNumber || material.id,
            description: material.description || material.name || material.title,
            quantity: parseFloat(material.quantity || material.qty || material.count) || 1,
            unit: material.unit || material.uom || material.unitOfMeasure || 'EA',
            length: material.length || material.size || null,
            width: material.width || null,
            height: material.height || material.thickness || null,
            grade: material.grade || material.class || material.strength || null,
            category: this.categorizeExtract(material),
            properties: this.extractProperties(material),
            stockMatch: 'unknown' // Will be determined when matching against stock
        };
    }

    /**
     * Process a CSV row as material
     * @param {Object} rowData - Row data object
     * @returns {Object} Processed material
     */
    processMaterialRow(rowData) {
        // Common column names in Pamir exports
        const codeFields = ['code', 'part_number', 'item_code', 'material_code'];
        const descFields = ['description', 'name', 'material', 'component'];
        const qtyFields = ['quantity', 'qty', 'count', 'pieces'];
        const unitFields = ['unit', 'uom', 'unit_of_measure'];

        return {
            code: this.findFieldValue(rowData, codeFields),
            description: this.findFieldValue(rowData, descFields),
            quantity: parseFloat(this.findFieldValue(rowData, qtyFields)) || 1,
            unit: this.findFieldValue(rowData, unitFields) || 'EA',
            length: parseFloat(rowData.length) || null,
            width: parseFloat(rowData.width) || null,
            height: parseFloat(rowData.height || rowData.thickness) || null,
            grade: rowData.grade || rowData.class || null,
            category: this.categorizeExtract(rowData),
            properties: this.extractProperties(rowData),
            stockMatch: 'unknown'
        };
    }

    /**
     * Extract variable from CSV row
     * @param {Object} rowData - Row data
     * @param {Object} variables - Variables object to populate
     */
    extractVariableFromRow(rowData, variables) {
        for (const [key, value] of Object.entries(rowData)) {
            if (this.isValidVariableName(key) && this.isNumericValue(value)) {
                variables[key] = parseFloat(value);
            }
        }
    }

    /**
     * Extract properties from material object
     * @param {Object} material - Material object
     * @returns {Object} Extracted properties
     */
    extractProperties(material) {
        const properties = {};
        const standardFields = ['code', 'description', 'quantity', 'unit', 'length', 'width', 'height', 'grade'];
        
        for (const [key, value] of Object.entries(material)) {
            if (!standardFields.includes(key.toLowerCase()) && value !== null && value !== undefined && value !== '') {
                properties[key] = value;
            }
        }
        
        return properties;
    }

    /**
     * Categorize material based on its properties
     * @param {Object} material - Material object
     * @returns {string} Category
     */
    categorizeExtract(material) {
        const desc = (material.description || material.name || '').toLowerCase();
        const code = (material.code || '').toLowerCase();
        
        if (desc.includes('timber') || desc.includes('wood') || desc.includes('lumber')) {
            return 'timber';
        } else if (desc.includes('plate') || desc.includes('connector')) {
            return 'plates';
        } else if (desc.includes('nail') || desc.includes('screw') || desc.includes('bolt')) {
            return 'fasteners';
        } else if (desc.includes('steel') || desc.includes('metal')) {
            return 'hardware';
        } else {
            return 'accessories';
        }
    }

    /**
     * Merge parsing results from multiple files
     * @param {Object} mainResults - Main results object
     * @param {Object} fileResults - Results from single file
     */
    mergeResults(mainResults, fileResults) {
        // Merge project info (last file wins for conflicts)
        if (fileResults.projectInfo) {
            Object.assign(mainResults.projectInfo, fileResults.projectInfo);
        }

        // Merge variables
        if (fileResults.variables) {
            Object.assign(mainResults.variables, fileResults.variables);
        }

        // Merge materials
        if (fileResults.materials) {
            mainResults.materials.push(...fileResults.materials);
        }
    }

    /**
     * Utility methods
     */
    isValidFile(file) {
        const extension = this.getFileExtension(file.name);
        return this.supportedFormats.includes(extension);
    }

    getFileExtension(filename) {
        return filename.toLowerCase().substring(filename.lastIndexOf('.'));
    }

    isNumericValue(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    isValidVariableName(name) {
        // Check if the name looks like a variable (not just noise)
        return name && 
               typeof name === 'string' && 
               name.length > 1 && 
               /^[a-zA-Z][a-zA-Z0-9_\.]*$/.test(name) &&
               !['id', 'index', 'row', 'column', 'cell'].includes(name.toLowerCase());
    }

    isVariableRow(rowData) {
        // Heuristic to determine if a CSV row contains variables
        const values = Object.values(rowData);
        const numericValues = values.filter(v => this.isNumericValue(v));
        return numericValues.length > values.length * 0.5; // More than half are numeric
    }

    isMaterialRow(rowData) {
        // Heuristic to determine if a CSV row contains material data
        const keys = Object.keys(rowData).map(k => k.toLowerCase());
        const materialKeywords = ['code', 'description', 'quantity', 'material', 'component', 'part'];
        return materialKeywords.some(keyword => keys.some(key => key.includes(keyword)));
    }

    findFieldValue(obj, fieldNames) {
        for (const field of fieldNames) {
            const value = obj[field] || obj[field.toLowerCase()] || obj[field.toUpperCase()];
            if (value !== undefined && value !== null && value !== '') {
                return value;
            }
        }
        return null;
    }

    parseCsvLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    /**
     * Get parsing statistics for display
     * @param {Object} results - Parsing results
     * @returns {Object} Statistics object
     */
    getStatistics(results) {
        return {
            totalFiles: results.statistics.filesProcessed,
            variablesExtracted: results.statistics.variablesFound,
            materialsExtracted: results.statistics.materialsFound,
            processingTime: results.statistics.processingTime,
            errors: results.errors.length,
            successRate: results.errors.length === 0 ? 100 : 
                        Math.round((results.statistics.filesProcessed / 
                                 (results.statistics.filesProcessed + results.errors.length)) * 100)
        };
    }
}

// Make PamirParser globally accessible
window.PamirParser = PamirParser;
