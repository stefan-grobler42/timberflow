# Universal Auto-Save Pattern Implementation Guide

## Standard Pattern for All Record Forms

The auto-save pattern is the universal standard for all record forms throughout the Millennium ERP application, eliminating the need for explicit save/cancel buttons and providing a seamless user experience.

## Key Features

- **Automatic Save on Exit**: Changes are automatically saved when navigating back to list
- **Change Detection**: Real-time detection of form modifications
- **Undo Functionality**: Ability to revert changes before leaving the record
- **Visual Feedback**: Auto-save status indicators and undo button visibility
- **Error Handling**: Graceful handling of save failures with user options
- **No Explicit Save Buttons**: Streamlined interface without save/cancel clutter

## Implementation Pattern

### 1. Constructor Setup
```javascript
constructor(containerId) {
    // ... other properties
    this.currentItem = null;
    this.originalItem = null; // Store original state for undo
    this.hasUnsavedChanges = false;
    // ...
}
```

### 2. Form Header Structure
```html
<!-- Header -->
<div class="d-flex justify-content-between align-items-center mb-4">
    <div class="d-flex align-items-center gap-2">
        <button class="btn btn-outline-secondary" id="back-to-list-btn">
            <i class="fas fa-arrow-left"></i> Back to List
        </button>
        <button class="btn btn-outline-warning" id="undo-changes-btn" style="display: none;">
            <i class="fas fa-undo"></i> Undo Changes
        </button>
        <div id="auto-save-status" class="text-muted small" style="display: none;">
            <i class="fas fa-save"></i> Auto-saved
        </div>
    </div>
    <h3><i class="fas fa-icon"></i> ${isEdit ? 'Edit Record' : 'New Record'}</h3>
</div>
```

### 3. Event Listeners Setup
```javascript
attachFormEventListeners() {
    // Store original state for undo
    if (this.currentItem) {
        this.originalItem = JSON.parse(JSON.stringify(this.currentItem));
    } else {
        this.originalItem = null;
    }
    this.hasUnsavedChanges = false;

    const form = document.getElementById('form-id');
    if (form) {
        // Prevent default form submission
        form.addEventListener('submit', (e) => e.preventDefault());
        
        // Add change detection
        form.addEventListener('input', () => this.detectChanges());
        form.addEventListener('change', () => this.detectChanges());
    }

    // Back button with auto-save
    document.getElementById('back-to-list-btn')?.addEventListener('click', () => {
        this.handleBackToList();
    });

    // Undo changes button
    document.getElementById('undo-changes-btn')?.addEventListener('click', () => {
        this.undoChanges();
    });
}
```

### 4. Core Auto-Save Methods
```javascript
detectChanges() {
    if (!this.originalItem && !this.currentItem) return;
    
    const currentFormData = this.getFormData();
    const hasChanges = this.originalItem ? 
        JSON.stringify(currentFormData) !== JSON.stringify(this.originalItem) :
        Object.values(currentFormData).some(value => value !== '' && value !== 0 && value !== false);
    
    if (hasChanges !== this.hasUnsavedChanges) {
        this.hasUnsavedChanges = hasChanges;
        this.updateUndoButtonVisibility();
    }
}

updateUndoButtonVisibility() {
    const undoBtn = document.getElementById('undo-changes-btn');
    if (undoBtn) {
        undoBtn.style.display = this.hasUnsavedChanges ? 'block' : 'none';
    }
}

undoChanges() {
    if (this.originalItem) {
        this.populateForm(this.originalItem);
        this.hasUnsavedChanges = false;
        this.updateUndoButtonVisibility();
        this.showAutoSaveStatus('Changes undone');
    }
}

async handleBackToList() {
    if (this.hasUnsavedChanges) {
        const success = await this.autoSave();
        if (success) {
            this.showAutoSaveStatus('Auto-saved successfully');
            setTimeout(() => this.showList(), 500);
        } else {
            const proceed = confirm('Failed to save changes. Do you want to discard changes and continue?');
            if (proceed) {
                this.showList();
            }
        }
    } else {
        this.showList();
    }
}

async autoSave() {
    try {
        const formData = this.getFormData();
        
        if (this.currentItem) {
            // Update existing record
            const index = this.data.findIndex(r => r.id === this.currentItem.id);
            if (index !== -1) {
                this.data[index] = { ...this.data[index], ...formData };
            }
        } else {
            // Create new record
            formData.id = Date.now();
            this.data.push(formData);
        }
        
        this.hasUnsavedChanges = false;
        this.updateUndoButtonVisibility();
        return true;
    } catch (error) {
        console.error('Auto-save failed:', error);
        return false;
    }
}

showAutoSaveStatus(message) {
    const statusDiv = document.getElementById('auto-save-status');
    if (statusDiv) {
        statusDiv.innerHTML = `<i class="fas fa-check text-success"></i> ${message}`;
        statusDiv.style.display = 'block';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}
```

### 5. Navigation Methods
```javascript
newRecord() {
    this.currentItem = null;
    this.originalItem = null;
    this.hasUnsavedChanges = false;
    this.currentView = 'form';
    this.render();
}

editRecord(id) {
    this.currentItem = this.data.find(record => record.id === id);
    this.originalItem = null; // Will be set in attachFormEventListeners
    this.hasUnsavedChanges = false;
    this.currentView = 'form';
    this.render();
}

showList() {
    this.currentView = 'list';
    this.currentItem = null;
    this.originalItem = null;
    this.hasUnsavedChanges = false;
    this.render();
}
```

## Implementation Rules

### Do NOT Include These Elements
- ❌ Save/Submit buttons at bottom of forms
- ❌ Cancel buttons 
- ❌ Form submission handlers for saving
- ❌ Explicit save confirmation dialogs

### DO Include These Elements
- ✅ Auto-save on navigation
- ✅ Change detection on form inputs
- ✅ Undo changes button (shown only when changes exist)
- ✅ Auto-save status indicators
- ✅ Error handling for failed saves
- ✅ Seamless back-to-list navigation

## User Experience Flow

1. **Open Record**: User opens existing record or creates new one
2. **Make Changes**: User modifies form fields
3. **Change Detection**: Undo button appears automatically
4. **Navigate Away**: Click "Back to List" triggers auto-save
5. **Success Feedback**: Brief "Auto-saved successfully" message
6. **Return to List**: Seamless transition back to list view

## Undo Functionality

- **When Available**: Only while user is still in the record form
- **When NOT Available**: After leaving the record (changes are committed)
- **Visual Indicator**: Undo button only appears when unsaved changes exist
- **Scope**: Reverts ALL changes back to original values

## Error Handling

- **Save Failure**: User prompted to discard changes or stay in form
- **Network Issues**: Graceful degradation with user choice
- **Validation Errors**: Prevent auto-save until corrected

## Modules Using This Pattern

### Customer Management ✓ Implemented
- Auto-save on back navigation
- Undo changes functionality
- Change detection and visual feedback

### Future Implementations
- Project Management
- Stock Management
- Employee Management
- All other record-based modules

## Testing Checklist

- [ ] Changes detected in real-time
- [ ] Undo button appears/disappears correctly
- [ ] Auto-save triggers on back navigation
- [ ] Success feedback displays briefly
- [ ] Failed save prompts user appropriately
- [ ] No save/cancel buttons present
- [ ] Undo restores original values
- [ ] Change tracking resets on navigation