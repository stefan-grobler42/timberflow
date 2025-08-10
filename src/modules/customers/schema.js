// Customers Module - Data Schema
export const customerSchema = {
  id: {
    type: 'number',
    primary: true,
    autoIncrement: true
  },
  name: {
    type: 'string',
    required: true,
    maxLength: 255
  },
  email: {
    type: 'string',
    format: 'email'
  },
  phone: {
    type: 'string'
  },
  address: {
    type: 'object',
    properties: {
      street: { type: 'string' },
      city: { type: 'string' },
      country: { type: 'string' },
      postalCode: { type: 'string' }
    }
  },
  status: {
    type: 'string',
    enum: ['active', 'inactive', 'pending']
  },
  createdAt: {
    type: 'datetime',
    default: 'now'
  },
  updatedAt: {
    type: 'datetime',
    default: 'now'
  }
};

export default customerSchema;