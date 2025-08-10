// Platform Components - SearchBox Wrapper
// Wraps the existing GlobalSearch component with same API
// Note: Original component is loaded globally via window.GlobalSearch

// Re-export with same constructor API as existing component
export class SearchBox {
  constructor(containerId) {
    // Use the global GlobalSearch class
    return new window.GlobalSearch(containerId);
  }
}

// Also provide factory function for compatibility
export const createSearchBox = (containerId) => {
  return new window.GlobalSearch(containerId);
};

export default SearchBox;