// File Parser Utility for Various File Formats
class FileParser {
    constructor() {
        this.supportedTypes = {
            excel: ['.xlsx', '.xls'],
            json: ['.json'],
            csv: ['.csv'],
            text: ['.txt']
        };
        
        this.maxFileSize = 50 * 1024 * 1024; // 50MB limit
        this.encoding = 'UTF-8';
    }

    /**
     * Parse file based on its type
     * @param {File} file - File to parse
     * @param {Object} options - Parsing options
     * @returns {Promise<Object>} Parsed data
     */
    async parseFile(file, options = {}) {
        try {
            // Validate file
            this.validateFile(file);
            
            const extension = this.getFileExtension(file.name);
            const parser = this.getParserForExtension(extension);
            
            if (!parser) {
                throw new Error(`Unsupported file type: ${extension}`);
            }

            return await parser(file, options);
        } catch (error) {
            throw new Error(`File parsing failed: ${error.message}`);
        }
    }

    /**
     * Parse multiple files
     * @param {FileList|Array} files - Files to parse
     * @param {Object} options - Parsing options
     * @returns {Promise<Array>} Array of parsed data
     */
    async parseMultipleFiles(files, options = {}) {
        const results = [];
        const errors = [];
        
        for (const file of files) {
            try {
                const data = await this.parseFile(file, options);
                results.push({
                    filename: file.name,
                    data: data,
                    size: file.size,
                    success: true
                });
            } catch (error) {
                errors.push({
                    filename: file.name,
                    error: error.message,
                    success: false
                });
            }
        }

        return {
            results,
            errors,
            totalFiles: files.length,
            successCount: results.length,
            errorCount: errors.length
        };
    }

    /**
     * Parse JSON file
     * @param {File} file - JSON file
     * @param {Object} options - Parsing options
     * @returns {Promise<Object>} Parsed JSON data
     */
    async parseJsonFile(file, options = {}) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const text = event.target.result;
                    const data = JSON.parse(text);
                    
