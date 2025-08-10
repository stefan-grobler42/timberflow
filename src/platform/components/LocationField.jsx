// Platform Components - LocationField Wrapper
// Wraps the existing EnhancedLocationField component with same API
// Note: Original component is loaded globally via window.EnhancedLocationField

// Re-export with same constructor API as existing component
export class LocationField {
  constructor(containerId, options = {}) {
    // Use the global EnhancedLocationField class
    return new window.EnhancedLocationField(containerId, options);
  }
}

// Also provide factory function for compatibility
export const createLocationField = (containerId, options) => {
  return new window.EnhancedLocationField(containerId, options);
};

export default LocationField;