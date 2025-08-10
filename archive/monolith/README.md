# Archived Monolith Customer System

## Overview
This directory contains the original monolithic customer management system that was replaced by the new modular architecture. These files are preserved for safety and rollback purposes.

## Archived Date
August 10, 2025

## Reason for Archiving
The system has been migrated to a new modular architecture with improved:
- Platform abstraction layer for shared components
- Better separation of concerns
- Enhanced maintainability and scalability
- Modern SPA routing with hash-based navigation

## New Module Structure
The customer functionality has been moved to:
- `src/modules/customers/index.jsx` - Customer list view
- `src/modules/customers/Details.jsx` - Customer form/details view
- `src/modules/customers/api.js` - API abstraction layer
- `src/modules/customers/schema.js` - Data validation and business rules

## Platform Layer
Shared functionality is now abstracted in:
- `src/platform/components/` - Reusable UI components
- `src/platform/services/` - Data access and business logic services

## Archived Files

### components/customer-manager.js
- **Original Purpose**: Complete monolithic customer management component
- **Size**: ~2000+ lines of code handling list view, form view, validation, and business logic
- **Status**: Marked as LEGACY with safety net comments
- **Replacement**: Split into multiple focused modules in `src/modules/customers/`

### References in Active Files
The following active files still reference the archived components:
- `app.js` - Lines 413-416: CustomerManager initialization (legacy tab handling)
- `index.html` - Line 609: Script loading for customer-manager.js

## Rollback Instructions
To restore the old customer system:
1. Copy `archive/monolith/components/customer-manager.js` back to `components/customer-manager.js`
2. Remove the onclick handler from the Customers menu item in index.html
3. Change the data-tab back to "customers" in the sidebar navigation
4. Restart the application

## Safety Notes
- All archived files are fully functional copies of the original system
- No data loss occurred during the migration
- The original system can be restored without any modifications
- Legacy routing mechanisms remain intact for emergency rollback

## Migration Benefits
The new modular system provides:
- **Component Isolation**: Each module is self-contained with clear dependencies
- **Platform Abstraction**: Shared services reduce code duplication
- **Professional UI**: Modern header/sidebar layout with breadcrumb navigation
- **Hash Routing**: SPA-style navigation with parameter support
- **Auto-save**: Enhanced user experience with automatic form saving
- **Data Validation**: Centralized schema validation with business rules

## Technical Debt Resolved
- Eliminated ~2000+ lines of monolithic code
- Separated concerns between UI, business logic, and data access
- Standardized component patterns across the application
- Improved error handling and fallback mechanisms
- Enhanced code reusability through platform abstraction