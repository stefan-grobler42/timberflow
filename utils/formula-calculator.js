// Formula Calculator Utility for Stock Quantity Calculations
class FormulaCalculator {
    constructor() {
        this.functions = {
            // Math functions
            'ROUND': (value, decimals = 0) => Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals),
            'CEIL': (value) => Math.ceil(value),
            'FLOOR': (value) => Math.floor(value),
            'ABS': (value) => Math.abs(value),
            'MAX': (...values) => Math.max(...values),
            'MIN': (...values) => Math.min(...values),
            'SQRT': (value) => Math.sqrt(value),
            'POW': (base, exponent) => Math.pow(base, exponent),
            
            // Timber-specific calculations
            'TRUSS_COUNT': (span, spacing) => Math.ceil(span / spacing) + 1,
            'LINEAR_METERS': (pieces, length) => pieces * length,
            'BOARD_FEET': (pieces, width, thickness, length) => pieces * width * thickness * length / 144,
            'CUBIC_METERS': (pieces, width, thickness, length) => pieces * (width/1000) * (thickness/1000) * (length/1000),
            
            // Conditional functions
            'IF': (condition, trueValue, falseValue) => condition ? trueValue : falseValue,
            'IFERROR': (value, errorValue) => {
                try {
                    return typeof value === 'function' ? value() : value;
                } catch {
                    return errorValue;
                }
            }
        };

        // Timber calculation constants
        this.constants = {
            'PI': Math.PI,
            'E': Math.E,
            'TIMBER_WASTAGE': 1.1, // 10% wastage factor
            'STANDARD_SPACING': 600, // Standard truss spacing in mm
            'SAFETY_FACTOR': 1.2
        };

