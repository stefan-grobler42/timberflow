// Platform Components - DataGrid Wrapper
// Wraps the existing EnhancedDataGrid component with same API
// Note: Original component is loaded globally via window.EnhancedDataGrid

// Re-export with same constructor API as existing component
export class DataGrid {
  constructor(containerId, config) {
    // Use the global EnhancedDataGrid class
    return new window.EnhancedDataGrid(containerId, config);
  }
}

// Also provide factory function for compatibility
export const createDataGrid = (containerId, config) => {
  return new window.EnhancedDataGrid(containerId, config);
};

export default DataGrid;