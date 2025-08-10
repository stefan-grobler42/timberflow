// Stock-related imports removed - placeholder module in use
// const {} = require("../shared/schema");
const { db } = require("./db");
const { eq, desc, asc, like, and, or, isNull } = require("drizzle-orm");

class DatabaseStorage {
  // Stock module removed - placeholder methods
  async getStockItems(filters) {
    throw new Error('Stock module not available - placeholder implementation');
  }

  async getStockItem(id) {
    throw new Error('Stock module not available - placeholder implementation');
  }

  async getStockItemByCode(code) {
    throw new Error('Stock module not available - placeholder implementation');
  }

  async createStockItem(item) {
    throw new Error('Stock module not available - placeholder implementation');
  }

  async updateStockItem(id, updates) {
    throw new Error('Stock module not available - placeholder implementation');
  }

  async deleteStockItem(id) {
    throw new Error('Stock module not available - placeholder implementation');
  }

  // Base UOMs
  async getBaseUoms() {
    return await db.select()
      .from(baseUoms)
      .where(eq(baseUoms.isActive, true))
      .orderBy(asc(baseUoms.code))
      .execute();
  }

  async getBaseUom(id) {
    const [uom] = await db.select()
      .from(baseUoms)
      .where(eq(baseUoms.id, id))
      .execute();
    return uom || undefined;
  }

  async createBaseUom(uom) {
    const [created] = await db.insert(baseUoms)
      .values(uom)
      .returning()
      .execute();
    return created;
  }

  async updateBaseUom(id, updates) {
    const [updated] = await db.update(baseUoms)
      .set(updates)
      .where(eq(baseUoms.id, id))
      .returning()
      .execute();
    return updated;
  }

  // Item Categories
  async getItemCategories() {
    return await db.select()
      .from(itemCategories)
      .where(eq(itemCategories.isActive, true))
      .orderBy(asc(itemCategories.name))
      .execute();
  }

  async getItemCategory(id) {
    const [category] = await db.select()
      .from(itemCategories)
      .where(eq(itemCategories.id, id))
      .execute();
    return category || undefined;
  }

  async createItemCategory(category) {
    const [created] = await db.insert(itemCategories)
      .values(category)
      .returning()
      .execute();
    return created;
  }

  async updateItemCategory(id, updates) {
    const [updated] = await db.update(itemCategories)
      .set(updates)
      .where(eq(itemCategories.id, id))
      .returning()
      .execute();
    return updated;
  }

  // Item Attributes
  async getItemAttributes() {
    return await db.select()
      .from(itemAttributes)
      .where(eq(itemAttributes.isActive, true))
      .orderBy(asc(itemAttributes.name))
      .execute();
  }

  async getItemAttribute(id) {
    const [attribute] = await db.select()
      .from(itemAttributes)
      .where(eq(itemAttributes.id, id))
      .execute();
    return attribute || undefined;
  }

  async createItemAttribute(attribute) {
    const [created] = await db.insert(itemAttributes)
      .values(attribute)
      .returning()
      .execute();
    return created;
  }

  async updateItemAttribute(id, updates) {
    const [updated] = await db.update(itemAttributes)
      .set(updates)
      .where(eq(itemAttributes.id, id))
      .returning()
      .execute();
    return updated;
  }

  // Variants
  async getVariants() {
    return await db.select()
      .from(variants)
      .where(eq(variants.isActive, true))
      .orderBy(asc(variants.name))
      .execute();
  }

  async getVariant(id) {
    const [variant] = await db.select()
      .from(variants)
      .where(eq(variants.id, id))
      .execute();
    return variant || undefined;
  }

  async createVariant(variant) {
    const [created] = await db.insert(variants)
      .values(variant)
      .returning()
      .execute();
    return created;
  }

  async updateVariant(id, updates) {
    const [updated] = await db.update(variants)
      .set(updates)
      .where(eq(variants.id, id))
      .returning()
      .execute();
    return updated;
  }

  // Margin Categories
  async getMarginCategories() {
    return await db.select()
      .from(marginCategories)
      .where(eq(marginCategories.isActive, true))
      .orderBy(asc(marginCategories.name))
      .execute();
  }

  async getMarginCategory(id) {
    const [category] = await db.select()
      .from(marginCategories)
      .where(eq(marginCategories.id, id))
      .execute();
    return category || undefined;
  }

  async createMarginCategory(category) {
    const [created] = await db.insert(marginCategories)
      .values(category)
      .returning()
      .execute();
    return created;
  }

  async updateMarginCategory(id, updates) {
    const [updated] = await db.update(marginCategories)
      .set(updates)
      .where(eq(marginCategories.id, id))
      .returning()
      .execute();
    return updated;
  }

  // Discount Categories
  async getDiscountCategories() {
    return await db.select()
      .from(discountCategories)
      .where(eq(discountCategories.isActive, true))
      .orderBy(asc(discountCategories.name))
      .execute();
  }

  async getDiscountCategory(id) {
    const [category] = await db.select()
      .from(discountCategories)
      .where(eq(discountCategories.id, id))
      .execute();
    return category || undefined;
  }

  async createDiscountCategory(category) {
    const [created] = await db.insert(discountCategories)
      .values(category)
      .returning()
      .execute();
    return created;
  }

  async updateDiscountCategory(id, updates) {
    const [updated] = await db.update(discountCategories)
      .set(updates)
      .where(eq(discountCategories.id, id))
      .returning()
      .execute();
    return updated;
  }

  // UOM Conversions
  async getUomConversions() {
    return await db.select()
      .from(uomConversions)
      .where(eq(uomConversions.isActive, true))
      .execute();
  }

  async getUomConversionsForUom(uomId) {
    return await db.select()
      .from(uomConversions)
      .where(
        and(
          eq(uomConversions.isActive, true),
          or(
            eq(uomConversions.fromUomId, uomId),
            eq(uomConversions.toUomId, uomId)
          )
        )
      )
      .execute();
  }

  async createUomConversion(conversion) {
    const [created] = await db.insert(uomConversions)
      .values(conversion)
      .returning()
      .execute();
    return created;
  }

  async updateUomConversion(id, updates) {
    const [updated] = await db.update(uomConversions)
      .set(updates)
      .where(eq(uomConversions.id, id))
      .returning()
      .execute();
    return updated;
  }

  // Stock Item Attributes
  async getStockItemAttributes(stockItemId) {
    return await db.select()
      .from(stockItemAttributes)
      .where(eq(stockItemAttributes.stockItemId, stockItemId))
      .execute();
  }

  async createStockItemAttribute(attribute) {
    const [created] = await db.insert(stockItemAttributes)
      .values(attribute)
      .returning()
      .execute();
    return created;
  }

  async updateStockItemAttribute(id, updates) {
    const [updated] = await db.update(stockItemAttributes)
      .set(updates)
      .where(eq(stockItemAttributes.id, id))
      .returning()
      .execute();
    return updated;
  }

  async deleteStockItemAttribute(id) {
    const result = await db.delete(stockItemAttributes)
      .where(eq(stockItemAttributes.id, id))
      .execute();
    return result.rowCount > 0;
  }
}

module.exports = { storage: new DatabaseStorage() };