// Stock-related imports removed - placeholder module in use
// const {} = require("../shared/schema");
const { db } = require("./db");

class DatabaseStorage {
  // Stock module removed - all stock-related methods return placeholder errors
  
  // Stock Items (placeholder)
  async getStockItems(filters) {
    throw new Error('Stock module not available - using placeholder implementation');
  }

  async getStockItem(id) {
    throw new Error('Stock module not available - using placeholder implementation');
  }

  async getStockItemByCode(code) {
    throw new Error('Stock module not available - using placeholder implementation');
  }

  async createStockItem(item) {
    throw new Error('Stock module not available - using placeholder implementation');
  }

  async updateStockItem(id, updates) {
    throw new Error('Stock module not available - using placeholder implementation');
  }

  async deleteStockItem(id) {
    throw new Error('Stock module not available - using placeholder implementation');
  }

  // UOM, Categories, etc. (placeholder)
  async getBaseUoms() {
    throw new Error('Stock module not available - using placeholder implementation');
  }

  async getItemCategories() {
    throw new Error('Stock module not available - using placeholder implementation');
  }

  async getItemAttributes() {
    throw new Error('Stock module not available - using placeholder implementation');
  }

  async getVariants() {
    throw new Error('Stock module not available - using placeholder implementation');
  }

  async getMarginCategories() {
    throw new Error('Stock module not available - using placeholder implementation');
  }

  async getDiscountCategories() {
    throw new Error('Stock module not available - using placeholder implementation');
  }

  // All other stock-related methods return similar placeholder errors
  async getStockItemAttributes() {
    throw new Error('Stock module not available - using placeholder implementation');
  }
}

module.exports = { storage: new DatabaseStorage() };