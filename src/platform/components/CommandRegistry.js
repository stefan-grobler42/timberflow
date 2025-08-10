// Command Registry System
// Manages contextual actions for the header bar
class CommandRegistry {
  constructor() {
    this.actions = [];
    this.subscribers = new Set();
    this.activeComponent = null;
  }

  // Register actions for a component
  set(actions, componentId = null) {
    this.actions = Array.isArray(actions) ? actions : [];
    this.activeComponent = componentId;
    this.notifySubscribers();
  }

  // Clear actions (called on component unmount)
  clear(componentId = null) {
    if (!componentId || this.activeComponent === componentId) {
      this.actions = [];
      this.activeComponent = null;
      this.notifySubscribers();
    }
  }

  // Get current actions
  get() {
    return this.actions;
  }

  // Subscribe to action changes
  subscribe(callback) {
    this.subscribers.add(callback);
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Notify all subscribers of changes
  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.actions);
      } catch (error) {
        console.error('CommandRegistry: Error in subscriber callback:', error);
      }
    });
  }

  // Add a single action
  addAction(action) {
    if (action && action.id && action.label) {
      // Remove existing action with same id
      this.actions = this.actions.filter(a => a.id !== action.id);
      this.actions.push(action);
      this.notifySubscribers();
    }
  }

  // Remove a single action
  removeAction(actionId) {
    this.actions = this.actions.filter(a => a.id !== actionId);
    this.notifySubscribers();
  }

  // Update an existing action
  updateAction(actionId, updates) {
    const actionIndex = this.actions.findIndex(a => a.id === actionId);
    if (actionIndex !== -1) {
      this.actions[actionIndex] = { ...this.actions[actionIndex], ...updates };
      this.notifySubscribers();
    }
  }
}

// Global instance
const commandRegistry = new CommandRegistry();

// Hook-like API for components
function useCommands(componentId = null) {
  return {
    set: (actions) => commandRegistry.set(actions, componentId),
    clear: () => commandRegistry.clear(componentId),
    get: () => commandRegistry.get(),
    addAction: (action) => commandRegistry.addAction(action),
    removeAction: (actionId) => commandRegistry.removeAction(actionId),
    updateAction: (actionId, updates) => commandRegistry.updateAction(actionId, updates),
    subscribe: (callback) => commandRegistry.subscribe(callback)
  };
}

// Component wrapper that auto-clears on destroy
class CommandProvider {
  constructor(componentId) {
    this.componentId = componentId;
    this.commands = useCommands(componentId);
    this.isDestroyed = false;
  }

  // Auto-cleanup when component is destroyed
  destroy() {
    if (!this.isDestroyed) {
      this.commands.clear();
      this.isDestroyed = true;
    }
  }

  // Proxy commands API
  set(actions) {
    if (!this.isDestroyed) {
      this.commands.set(actions);
    }
  }

  addAction(action) {
    if (!this.isDestroyed) {
      this.commands.addAction(action);
    }
  }

  removeAction(actionId) {
    if (!this.isDestroyed) {
      this.commands.removeAction(actionId);
    }
  }

  updateAction(actionId, updates) {
    if (!this.isDestroyed) {
      this.commands.updateAction(actionId, updates);
    }
  }
}

// Make available globally
window.CommandRegistry = CommandRegistry;
window.useCommands = useCommands;
window.CommandProvider = CommandProvider;

// Export the global instance
window.commandRegistry = commandRegistry;