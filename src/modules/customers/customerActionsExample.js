// Example: How to use CommandRegistry in a customer module
// This file demonstrates how to register contextual actions for the HeaderBar

class CustomerActionsExample {
  constructor() {
    this.commandProvider = null;
    this.setupCommands();
  }

  setupCommands() {
    // Get command provider for this module
    this.commandProvider = new CommandProvider('customers-module');
    
    // Register customer-specific actions
    const customerActions = [
      {
        id: 'new-customer',
        label: 'New Customer',
        icon: 'fas fa-plus',
        variant: 'primary',
        onClick: () => this.handleNewCustomer()
      },
      {
        id: 'import-customers',
        label: 'Import',
        icon: 'fas fa-upload',
        variant: 'outline-secondary',
        onClick: () => this.handleImportCustomers()
      },
      {
        id: 'export-customers',
        label: 'Export',
        icon: 'fas fa-download',
        variant: 'outline-secondary',
        onClick: () => this.handleExportCustomers()
      }
    ];
    
    this.commandProvider.set(customerActions);
  }

  handleNewCustomer() {
    console.log('Navigate to new customer form');
    window.location.hash = '#/customers/new';
  }

  handleImportCustomers() {
    console.log('Open import customers dialog');
    // Import logic here
  }

  handleExportCustomers() {
    console.log('Export customers to Excel');
    // Export logic here
  }

  // Clean up when component is destroyed
  destroy() {
    if (this.commandProvider) {
      this.commandProvider.destroy();
    }
  }
}

// Make available globally
window.CustomerActionsExample = CustomerActionsExample;