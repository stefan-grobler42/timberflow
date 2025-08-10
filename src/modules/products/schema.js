// Products Schema and Validation Module
class ProductsSchema {
  constructor() {
    this.fields = {
      id: {
        type: 'number',
        required: false,
        readonly: true,
        label: 'Product ID'
      },
      name: {
        type: 'string',
        required: true,
        maxLength: 255,
        label: 'Product Name',
        validation: {
          pattern: /^[a-zA-Z0-9\s\-_()]+$/,
          message: 'Product name can only contain letters, numbers, spaces, hyphens, underscores, and parentheses'
        }
      },
      sku: {
        type: 'string',
        required: false,
        maxLength: 50,
        label: 'SKU (Stock Keeping Unit)',
        validation: {
          pattern: /^[A-Z0-9\-]+$/,
          message: 'SKU should contain only uppercase letters, numbers, and hyphens'
        }
      },
      price: {
        type: 'number',
        required: true,
        min: 0,
        step: 0.01,
        label: 'Price (ZAR)',
        validation: {
          custom: (value) => {
            if (value < 0) return 'Price cannot be negative';
            if (value > 999999.99) return 'Price cannot exceed R999,999.99';
            return null;
          }
        }
      },
      description: {
        type: 'text',
        required: false,
        maxLength: 1000,
        label: 'Description'
      },
      category: {
        type: 'string',
        required: false,
        maxLength: 100,
        label: 'Category',
        options: [
          'Roofing Materials',
          'Guttering',
          'Insulation',
          'Hardware',
          'Tools',
          'Safety Equipment',
          'Fasteners',
          'Sealants'
        ]
      },
      unitOfMeasure: {
        type: 'select',
        required: true,
        label: 'Unit of Measure',
        default: 'Each',
        options: [
          { value: 'Each', label: 'Each' },
          { value: 'Metre', label: 'Metre' },
          { value: 'Square Metre', label: 'Square Metre' },
          { value: 'Cubic Metre', label: 'Cubic Metre' },
          { value: 'Kilogram', label: 'Kilogram' },
          { value: 'Litre', label: 'Litre' },
          { value: 'Kit', label: 'Kit' },
          { value: 'Roll', label: 'Roll' },
          { value: 'Sheet', label: 'Sheet' }
        ]
      },
      active: {
        type: 'boolean',
        required: false,
        default: true,
        label: 'Active Product'
      },
      createdDate: {
        type: 'datetime',
        required: false,
        readonly: true,
        label: 'Created Date'
      },
      modifiedDate: {
        type: 'datetime',
        required: false,
        readonly: true,
        label: 'Modified Date'
      }
    };
    
    this.businessRules = {
      uniqueSku: true,
      requireSkuForActiveProducts: false,
      minimumPrice: 0.01,
      maximumPrice: 999999.99
    };
  }
  