        // Operators precedence
        this.operators = {
            '+': { precedence: 1, associativity: 'left' },
            '-': { precedence: 1, associativity: 'left' },
            '*': { precedence: 2, associativity: 'left' },
            '/': { precedence: 2, associativity: 'left' },
            '%': { precedence: 2, associativity: 'left' },
            '^': { precedence: 3, associativity: 'right' },
            '**': { precedence: 3, associativity: 'right' }
        };
    }

    /**
     * Evaluate a formula expression with given variables
     * @param {string} expression - Formula expression
     * @param {Object} variables - Variable values
     * @returns {number} Calculated result
     */
    evaluate(expression, variables = {}) {
        try {
            if (!expression || typeof expression !== 'string') {
                throw new Error('Invalid expression');
            }

            // Replace variables in the expression
            const processedExpression = this.replaceVariables(expression, variables);
            
            // Replace constants
            const withConstants = this.replaceConstants(processedExpression);
            
            // Parse and evaluate the expression
            const result = this.parseExpression(withConstants);
            
            // Validate result
            if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
                throw new Error('Formula evaluation resulted in invalid value');
            }

            return result;
        } catch (error) {
            throw new Error(`Formula evaluation failed: ${error.message}`);
        }
    }

    /**
     * Validate formula syntax without evaluating
     * @param {string} expression - Formula expression
     * @param {Object} variables - Available variables
     * @returns {Object} Validation result
     */
    validate(expression, variables = {}) {
        try {
            if (!expression || typeof expression !== 'string') {
                return { isValid: false, error: 'Expression is required' };
            }

            // Check for balanced parentheses
            if (!this.hasBalancedParentheses(expression)) {
                return { isValid: false, error: 'Unbalanced parentheses' };
            }

            // Check for undefined variables
            const undefinedVars = this.findUndefinedVariables(expression, variables);
            if (undefinedVars.length > 0) {
                return { 
                    isValid: false, 
                    error: `Undefined variables: ${undefinedVars.join(', ')}` 
                };
            }

            // Try to parse without evaluation
            const processedExpression = this.replaceVariables(expression, variables);
            const withConstants = this.replaceConstants(processedExpression);
            
            // Basic syntax validation
            if (!this.isValidSyntax(withConstants)) {
                return { isValid: false, error: 'Invalid formula syntax' };
            }

            return { isValid: true };
        } catch (error) {
            return { isValid: false, error: error.message };
        }
    }

    /**
     * Replace variables in expression with their values
     * @param {string} expression - Formula expression
     * @param {Object} variables - Variable values
     * @returns {string} Expression with replaced variables
     */
    replaceVariables(expression, variables) {
        let result = expression;
        
        // Replace variables wrapped in curly braces {variableName}
        result = result.replace(/\{([a-zA-Z_][a-zA-Z0-9_\.]*)\}/g, (match, varName) => {
            if (variables.hasOwnProperty(varName)) {
                const value = variables[varName];
                return typeof value === 'number' ? value.toString() : `"${value}"`;
            }
            throw new Error(`Undefined variable: ${varName}`);
        });

        // Replace variables without braces (legacy support)
        Object.entries(variables).forEach(([key, value]) => {
            if (typeof value === 'number') {
                // Use word boundaries to avoid partial replacements
                const regex = new RegExp(`\\b${key}\\b`, 'g');
                result = result.replace(regex, value.toString());
            }
        });

        return result;
    }

    /**
     * Replace constants in expression
     * @param {string} expression - Formula expression
     * @returns {string} Expression with replaced constants
     */
    replaceConstants(expression) {
        let result = expression;
        
        Object.entries(this.constants).forEach(([name, value]) => {
            const regex = new RegExp(`\\b${name}\\b`, 'g');
            result = result.replace(regex, value.toString());
        });

        return result;
    }

    /**
     * Parse and evaluate mathematical expression
     * @param {string} expression - Mathematical expression
     * @returns {number} Evaluation result
     */
    parseExpression(expression) {
        // Remove whitespace
        expression = expression.replace(/\s+/g, '');
        
        // Handle function calls first
        expression = this.processFunctions(expression);
        
        // Convert to postfix notation and evaluate
        const postfix = this.toPostfix(expression);
        return this.evaluatePostfix(postfix);
    }

    /**
     * Process function calls in expression
     * @param {string} expression - Expression with functions
     * @returns {string} Expression with evaluated functions
     */
    processFunctions(expression) {
        let result = expression;
        
        // Process functions from innermost to outermost
        while (true) {
            const functionMatch = result.match(/([A-Z_][A-Z0-9_]*)\(([^()]*)\)/);
            if (!functionMatch) break;
            
            const [fullMatch, funcName, argsStr] = functionMatch;
            
            if (!this.functions[funcName]) {
                throw new Error(`Unknown function: ${funcName}`);
            }

            // Parse arguments
            const args = argsStr ? this.parseArguments(argsStr) : [];
            
            // Evaluate function
            try {
                const funcResult = this.functions[funcName](...args);
                result = result.replace(fullMatch, funcResult.toString());
            } catch (error) {
                throw new Error(`Function ${funcName} error: ${error.message}`);
            }
        }
        
        return result;
    }

    /**
     * Parse function arguments
     * @param {string} argsStr - Arguments string
     * @returns {Array} Parsed arguments
     */
    parseArguments(argsStr) {
        const args = [];
        let current = '';
        let depth = 0;
        
        for (let i = 0; i < argsStr.length; i++) {
            const char = argsStr[i];
            
            if (char === ',' && depth === 0) {
                args.push(this.evaluateSimpleExpression(current.trim()));
                current = '';
            } else {
                if (char === '(') depth++;
                if (char === ')') depth--;
                current += char;
            }
        }
        
        if (current.trim()) {
            args.push(this.evaluateSimpleExpression(current.trim()));
        }
        
        return args;
    }

    /**
     * Evaluate simple mathematical expression (no functions)
     * @param {string} expression - Simple expression
     * @returns {number} Result
     */
    evaluateSimpleExpression(expression) {
        // Handle negative numbers
        expression = expression.replace(/^\-/, '0-');
        expression = expression.replace(/\(\-/g, '(0-');
        
        const postfix = this.toPostfix(expression);
        return this.evaluatePostfix(postfix);
    }

    /**
     * Convert infix expression to postfix notation
     * @param {string} expression - Infix expression
     * @returns {Array} Postfix tokens
     */
    toPostfix(expression) {
        const output = [];
        const operatorStack = [];
        const tokens = this.tokenize(expression);
        
        tokens.forEach(token => {
            if (this.isNumber(token)) {
                output.push(parseFloat(token));
            } else if (token === '(') {
                operatorStack.push(token);
            } else if (token === ')') {
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                    output.push(operatorStack.pop());
                }
                operatorStack.pop(); // Remove '('
            } else if (this.isOperator(token)) {
                while (
                    operatorStack.length > 0 &&
                    operatorStack[operatorStack.length - 1] !== '(' &&
                    this.hasHigherPrecedence(operatorStack[operatorStack.length - 1], token)
                ) {
                    output.push(operatorStack.pop());
                }
                operatorStack.push(token);
            }
        });
        
        while (operatorStack.length > 0) {
            output.push(operatorStack.pop());
        }
        
        return output;
    }

    /**
     * Evaluate postfix expression
     * @param {Array} postfix - Postfix tokens
     * @returns {number} Result
     */
    evaluatePostfix(postfix) {
        const stack = [];
        
        postfix.forEach(token => {
            if (typeof token === 'number') {
                stack.push(token);
            } else if (this.isOperator(token)) {
                if (stack.length < 2) {
                    throw new Error('Invalid expression: insufficient operands');
                }
                
                const b = stack.pop();
                const a = stack.pop();
                const result = this.applyOperator(a, b, token);
                stack.push(result);
            }
        });
        
        if (stack.length !== 1) {
            throw new Error('Invalid expression: malformed');
        }
        
        return stack[0];
    }

    /**
     * Tokenize expression into numbers, operators, and parentheses
     * @param {string} expression - Expression to tokenize
     * @returns {Array} Tokens
     */
    tokenize(expression) {
        const tokens = [];
        let current = '';
        
        for (let i = 0; i < expression.length; i++) {
            const char = expression[i];
            
            if (this.isDigit(char) || char === '.') {
                current += char;
            } else if (this.isOperatorChar(char)) {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                
                // Handle multi-character operators
                if (char === '*' && expression[i + 1] === '*') {
                    tokens.push('**');
                    i++; // Skip next character
                } else {
                    tokens.push(char);
                }
            } else if (char === '(' || char === ')') {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                tokens.push(char);
            }
        }
        
        if (current) {
            tokens.push(current);
        }
        
        return tokens;
    }

    /**
     * Apply operator to two operands
     * @param {number} a - First operand
     * @param {number} b - Second operand
     * @param {string} operator - Operator
     * @returns {number} Result
     */
    applyOperator(a, b, operator) {
        switch (operator) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': 
                if (b === 0) throw new Error('Division by zero');
                return a / b;
            case '%': return a % b;
            case '^':
            case '**': return Math.pow(a, b);
            default:
                throw new Error(`Unknown operator: ${operator}`);
        }
    }

    /**
     * Check if operator has higher precedence
     * @param {string} op1 - First operator
     * @param {string} op2 - Second operator
     * @returns {boolean} True if op1 has higher precedence
     */
    hasHigherPrecedence(op1, op2) {
        const prec1 = this.operators[op1]?.precedence || 0;
        const prec2 = this.operators[op2]?.precedence || 0;
        
        if (prec1 > prec2) return true;
        if (prec1 < prec2) return false;
        
        // Same precedence - check associativity
        return this.operators[op1]?.associativity === 'left';
    }

    /**
     * Utility methods
     */
    isNumber(token) {
        return !isNaN(parseFloat(token)) && isFinite(token);
    }

    isOperator(token) {
        return this.operators.hasOwnProperty(token);
    }

    isOperatorChar(char) {
        return '+-*/%^'.includes(char);
    }

    isDigit(char) {
        return /\d/.test(char);
    }

    hasBalancedParentheses(expression) {
        let count = 0;
        for (const char of expression) {
            if (char === '(') count++;
            if (char === ')') count--;
            if (count < 0) return false;
        }
        return count === 0;
    }

    findUndefinedVariables(expression, variables) {
        const variablePattern = /\{([a-zA-Z_][a-zA-Z0-9_\.]*)\}/g;
        const undefined = [];
        let match;
        
        while ((match = variablePattern.exec(expression)) !== null) {
            const varName = match[1];
            if (!variables.hasOwnProperty(varName)) {
                undefined.push(varName);
            }
        }
        
        return [...new Set(undefined)]; // Remove duplicates
    }

    isValidSyntax(expression) {
        // Basic syntax checks
        const forbidden = /[^0-9+\-*/%(). ]/;
        return !forbidden.test(expression.replace(/[A-Z_][A-Z0-9_]*\([^)]*\)/g, '1'));
    }

    /**
     * Get available functions for formula builder
     * @returns {Object} Available functions with descriptions
     */
    getAvailableFunctions() {
        return {
            'Math Functions': {
                'ROUND(value, decimals)': 'Round to specified decimal places',
                'CEIL(value)': 'Round up to nearest integer',
                'FLOOR(value)': 'Round down to nearest integer',
                'ABS(value)': 'Absolute value',
                'MAX(value1, value2, ...)': 'Maximum value',
                'MIN(value1, value2, ...)': 'Minimum value',
                'SQRT(value)': 'Square root',
                'POW(base, exponent)': 'Power calculation'
            },
            'Timber Calculations': {
                'TRUSS_COUNT(span, spacing)': 'Calculate number of trusses needed',
                'LINEAR_METERS(pieces, length)': 'Calculate total linear meters',
                'BOARD_FEET(pieces, width, thickness, length)': 'Calculate board feet',
                'CUBIC_METERS(pieces, width, thickness, length)': 'Calculate cubic meters'
            },
            'Conditional Functions': {
                'IF(condition, trueValue, falseValue)': 'Conditional calculation',
                'IFERROR(value, errorValue)': 'Return error value if calculation fails'
            }
        };
    }

    /**
     * Get available constants
     * @returns {Object} Available constants with descriptions
     */
    getAvailableConstants() {
        return {
            'PI': 'Mathematical constant π',
            'E': 'Mathematical constant e',
            'TIMBER_WASTAGE': 'Standard timber wastage factor (10%)',
            'STANDARD_SPACING': 'Standard truss spacing (600mm)',
            'SAFETY_FACTOR': 'Safety factor for calculations'
        };
    }
}

// Make FormulaCalculator globally accessible
window.FormulaCalculator = FormulaCalculator;
