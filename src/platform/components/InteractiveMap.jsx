// Platform Components - InteractiveMap Wrapper
// Wraps the existing InteractiveMap component with same API
// Note: Original component is loaded globally via window.InteractiveMap

// Re-export with same constructor API as existing component
export class PlatformInteractiveMap {
  constructor(containerId, options = {}) {
    // Use the global InteractiveMap class
    return new window.InteractiveMap(containerId, options);
  }
}

// Also provide factory function for compatibility
export const createInteractiveMap = (containerId, options) => {
  return new window.InteractiveMap(containerId, options);
};

// Export as InteractiveMap for direct replacement
export { PlatformInteractiveMap as InteractiveMap };
export default PlatformInteractiveMap;