// Platform Components - LocationPicker Wrapper
// Wraps the existing LocationPicker component with same API
// Note: Original component is loaded globally via window.LocationPicker

// Re-export with same constructor API as existing component
export class PlatformLocationPicker {
  constructor(containerId, options = {}) {
    // Use the global LocationPicker class
    return new window.LocationPicker(containerId, options);
  }
}

// Also provide factory function for compatibility
export const createLocationPicker = (containerId, options) => {
  return new window.LocationPicker(containerId, options);
};

// Export as LocationPicker for direct replacement
export { PlatformLocationPicker as LocationPicker };
export default PlatformLocationPicker;