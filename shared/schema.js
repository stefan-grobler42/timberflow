const { relations } = require('drizzle-orm');
const {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  decimal,
  timestamp,
  integer,
  uuid,
  jsonb
} = require('drizzle-orm/pg-core');

// Base UOM (Unit of Measure) Table
const baseUoms = pgTable('base_uoms', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  uomType: varchar('uom_type', { length: 20 }).notNull(), // length, area, volume, weight, count
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// UOM Conversions (relationships between UOMs)
const uomConversions = pgTable('uom_conversions', {
  id: serial('id').primaryKey(),
  fromUomId: integer('from_uom_id').references(() => baseUoms.id).notNull(),
  toUomId: integer('to_uom_id').references(() => baseUoms.id).notNull(),
  conversionFactor: decimal('conversion_factor', { precision: 15, scale: 6 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// Item Categories
const itemCategories = pgTable('item_categories', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  parentCategoryId: integer('parent_category_id').references(() => itemCategories.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Item Attributes (configurable attributes like color, size, etc.)
const itemAttributes = pgTable('item_attributes', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  attributeType: varchar('attribute_type', { length: 20 }).notNull(), // text, number, boolean, list
  defaultValue: text('default_value'),
  possibleValues: jsonb('possible_values'), // for list type attributes
  isRequired: boolean('is_required').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Variants (different versions of items)
const variants = pgTable('variants', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Margin Categories
const marginCategories = pgTable('margin_categories', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  defaultMarginPercent: decimal('default_margin_percent', { precision: 5, scale: 2 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Discount Categories
const discountCategories = pgTable('discount_categories', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  maxDiscountPercent: decimal('max_discount_percent', { precision: 5, scale: 2 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Main Stock Items Table
const stockItems = pgTable('stock_items', {
  id: serial('id').primaryKey(),
  itemCode: varchar('item_code', { length: 50 }).notNull().unique(),
  description: text('description').notNull(),
  status: varchar('status', { length: 20 }).default('active'), // active, inactive, discontinued
  itemType: varchar('item_type', { length: 20 }).notNull(), // stock, service, manufactured, composite, temporary
  baseUomId: integer('base_uom_id').references(() => baseUoms.id).notNull(),
  itemCategoryId: integer('item_category_id').references(() => itemCategories.id).notNull(),
  variantId: integer('variant_id').references(() => variants.id),
  marginCategoryId: integer('margin_category_id').references(() => marginCategories.id),
  discountCategoryId: integer('discount_category_id').references(() => discountCategories.id),
  
  // Unit specifications for different operations
  stockUomId: integer('stock_uom_id').references(() => baseUoms.id).notNull(), // How we store it
  salesUomId: integer('sales_uom_id').references(() => baseUoms.id).notNull(), // How we sell it
  purchaseUomId: integer('purchase_uom_id').references(() => baseUoms.id).notNull(), // How we buy it
  
  // Conversion factors
  stockToSalesConversion: decimal('stock_to_sales_conversion', { precision: 15, scale: 6 }).default('1'),
  stockToPurchaseConversion: decimal('stock_to_purchase_conversion', { precision: 15, scale: 6 }).default('1'),
  purchasePackSize: integer('purchase_pack_size').default(1), // e.g., 150 for box of 150
  
  // Pricing
  unitCost: decimal('unit_cost', { precision: 15, scale: 4 }),
  unitPrice: decimal('unit_price', { precision: 15, scale: 4 }),
  
  // Inventory
  currentStock: decimal('current_stock', { precision: 15, scale: 4 }).default('0'),
  minimumStock: decimal('minimum_stock', { precision: 15, scale: 4 }).default('0'),
  maximumStock: decimal('maximum_stock', { precision: 15, scale: 4 }),
  
  // Temporary item expiry (for temporary stock codes)
  expiryDate: timestamp('expiry_date'),
  
  // Manufacturing/BOM related
  isBomItem: boolean('is_bom_item').default(false),
  bomData: jsonb('bom_data'), // For storing BOM structure
  
  // Metadata
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 })
});

// Stock Item Attributes (linking items to their specific attribute values)
const stockItemAttributes = pgTable('stock_item_attributes', {
  id: serial('id').primaryKey(),
  stockItemId: integer('stock_item_id').references(() => stockItems.id).notNull(),
  attributeId: integer('attribute_id').references(() => itemAttributes.id).notNull(),
  attributeValue: text('attribute_value').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Define relations
const baseUomsRelations = relations(baseUoms, ({ many }) => ({
  fromConversions: many(uomConversions, { relationName: 'fromUom' }),
  toConversions: many(uomConversions, { relationName: 'toUom' }),
  stockItemsBase: many(stockItems, { relationName: 'baseUom' }),
  stockItemsStock: many(stockItems, { relationName: 'stockUom' }),
  stockItemsSales: many(stockItems, { relationName: 'salesUom' }),
  stockItemsPurchase: many(stockItems, { relationName: 'purchaseUom' })
}));

const uomConversionsRelations = relations(uomConversions, ({ one }) => ({
  fromUom: one(baseUoms, {
    fields: [uomConversions.fromUomId],
    references: [baseUoms.id],
    relationName: 'fromUom'
  }),
  toUom: one(baseUoms, {
    fields: [uomConversions.toUomId],
    references: [baseUoms.id],
    relationName: 'toUom'
  })
}));

const itemCategoriesRelations = relations(itemCategories, ({ one, many }) => ({
  parentCategory: one(itemCategories, {
    fields: [itemCategories.parentCategoryId],
    references: [itemCategories.id],
    relationName: 'parentChild'
  }),
  childCategories: many(itemCategories, { relationName: 'parentChild' }),
  stockItems: many(stockItems)
}));

const itemAttributesRelations = relations(itemAttributes, ({ many }) => ({
  stockItemAttributes: many(stockItemAttributes)
}));

const variantsRelations = relations(variants, ({ many }) => ({
  stockItems: many(stockItems)
}));

const marginCategoriesRelations = relations(marginCategories, ({ many }) => ({
  stockItems: many(stockItems)
}));

const discountCategoriesRelations = relations(discountCategories, ({ many }) => ({
  stockItems: many(stockItems)
}));

const stockItemsRelations = relations(stockItems, ({ one, many }) => ({
  baseUom: one(baseUoms, {
    fields: [stockItems.baseUomId],
    references: [baseUoms.id],
    relationName: 'baseUom'
  }),
  stockUom: one(baseUoms, {
    fields: [stockItems.stockUomId],
    references: [baseUoms.id],
    relationName: 'stockUom'
  }),
  salesUom: one(baseUoms, {
    fields: [stockItems.salesUomId],
    references: [baseUoms.id],
    relationName: 'salesUom'
  }),
  purchaseUom: one(baseUoms, {
    fields: [stockItems.purchaseUomId],
    references: [baseUoms.id],
    relationName: 'purchaseUom'
  }),
  itemCategory: one(itemCategories, {
    fields: [stockItems.itemCategoryId],
    references: [itemCategories.id]
  }),
  variant: one(variants, {
    fields: [stockItems.variantId],
    references: [variants.id]
  }),
  marginCategory: one(marginCategories, {
    fields: [stockItems.marginCategoryId],
    references: [marginCategories.id]
  }),
  discountCategory: one(discountCategories, {
    fields: [stockItems.discountCategoryId],
    references: [discountCategories.id]
  }),
  attributes: many(stockItemAttributes)
}));

const stockItemAttributesRelations = relations(stockItemAttributes, ({ one }) => ({
  stockItem: one(stockItems, {
    fields: [stockItemAttributes.stockItemId],
    references: [stockItems.id]
  }),
  attribute: one(itemAttributes, {
    fields: [stockItemAttributes.attributeId],
    references: [itemAttributes.id]
  })
}));

// Export all tables and relations
module.exports = {
  baseUoms,
  uomConversions,
  itemCategories,
  itemAttributes,
  variants,
  marginCategories,
  discountCategories,
  stockItems,
  stockItemAttributes,
  baseUomsRelations,
  uomConversionsRelations,
  itemCategoriesRelations,
  itemAttributesRelations,
  variantsRelations,
  marginCategoriesRelations,
  discountCategoriesRelations,
  stockItemsRelations,
  stockItemAttributesRelations
};