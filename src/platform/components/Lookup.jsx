// Platform Components - Lookup Wrapper
// Wraps the existing LookupField component with same API
// Note: Original component is loaded globally via window.LookupField

// Re-export the existing LookupField class with same constructor API
export class Lookup {
  constructor(inputElement, options = {}) {
    // Use the global LookupField class
    return new window.LookupField(inputElement, options);
  }
}

// Re-export the factory function with same API
export const createLookup = (inputElement, data, options = {}) => {
  // Use the global createLookupField function
  return window.createLookupField(inputElement, data, options);
};

export default Lookup;