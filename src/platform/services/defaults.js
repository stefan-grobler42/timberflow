// Platform Services - System Defaults Wrapper
// Wraps the existing SystemDefaults with same API
// Note: Original SystemDefaults is loaded globally via window.SystemDefaults

// Re-export the SystemDefaults class and its static properties
export class PlatformDefaults {
  // Access global SystemDefaults and expose its static properties
  static get BRAND_COLORS() {
    return window.SystemDefaults?.BRAND_COLORS || {};
  }
  
  static get GRID_DEFAULTS() {
    return window.SystemDefaults?.GRID_DEFAULTS || {};
  }
  
  static get LOOKUP_DEFAULTS() {
    return window.SystemDefaults?.LOOKUP_DEFAULTS || {};
  }
  
  static get AUTO_SAVE_DEFAULTS() {
    return window.SystemDefaults?.AUTO_SAVE_DEFAULTS || {};
  }
  
  static get VALIDATION_DEFAULTS() {
    return window.SystemDefaults?.VALIDATION_DEFAULTS || {};
  }
  
  static get MAP_DEFAULTS() {
    return window.SystemDefaults?.MAP_DEFAULTS || {};
  }
}

// Convenience exports for commonly used defaults
export const BRAND_COLORS = window.SystemDefaults?.BRAND_COLORS || {};
export const GRID_DEFAULTS = window.SystemDefaults?.GRID_DEFAULTS || {};
export const LOOKUP_DEFAULTS = window.SystemDefaults?.LOOKUP_DEFAULTS || {};
export const AUTO_SAVE_DEFAULTS = window.SystemDefaults?.AUTO_SAVE_DEFAULTS || {};
export const VALIDATION_DEFAULTS = window.SystemDefaults?.VALIDATION_DEFAULTS || {};
export const MAP_DEFAULTS = window.SystemDefaults?.MAP_DEFAULTS || {};

// Main export for compatibility
export const defaults = window.SystemDefaults;
export default defaults;