  // Validate a single field
  validateField(fieldName, value, allData = {}) {
    const field = this.fields[fieldName];
    if (!field) {
      return { valid: false, error: `Unknown field: ${fieldName}` };
    }
    
    const errors = [];
    
    // Required validation
    if (field.required && (value === null || value === undefined || value === '')) {
      errors.push(`${field.label} is required`);
    }
    
    // Skip other validations if field is empty and not required
    if (!field.required && (value === null || value === undefined || value === '')) {
      return { valid: true, error: null };
    }
    
    // Type-specific validation
    switch (field.type) {
      case 'string':
      case 'text':
        if (typeof value !== 'string') {
          errors.push(`${field.label} must be a text value`);
        } else {
          if (field.maxLength && value.length > field.maxLength) {
            errors.push(`${field.label} cannot exceed ${field.maxLength} characters`);
          }
          if (field.validation && field.validation.pattern) {
            if (!field.validation.pattern.test(value)) {
              errors.push(field.validation.message || `${field.label} format is invalid`);
            }
          }
        }
        break;
        
      case 'number':
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          errors.push(`${field.label} must be a valid number`);
        } else {
          if (field.min !== undefined && numValue < field.min) {
            errors.push(`${field.label} cannot be less than ${field.min}`);
          }
          if (field.max !== undefined && numValue > field.max) {
            errors.push(`${field.label} cannot be greater than ${field.max}`);
          }
        }
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${field.label} must be true or false`);
        }
        break;
        
      case 'select':
        if (field.options) {
          const validValues = field.options.map(opt => 
            typeof opt === 'string' ? opt : opt.value
          );
          if (!validValues.includes(value)) {
            errors.push(`${field.label} must be one of: ${validValues.join(', ')}`);
          }
        }
        break;
    }
    
    // Custom validation
    if (field.validation && field.validation.custom) {
      const customError = field.validation.custom(value, allData);
      if (customError) {
        errors.push(customError);
      }
    }
    
    return {
      valid: errors.length === 0,
      error: errors.length > 0 ? errors[0] : null,
      errors: errors
    };
  }
  
  // Validate entire product object
  validate(productData) {
    const errors = {};
    let isValid = true;
    
    // Validate all fields
    Object.keys(this.fields).forEach(fieldName => {
      const value = productData[fieldName];
      const result = this.validateField(fieldName, value, productData);
      
      if (!result.valid) {
        errors[fieldName] = result.error;
        isValid = false;
      }
    });
    
    // Business rules validation
    if (this.businessRules.uniqueSku && productData.sku) {
      // Note: This would need to check against existing products in a real implementation
      // For now, we'll simulate this check
    }
    
    if (this.businessRules.requireSkuForActiveProducts && productData.active && !productData.sku) {
      errors.sku = 'SKU is required for active products';
      isValid = false;
    }
    
    return {
      valid: isValid,
      errors: errors,
      errorCount: Object.keys(errors).length
    };
  }
  
  // Get field definition
  getField(fieldName) {
    return this.fields[fieldName] || null;
  }
  
  // Get all field definitions
  getAllFields() {
    return { ...this.fields };
  }
  
  // Get required fields
  getRequiredFields() {
    return Object.keys(this.fields).filter(fieldName => this.fields[fieldName].required);
  }
  
  // Get field options (for select fields)
  getFieldOptions(fieldName) {
    const field = this.fields[fieldName];
    if (field && field.options) {
      return field.options;
    }
    return [];
  }
  
  // Create empty product with defaults
  createEmpty() {
    const empty = {};
    
    Object.keys(this.fields).forEach(fieldName => {
      const field = this.fields[fieldName];
      if (field.default !== undefined) {
        empty[fieldName] = field.default;
      } else {
        switch (field.type) {
          case 'string':
          case 'text':
            empty[fieldName] = '';
            break;
          case 'number':
            empty[fieldName] = 0;
            break;
          case 'boolean':
            empty[fieldName] = false;
            break;
          case 'datetime':
            empty[fieldName] = new Date().toISOString();
            break;
          default:
            empty[fieldName] = null;
        }
      }
    });
    
    return empty;
  }
  
  // Sanitize product data (remove invalid fields, apply transformations)
  sanitize(productData) {
    const sanitized = {};
    
    Object.keys(productData).forEach(fieldName => {
      if (this.fields[fieldName]) {
        let value = productData[fieldName];
        const field = this.fields[fieldName];
        
        // Type conversions
        switch (field.type) {
          case 'number':
            value = parseFloat(value) || 0;
            break;
          case 'boolean':
            value = Boolean(value);
            break;
          case 'string':
          case 'text':
            value = String(value || '').trim();
            // Apply max length
            if (field.maxLength && value.length > field.maxLength) {
              value = value.substring(0, field.maxLength);
            }
            break;
        }
        
        sanitized[fieldName] = value;
      }
    });
    
    return sanitized;
  }
}

// Create global instance
window.ProductsSchema = new ProductsSchema();

console.log('ProductsSchema: Module loaded');