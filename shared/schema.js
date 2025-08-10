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

// Note: Stock-related tables removed - placeholder module implemented instead
// Future stock implementation will use a different schema structure

// No stock-related relations - removed with stock module

// Export minimal schema - stock tables removed
module.exports = {
  // Stock module placeholder - no database tables exported
  // Future stock implementation will export new schema
};