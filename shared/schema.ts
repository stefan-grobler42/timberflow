/**
 * Database Schema for Timberflow ERP
 * Charter-compliant schema definition with all module tables
 */

import { pgTable, serial, varchar, text, timestamp, boolean, integer, decimal, uuid, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==== CORE BUSINESS MODULES ====

// Customers Table (already exists)
export const customers = pgTable('customers', {
    id: serial('id').primaryKey(),
    customerCode: varchar('customer_code', { length: 50 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    companyName: varchar('company_name', { length: 255 }),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    address: text('address'),
    city: varchar('city', { length: 100 }),
    province: varchar('province', { length: 100 }),
    postalCode: varchar('postal_code', { length: 20 }),
    country: varchar('country', { length: 100 }).default('South Africa'),
    customerTypeId: integer('customer_type_id'),
    status: varchar('status', { length: 50 }).default('active'),
    gpsCoordinates: varchar('gps_coordinates', { length: 100 }),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: varchar('created_by', { length: 255 }),
    updatedBy: varchar('updated_by', { length: 255 })
});

// Contacts Table
export const contacts = pgTable('contacts', {
    id: serial('id').primaryKey(),
    customerId: integer('customer_id').references(() => customers.id),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    title: varchar('title', { length: 50 }),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    mobile: varchar('mobile', { length: 50 }),
    department: varchar('department', { length: 100 }),
    position: varchar('position', { length: 100 }),
    isPrimary: boolean('is_primary').default(false),
    isActive: boolean('is_active').default(true),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// Employees Table
export const employees = pgTable('employees', {
    id: serial('id').primaryKey(),
    employeeCode: varchar('employee_code', { length: 50 }).notNull().unique(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).unique(),
    phone: varchar('phone', { length: 50 }),
    department: varchar('department', { length: 100 }),
    position: varchar('position', { length: 100 }),
    role: varchar('role', { length: 50 }).default('user'),
    isActive: boolean('is_active').default(true),
    hireDate: timestamp('hire_date'),
    salary: decimal('salary', { precision: 12, scale: 2 }),
    address: text('address'),
    emergencyContact: varchar('emergency_contact', { length: 255 }),
    emergencyPhone: varchar('emergency_phone', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// Projects Table
export const projects = pgTable('projects', {
    id: serial('id').primaryKey(),
    projectCode: varchar('project_code', { length: 50 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    customerId: integer('customer_id').references(() => customers.id),
    projectManagerId: integer('project_manager_id').references(() => employees.id),
    status: varchar('status', { length: 50 }).default('planning'),
    priority: varchar('priority', { length: 20 }).default('medium'),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    estimatedValue: decimal('estimated_value', { precision: 15, scale: 2 }),
    actualValue: decimal('actual_value', { precision: 15, scale: 2 }),
    address: text('address'),
    gpsCoordinates: varchar('gps_coordinates', { length: 100 }),
    pamirData: jsonb('pamir_data'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// Quotes Table
export const quotes = pgTable('quotes', {
    id: serial('id').primaryKey(),
    quoteNumber: varchar('quote_number', { length: 50 }).notNull().unique(),
    customerId: integer('customer_id').references(() => customers.id),
    projectId: integer('project_id').references(() => projects.id),
    status: varchar('status', { length: 50 }).default('draft'),
    validUntil: timestamp('valid_until'),
    subtotal: decimal('subtotal', { precision: 15, scale: 2 }),
    taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }),
    totalAmount: decimal('total_amount', { precision: 15, scale: 2 }),
    terms: text('terms'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: integer('created_by').references(() => employees.id)
});

// Tenders Table
export const tenders = pgTable('tenders', {
    id: serial('id').primaryKey(),
    tenderNumber: varchar('tender_number', { length: 50 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    customerId: integer('customer_id').references(() => customers.id),
    submissionDate: timestamp('submission_date'),
    closingDate: timestamp('closing_date'),
    status: varchar('status', { length: 50 }).default('open'),
    estimatedValue: decimal('estimated_value', { precision: 15, scale: 2 }),
    actualBid: decimal('actual_bid', { precision: 15, scale: 2 }),
    result: varchar('result', { length: 50 }),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// Orders Table
export const orders = pgTable('orders', {
    id: serial('id').primaryKey(),
    orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
    orderType: varchar('order_type', { length: 20 }).notNull(), // 'purchase' or 'sales'
    customerId: integer('customer_id').references(() => customers.id),
    supplierId: integer('supplier_id'),
    projectId: integer('project_id').references(() => projects.id),
    status: varchar('status', { length: 50 }).default('pending'),
    orderDate: timestamp('order_date').defaultNow(),
    requiredDate: timestamp('required_date'),
    deliveryDate: timestamp('delivery_date'),
    subtotal: decimal('subtotal', { precision: 15, scale: 2 }),
    taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }),
    totalAmount: decimal('total_amount', { precision: 15, scale: 2 }),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: integer('created_by').references(() => employees.id)
});

// Stock Items Table
export const stockItems = pgTable('stock_items', {
    id: serial('id').primaryKey(),
    itemCode: varchar('item_code', { length: 50 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    categoryId: integer('category_id'),
    itemTypeId: integer('item_type_id'),
    unitOfMeasureId: integer('unit_of_measure_id'),
    unitCost: decimal('unit_cost', { precision: 12, scale: 4 }),
    sellingPrice: decimal('selling_price', { precision: 12, scale: 4 }),
    quantityOnHand: decimal('quantity_on_hand', { precision: 12, scale: 4 }).default('0'),
    reorderLevel: decimal('reorder_level', { precision: 12, scale: 4 }),
    maximumLevel: decimal('maximum_level', { precision: 12, scale: 4 }),
    barcode: varchar('barcode', { length: 50 }),
    isActive: boolean('is_active').default(true),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// Tasks Table
export const tasks = pgTable('tasks', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    projectId: integer('project_id').references(() => projects.id),
    assignedToId: integer('assigned_to_id').references(() => employees.id),
    createdById: integer('created_by_id').references(() => employees.id),
    status: varchar('status', { length: 50 }).default('pending'),
    priority: varchar('priority', { length: 20 }).default('medium'),
    dueDate: timestamp('due_date'),
    completedAt: timestamp('completed_at'),
    estimatedHours: decimal('estimated_hours', { precision: 8, scale: 2 }),
    actualHours: decimal('actual_hours', { precision: 8, scale: 2 }),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// Phone Calls Table
export const phoneCalls = pgTable('phone_calls', {
    id: serial('id').primaryKey(),
    customerId: integer('customer_id').references(() => customers.id),
    contactId: integer('contact_id').references(() => contacts.id),
    employeeId: integer('employee_id').references(() => employees.id),
    projectId: integer('project_id').references(() => projects.id),
    callType: varchar('call_type', { length: 20 }).default('outbound'), // inbound/outbound
    phoneNumber: varchar('phone_number', { length: 50 }),
    duration: integer('duration'), // in minutes
    subject: varchar('subject', { length: 255 }),
    notes: text('notes'),
    followUpRequired: boolean('follow_up_required').default(false),
    followUpDate: timestamp('follow_up_date'),
    callDate: timestamp('call_date').defaultNow(),
    createdAt: timestamp('created_at').defaultNow()
});

// Emails Table
export const emails = pgTable('emails', {
    id: serial('id').primaryKey(),
    customerId: integer('customer_id').references(() => customers.id),
    contactId: integer('contact_id').references(() => contacts.id),
    employeeId: integer('employee_id').references(() => employees.id),
    projectId: integer('project_id').references(() => projects.id),
    emailType: varchar('email_type', { length: 20 }).default('outbound'), // inbound/outbound
    toEmail: varchar('to_email', { length: 255 }),
    fromEmail: varchar('from_email', { length: 255 }),
    ccEmails: text('cc_emails'),
    bccEmails: text('bcc_emails'),
    subject: varchar('subject', { length: 255 }),
    body: text('body'),
    isHtml: boolean('is_html').default(false),
    status: varchar('status', { length: 20 }).default('sent'),
    sentAt: timestamp('sent_at'),
    createdAt: timestamp('created_at').defaultNow()
});

// Meetings Table
export const meetings = pgTable('meetings', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    customerId: integer('customer_id').references(() => customers.id),
    projectId: integer('project_id').references(() => projects.id),
    organizerId: integer('organizer_id').references(() => employees.id),
    meetingType: varchar('meeting_type', { length: 50 }).default('in-person'),
    location: varchar('location', { length: 255 }),
    meetingUrl: varchar('meeting_url', { length: 500 }),
    startTime: timestamp('start_time'),
    endTime: timestamp('end_time'),
    status: varchar('status', { length: 50 }).default('scheduled'),
    notes: text('notes'),
    agenda: text('agenda'),
    minutes: text('minutes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// ==== SETTINGS/CONFIGURATION MODULES ====

// Units of Measure Table
export const unitsOfMeasure = pgTable('units_of_measure', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 10 }).notNull().unique(),
    name: varchar('name', { length: 100 }).notNull(),
    symbol: varchar('symbol', { length: 10 }),
    description: text('description'),
    baseUnit: varchar('base_unit', { length: 10 }),
    conversionFactor: decimal('conversion_factor', { precision: 12, scale: 6 }),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// Item Types Table
export const itemTypes = pgTable('item_types', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 20 }).notNull().unique(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    parentId: integer('parent_id'),
    isActive: boolean('is_active').default(true),
    sortOrder: integer('sort_order'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// Categories Table
export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 20 }).notNull().unique(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    parentId: integer('parent_id'),
    isActive: boolean('is_active').default(true),
    sortOrder: integer('sort_order'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// Company Types Table
export const companyTypes = pgTable('company_types', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 20 }).notNull().unique(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').default(true),
    sortOrder: integer('sort_order'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// Account Types Table
export const accountTypes = pgTable('account_types', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 20 }).notNull().unique(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    permissions: jsonb('permissions'),
    isActive: boolean('is_active').default(true),
    sortOrder: integer('sort_order'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// Account Relationships Table
export const accountRelationships = pgTable('account_relationships', {
    id: serial('id').primaryKey(),
    parentAccountId: integer('parent_account_id').references(() => customers.id),
    childAccountId: integer('child_account_id').references(() => customers.id),
    relationshipType: varchar('relationship_type', { length: 50 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// ==== RELATIONS ====

export const customersRelations = relations(customers, ({ many, one }) => ({
    contacts: many(contacts),
    projects: many(projects),
    quotes: many(quotes),
    orders: many(orders),
    phoneCalls: many(phoneCalls),
    emails: many(emails),
    meetings: many(meetings)
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
    customer: one(customers, {
        fields: [contacts.customerId],
        references: [customers.id]
    })
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
    customer: one(customers, {
        fields: [projects.customerId],
        references: [customers.id]
    }),
    projectManager: one(employees, {
        fields: [projects.projectManagerId],
        references: [employees.id]
    }),
    quotes: many(quotes),
    tasks: many(tasks)
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
    customer: one(customers, {
        fields: [quotes.customerId],
        references: [customers.id]
    }),
    project: one(projects, {
        fields: [quotes.projectId],
        references: [projects.id]
    }),
    createdBy: one(employees, {
        fields: [quotes.createdBy],
        references: [employees.id]
    })
}));