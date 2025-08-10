// Customers Module - Data Schema
// Based on the existing customer-manager.js data structure

export const customerSchema = {
  id: {
    type: 'number',
    primary: true,
    autoIncrement: true
  },
  accountNo: {
    type: 'string',
    required: true,
    maxLength: 20,
    unique: true
  },
  accountName: {
    type: 'string',
    required: true,
    maxLength: 255
  },
  companyType: {
    type: 'string',
    required: true,
    enum: ['Sole Proprietor', 'Private Company', 'Public Company', 'Close Corporation', 'Partnership', 'Trust', 'Individual']
  },
  companyRegistrationNo: {
    type: 'string',
    maxLength: 50
  },
  vatRegistrationNo: {
    type: 'string',
    maxLength: 20
  },
  phone: {
    type: 'string',
    maxLength: 20
  },
  email: {
    type: 'string',
    format: 'email',
    maxLength: 255
  },
  website: {
    type: 'string',
    format: 'url',
    maxLength: 255
  },
  parentAccount: {
    type: 'number',
    nullable: true,
    references: 'customers.id'
  },
  accountType: {
    type: 'string',
    required: true,
    enum: ['Prospect', 'Customer', 'Supplier', 'Partner', 'Competitor']
  },
  customerStatus: {
    type: 'string',
    enum: ['Prospect', 'Confirmed Customer', 'Account Under Review', 'Credit Approved', 'Account Closed']
  },
  approvalStatus: {
    type: 'string',
    enum: ['Pending', 'Credit App Required', 'References Check', 'Payment History Review', 'Approved', 'Rejected']
  },
  salesRepresentative: {
    type: 'string',
    maxLength: 100
  },
  relationshipType: {
    type: 'string',
    enum: ['Customer', 'Subsidiary', 'Parent Company', 'Joint Venture', 'Supplier', 'Partner']
  },
  primaryContact: {
    type: 'string',
    maxLength: 100
  },
  address: {
    type: 'text'
  },
  quotesRequested: {
    type: 'number',
    default: 0
  },
  totalQuoteValue: {
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0
  },
  ordersPlaced: {
    type: 'number',
    default: 0
  },
  isActive: {
    type: 'boolean',
    default: true
  },
  dateCreated: {
    type: 'datetime',
    default: 'now'
  },
  dateUpdated: {
    type: 'datetime',
    default: 'now',
    onUpdate: 'now'
  }
};

// Validation rules
export const customerValidation = {
  required: ['accountNo', 'accountName', 'companyType', 'accountType'],
  unique: ['accountNo', 'email'],
  formats: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[\d\s\-\(\)]+$/,
    website: /^https?:\/\/.+/
  }
};

// Business rules
export const customerBusinessRules = {
  // Account number generation pattern
  accountNoPattern: {
    prospect: 'PROS###',
    customer: 'CUST###',
    supplier: 'SUPP###',
    partner: 'PART###',
    competitor: 'COMP###'
  },
  
  // Status transitions
  allowedStatusTransitions: {
    'Prospect': ['Confirmed Customer', 'Account Under Review', 'Account Closed'],
    'Confirmed Customer': ['Credit Approved', 'Account Under Review', 'Account Closed'],
    'Account Under Review': ['Confirmed Customer', 'Credit Approved', 'Account Closed'],
    'Credit Approved': ['Account Closed'],
    'Account Closed': [] // Terminal state
  },
  
  // Approval workflow
  approvalWorkflow: {
    'Pending': 'Credit App Required',
    'Credit App Required': 'References Check',
    'References Check': 'Payment History Review',
    'Payment History Review': 'Approved',
    'Approved': null, // Terminal state
    'Rejected': null // Terminal state
  }
};

export default customerSchema;