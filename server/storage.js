const { 
  stockItems, 
  baseUoms,
  itemCategories,
  itemAttributes,
  variants,
  marginCategories,
  discountCategories,
  stockItemAttributes,
  uomConversions
} = require("../shared/schema");
const { db } = require("./db");
const { eq, desc, asc, like, and, or, isNull } = require("drizzle-orm");

class DatabaseStorage {
  // Stock Items
  async getStockItems(filters) {
    const query = db.select().from(stockItems);
    
    // Add filters if provided
    const conditions = [];
    
    if (filters?.search) {
      conditions.push(
        or(
          like(stockItems.itemCode, `%${filters.search}%`),
          like(stockItems.description, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.status) {
      conditions.push(eq(stockItems.status, filters.status));
    }
    
    if (filters?.itemType) {
      conditions.push(eq(stockItems.itemType, filters.itemType));
    }
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    return await query
      .orderBy(asc(stockItems.itemCode))
      .execute();
  }

  async getStockItem(id) {
    const [item] = await db.select()
      .from(stockItems)
      .where(eq(stockItems.id, id))
      .execute();
    return item || undefined;
  }

  async getStockItemByCode(code) {
    const [item] = await db.select()
      .from(stockItems)
      .where(eq(stockItems.itemCode, code))
      .execute();
    return item || undefined;
  }

  async createStockItem(item) {
    const [created] = await db.insert(stockItems)
      .values(item)
      .returning()
      .execute();
    return created;
  }

  async updateStockItem(id, updates) {
    const [updated] = await db.update(stockItems)
      .set(updates)
      .where(eq(stockItems.id, id))
      .returning()
      .execute();
    return updated;
  }

  async deleteStockItem(id) {
    const result = await db.delete(stockItems)
      .where(eq(stockItems.id, id))
      .execute();
    return result.rowCount > 0;
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