                    resolve({
                        type: 'json',
                        data: data,
                        metadata: {
                            filename: file.name,
                            size: file.size,
                            lastModified: new Date(file.lastModified),
                            keys: this.getObjectKeys(data),
                            structure: this.analyzeJsonStructure(data)
                        }
                    });
                } catch (error) {
                    reject(new Error(`JSON parsing error: ${error.message}`));
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read JSON file'));
            reader.readAsText(file, this.encoding);
        });
    }

    /**
     * Parse CSV file
     * @param {File} file - CSV file
     * @param {Object} options - Parsing options
     * @returns {Promise<Object>} Parsed CSV data
     */
    async parseCsvFile(file, options = {}) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const text = event.target.result;
                    const parsedData = this.parseCsvText(text, options);
                    
                    resolve({
                        type: 'csv',
                        data: parsedData.data,
                        headers: parsedData.headers,
                        metadata: {
                            filename: file.name,
                            size: file.size,
                            lastModified: new Date(file.lastModified),
                            rowCount: parsedData.data.length,
                            columnCount: parsedData.headers.length,
                            delimiter: parsedData.delimiter
                        }
                    });
                } catch (error) {
                    reject(new Error(`CSV parsing error: ${error.message}`));
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read CSV file'));
            reader.readAsText(file, this.encoding);
        });
    }

    /**
     * Parse text file
     * @param {File} file - Text file
     * @param {Object} options - Parsing options
     * @returns {Promise<Object>} Parsed text data
     */
    async parseTextFile(file, options = {}) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const text = event.target.result;
                    const lines = text.split('\n').map(line => line.trim());
                    
                    resolve({
                        type: 'text',
                        data: {
                            content: text,
                            lines: lines,
                            nonEmptyLines: lines.filter(line => line.length > 0)
                        },
                        metadata: {
                            filename: file.name,
                            size: file.size,
                            lastModified: new Date(file.lastModified),
                            lineCount: lines.length,
                            characterCount: text.length,
                            wordCount: text.split(/\s+/).filter(word => word.length > 0).length
                        }
                    });
                } catch (error) {
                    reject(new Error(`Text parsing error: ${error.message}`));
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read text file'));
            reader.readAsText(file, this.encoding);
        });
    }

    /**
     * Parse Excel file (simplified - for complex Excel parsing, server-side processing is recommended)
     * @param {File} file - Excel file
     * @param {Object} options - Parsing options
     * @returns {Promise<Object>} Parsed Excel data
     */
    async parseExcelFile(file, options = {}) {
        // For now, try to parse as CSV if it's a simple Excel export
        // In a full implementation, you would use a library like SheetJS
        try {
            return await this.parseCsvFile(file, options);
        } catch (error) {
            throw new Error('Excel file parsing requires server-side processing. Please use the import functionality in the Stock Management section.');
        }
    }

    /**
     * Parse CSV text content
     * @param {string} text - CSV text content
     * @param {Object} options - Parsing options
     * @returns {Object} Parsed CSV data
     */
    parseCsvText(text, options = {}) {
        const {
            delimiter = null,
            hasHeaders = true,
            skipEmptyLines = true,
            trimWhitespace = true
        } = options;

        const lines = text.split('\n');
        if (lines.length === 0) {
            return { data: [], headers: [], delimiter: ',' };
        }

        // Auto-detect delimiter
        const detectedDelimiter = delimiter || this.detectCsvDelimiter(lines[0]);
        
        let headers = [];
        let dataStartIndex = 0;

        if (hasHeaders) {
            headers = this.parseCsvLine(lines[0], detectedDelimiter, trimWhitespace);
            dataStartIndex = 1;
        }

        const data = [];
        for (let i = dataStartIndex; i < lines.length; i++) {
            const line = lines[i];
            
            if (skipEmptyLines && !line.trim()) {
                continue;
            }

            const row = this.parseCsvLine(line, detectedDelimiter, trimWhitespace);
            
            if (hasHeaders) {
                const rowObject = {};
                headers.forEach((header, index) => {
                    rowObject[header] = row[index] || '';
                });
                data.push(rowObject);
            } else {
                data.push(row);
            }
        }

        return {
            data,
            headers,
            delimiter: detectedDelimiter
        };
    }

    /**
     * Parse a single CSV line
     * @param {string} line - CSV line
     * @param {string} delimiter - Field delimiter
     * @param {boolean} trimWhitespace - Whether to trim whitespace
     * @returns {Array} Parsed fields
     */
    parseCsvLine(line, delimiter = ',', trimWhitespace = true) {
        const fields = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = null;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (!inQuotes && (char === '"' || char === "'")) {
                inQuotes = true;
                quoteChar = char;
            } else if (inQuotes && char === quoteChar) {
                if (nextChar === quoteChar) {
                    // Escaped quote
                    current += char;
                    i++; // Skip next character
                } else {
                    inQuotes = false;
                    quoteChar = null;
                }
            } else if (!inQuotes && char === delimiter) {
                fields.push(trimWhitespace ? current.trim() : current);
                current = '';
            } else {
                current += char;
            }
        }

        fields.push(trimWhitespace ? current.trim() : current);
        return fields;
    }

    /**
     * Detect CSV delimiter
     * @param {string} line - First line of CSV
     * @returns {string} Detected delimiter
     */
    detectCsvDelimiter(line) {
        const delimiters = [',', ';', '\t', '|'];
        const counts = {};

        delimiters.forEach(delimiter => {
            counts[delimiter] = (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
        });

        // Return delimiter with highest count
        return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];
    }

    /**
     * Analyze JSON structure
     * @param {Object} data - JSON data
     * @returns {Object} Structure analysis
     */
    analyzeJsonStructure(data) {
        const analysis = {
            type: typeof data,
            isArray: Array.isArray(data),
            hasNestedObjects: false,
            hasNestedArrays: false,
            depth: 0
        };

        if (typeof data === 'object' && data !== null) {
            analysis.depth = this.getObjectDepth(data);
            analysis.hasNestedObjects = this.hasNestedObjects(data);
            analysis.hasNestedArrays = this.hasNestedArrays(data);
        }

        return analysis;
    }

    /**
     * Get all keys from nested object
     * @param {Object} obj - Object to analyze
     * @param {string} prefix - Key prefix
     * @returns {Array} All keys
     */
    getObjectKeys(obj, prefix = '') {
        const keys = [];

        if (typeof obj === 'object' && obj !== null) {
            Object.keys(obj).forEach(key => {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                keys.push(fullKey);

                if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key] !== null) {
                    keys.push(...this.getObjectKeys(obj[key], fullKey));
                }
            });
        }

        return keys;
    }

    /**
     * Get object depth
     * @param {Object} obj - Object to analyze
     * @returns {number} Maximum depth
     */
    getObjectDepth(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return 0;
        }

        let maxDepth = 0;
        Object.values(obj).forEach(value => {
            if (typeof value === 'object' && value !== null) {
                maxDepth = Math.max(maxDepth, this.getObjectDepth(value));
            }
        });

        return maxDepth + 1;
    }

    /**
     * Check if object has nested objects
     * @param {Object} obj - Object to check
     * @returns {boolean} True if has nested objects
     */
    hasNestedObjects(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }

        return Object.values(obj).some(value => 
            typeof value === 'object' && value !== null && !Array.isArray(value)
        );
    }

    /**
     * Check if object has nested arrays
     * @param {Object} obj - Object to check
     * @returns {boolean} True if has nested arrays
     */
    hasNestedArrays(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }

        return Object.values(obj).some(value => Array.isArray(value));
    }

    /**
     * Validate file before parsing
     * @param {File} file - File to validate
     */
    validateFile(file) {
        if (!file) {
            throw new Error('No file provided');
        }

        if (file.size === 0) {
            throw new Error('File is empty');
        }

        if (file.size > this.maxFileSize) {
            throw new Error(`File too large. Maximum size: ${this.formatFileSize(this.maxFileSize)}`);
        }

        const extension = this.getFileExtension(file.name);
        if (!this.isSupportedExtension(extension)) {
            throw new Error(`Unsupported file type: ${extension}`);
        }
    }

    /**
     * Get file extension
     * @param {string} filename - File name
     * @returns {string} File extension
     */
    getFileExtension(filename) {
        return filename.toLowerCase().substring(filename.lastIndexOf('.'));
    }

    /**
     * Check if extension is supported
     * @param {string} extension - File extension
     * @returns {boolean} True if supported
     */
    isSupportedExtension(extension) {
        return Object.values(this.supportedTypes).some(types => types.includes(extension));
    }

    /**
     * Get parser function for extension
     * @param {string} extension - File extension
     * @returns {Function} Parser function
     */
    getParserForExtension(extension) {
        const parsers = {
            '.json': this.parseJsonFile.bind(this),
            '.csv': this.parseCsvFile.bind(this),
            '.txt': this.parseTextFile.bind(this),
            '.xlsx': this.parseExcelFile.bind(this),
            '.xls': this.parseExcelFile.bind(this)
        };

        return parsers[extension];
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    /**
     * Extract data statistics
     * @param {Object} parsedData - Parsed data
     * @returns {Object} Data statistics
     */
    getDataStatistics(parsedData) {
        const stats = {
            type: parsedData.type,
            filename: parsedData.metadata?.filename,
            size: parsedData.metadata?.size,
            lastModified: parsedData.metadata?.lastModified
        };

        switch (parsedData.type) {
            case 'json':
                stats.keys = parsedData.metadata.keys?.length || 0;
                stats.structure = parsedData.metadata.structure;
                break;
            case 'csv':
                stats.rows = parsedData.metadata.rowCount;
                stats.columns = parsedData.metadata.columnCount;
                stats.delimiter = parsedData.metadata.delimiter;
                break;
            case 'text':
                stats.lines = parsedData.metadata.lineCount;
                stats.characters = parsedData.metadata.characterCount;
                stats.words = parsedData.metadata.wordCount;
                break;
        }

        return stats;
    }

    /**
     * Convert parsed data to different formats
     * @param {Object} parsedData - Parsed data
     * @param {string} targetFormat - Target format
     * @returns {Object} Converted data
     */
    convertFormat(parsedData, targetFormat) {
        switch (targetFormat) {
            case 'json':
                return this.convertToJson(parsedData);
            case 'csv':
                return this.convertToCsv(parsedData);
            case 'array':
                return this.convertToArray(parsedData);
            default:
                throw new Error(`Unsupported target format: ${targetFormat}`);
        }
    }

    /**
     * Convert data to JSON format
     * @param {Object} parsedData - Parsed data
     * @returns {Object} JSON data
     */
    convertToJson(parsedData) {
        if (parsedData.type === 'json') {
            return parsedData.data;
        }

        if (parsedData.type === 'csv') {
            return parsedData.data;
        }

        throw new Error(`Cannot convert ${parsedData.type} to JSON`);
    }

    /**
     * Convert data to CSV format
     * @param {Object} parsedData - Parsed data
     * @returns {string} CSV string
     */
    convertToCsv(parsedData) {
        if (parsedData.type === 'csv') {
            return this.arrayToCsv(parsedData.data, parsedData.headers);
        }

        if (parsedData.type === 'json' && Array.isArray(parsedData.data)) {
            return this.arrayToCsv(parsedData.data);
        }

        throw new Error(`Cannot convert ${parsedData.type} to CSV`);
    }

    /**
     * Convert array to CSV string
     * @param {Array} data - Array data
     * @param {Array} headers - Column headers
     * @returns {string} CSV string
     */
    arrayToCsv(data, headers = null) {
        if (!Array.isArray(data) || data.length === 0) {
            return '';
        }

        const csvHeaders = headers || Object.keys(data[0]);
        const csvLines = [csvHeaders.join(',')];

        data.forEach(row => {
            const values = csvHeaders.map(header => {
                const value = row[header] || '';
                // Escape values containing commas or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvLines.push(values.join(','));
        });

        return csvLines.join('\n');
    }

    /**
     * Convert data to array format
     * @param {Object} parsedData - Parsed data
     * @returns {Array} Array data
     */
    convertToArray(parsedData) {
        if (parsedData.type === 'csv') {
            return parsedData.data;
        }

        if (parsedData.type === 'json') {
            if (Array.isArray(parsedData.data)) {
                return parsedData.data;
            } else {
                return [parsedData.data];
            }
        }

        throw new Error(`Cannot convert ${parsedData.type} to array`);
    }
}

// Make FileParser globally accessible
window.FileParser = FileParser;
