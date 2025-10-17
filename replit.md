# Millennium Timber Roof ERP

## Overview
Millennium Timber Roof ERP is a specialized, web-based ERP system for timber roofing contractors. Its purpose is to manage complex projects from quotation to stock management, integrating with Mitek Pamir design software. The system supports hierarchical project structures, dynamic quotation generation, and sophisticated stock handling for diverse client types, aiming to streamline business operations, improve material calculation efficiency, and provide comprehensive project workflow management.

## Recent Changes

### October 17, 2025 - Advanced CRM Components & Duplicate Detection System
- **✅ EntityFormActionBar Component**: Reusable action bar with back arrow + Save/Save & Close/Delete buttons for all entity forms - consistent UI across all forms
- **✅ AsyncLookupField Component**: Search-first lookup with debounced search, max 3 inline suggestions, keyboard navigation (Tab/Enter/Escape), and advanced search modal with column filtering
- **✅ Backend Lookup Search Endpoints**: Multi-field relevance scoring (exact match=3, starts with=2, contains=1) for /lookups/{entity}/recent and /lookups/{entity}/search endpoints
- **✅ RelatedEntityGrid Component**: Generic subgrid wrapper with New/Edit/Delete that opens entity forms in Panel popups - full CRUD operations in subgrids
- **✅ Duplicate Detection Backend Service**: 
  - EF Core-compatible 3-step JOIN pattern for scalable duplicate detection (no O(n²) in-memory scans)
  - Configurable match rules per entity (Exact, CaseInsensitive, Fuzzy, Phone, Email)
  - Weighted scoring algorithm with configurable threshold
  - Fuzzy matching with Levenshtein distance + database-side narrowing
  - Transaction-wrapped merge with auto-relinking of related records (contacts, quotes, orders, tenders)
- **✅ Duplicate Detection & Merge UI**:
  - Entity selector with dynamic match rules configuration
  - Side-by-side field comparison of master vs duplicate records
  - Field-level selection with radio buttons for merge preview
  - Confirmation dialogs before destructive operations
  - Client-side validation for rule weights (1-10)
  - Auto-clear results when entity type changes
- **Database Schema**: Added relationshiptypecode column to accounts table

### October 16, 2025 - D365-Style Account Form & Lookup System
- **✅ D365-Style Account Form with Functional Subgrids COMPLETED**: Fully functional AccountForm matching Dynamics 365 with:
  - **Two-column layout**: Account Information (left) + Address with Google Maps (right)
  - **Google Maps Places Autocomplete**: Search addresses with auto-population of Street, City, State, Postal Code, Country, and coordinates
  - **Tab navigation**: Summary/Quotes/Orders/Tenders (Related tab removed per user request)
  - **Dropdown fields**: Company Type, Account Type, Relationship Type
  - **Lookup fields**: Parent Account (Accounts), Sales Representative (Employees), Primary Contact (D365Contacts)
  - **Functional subgrids**: Contacts, Quotes, Orders, Tenders - all filtered by account GUID with case-insensitive matching
  - **Draggable marker**: Update coordinates by dragging map marker
- **✅ Enhanced Lookup System**: Updated useLookupData hook to include D365Contacts map; all GUID comparisons now case-insensitive for reliable filtering
- **✅ Lookup Helper Utilities**: Created utils/lookupHelpers.ts with resolveLookup function for consistent lookup field rendering across forms
- **✅ GUID Preservation Fix COMPLETED**: Fixed critical bug in AccountsController and EmployeesController that were regenerating GUIDs instead of preserving D365 GUIDs during migration
- **✅ Data Integrity Restored**: Re-migrated 1,045 Accounts and 74 Employees with D365 GUIDs intact - lookup relationships now functioning correctly
- **✅ Lookup Resolution Working**: Production grid displays employee names (Saw Operator: MESCHACK SKOSANA, CASWELL TIVANE, etc.; Jig Leader: SYDNEY NTOMBELA, JAYLOTTE MBHUNGA) instead of GUIDs
- **✅ Match Rates Verified**: 217/224 customers (96.9%), 12/12 Saw Operators (100%), 15/15 Jig Leaders (100%) - 7 orphaned GUIDs are deleted D365 accounts
- **Pagination System**: Implemented reusable pagination with 50/100 records per page options across AccountsPage, D365OrdersPage, and D365ContactsPage

## User Preferences
Preferred communication style: Simple, everyday language.
Technology stack preference: React + Fluent UI v8 for modern, Microsoft-style interface
Architecture preference: Clean separation with ASP.NET Core Web API backend and React frontend

## System Architecture

### Core Principles
The system is built as a modern Single-Page Application (SPA) using React with Fluent UI components for a professional Microsoft-style interface. The frontend communicates with an ASP.NET Core Web API backend that uses SQLite for data storage. The architecture prioritizes clean separation of concerns, type safety with TypeScript, and reusable component patterns.

### Frontend
- **Framework**: React 18.2.0 with TypeScript
- **UI Library**: Fluent UI v8
- **Routing**: React Router v7 for client-side navigation
- **Styling**: Fluent UI theme with Carolina Blue (#59AAD5) brand color
- **Layout**: Prominent Header (60px), light gray Sidebar, and Content area
- **Key Components**: DetailsList (Power Apps-style data grid with sorting, filtering, column management, Excel export/import), Pivot (horizontal tabs), CommandBar (action buttons), Panel/Dialog (modal forms).

### Backend Integration
- **API**: ASP.NET Core 8 Web API
- **Database**: SQLite with Entity Framework Core
- **Architecture**: Clean layered structure (Controllers → Services → Data)
- **DTOs**: Separate Create/Update/Read data transfer objects
- **CORS**: Configured for frontend origin
- **Port**: Backend runs on port 8000, frontend proxies /api requests

### Key Features and Modules
- **Project Management**: Support for hierarchical project structures.
- **Quotation Management**: Dynamic quotation generation.
- **Stock Management**: Sophisticated handling for diverse materials.
- **Customer Management**: Full CRUD operations, company type relationships, contact information, location, financial data.
- **User Management**: Employee records with roles, departments, contact details.
- **CRM Features**: PeekView for related record previews, SubGrid for related records, LookupField with typeahead search and inline record creation.
- **View Management**: Save custom grid views with column visibility and filters.
- **Advanced Filtering**: Complex filter expressions with AND/OR logic.
- **Global Search**: Search across all entity fields including related data.
- **Excel Integration**: Import/export customer data.
- **Horizontal Tab Navigation**: Custom tab system for form sections, mimicking Power Apps style.

### UI/UX Decisions
- Modern, Microsoft-style interface using Fluent UI.
- Prominent header with clear branding.
- Professional color scheme with Carolina Blue for branding and selected items, light gray for sidebar for readability.
- Power Apps-style grid features including responsive design, column resizing, and advanced filtering.

## Data Migration from Microsoft Dynamics 365

### Migration Status (October 2025)
Successfully completed data migration from 7 D365 entities to custom ERP with full lookup relationship support:
- **Designer**: 11/11 records (100%)
- **SaleRepresentative**: 18/18 records (100%)
- **Vehicles**: 19/19 records (100%)
- **Employees**: 74/74 records (100%)
- **Production**: 2,765/2,765 records (100%) - 14 lookup relationships working
- **Logistics**: 2,413/2,413 records (100%) - 11 lookup relationships working
- **Delivery**: 1/1 record (100%) - 14 lookup relationships working

### Lookup Relationships Status
✅ **GUID PRESERVATION FIX COMPLETED (October 16, 2025)**:
- **Root Cause Identified**: AccountsController and EmployeesController were regenerating GUIDs instead of preserving D365 GUIDs during migration
- **Fix Applied**: Updated both controllers to use `createDto.Id ?? Guid.NewGuid()` pattern to preserve D365 GUIDs while allowing manual creation with new GUIDs
- **Migration Re-run**: Successfully re-migrated 1,045 Accounts and 74 Employees with D365 GUIDs intact
- **Verification Results**: 217/224 Production customers match Accounts (96.9%), 12/12 Saw Operators match (100%), 15/15 Jig Leaders match (100%)
- **Orphaned Records**: 7 Account GUIDs in Production are deleted D365 accounts (acceptable data quality)
- **Frontend Fix**: Corrected camelCase field names (sawOperator, jigLeader) in ProductionPage to match ASP.NET Core JSON serialization
- **Status**: All lookup relationships now functioning - employee names display correctly in Production grid

Active Lookup Relationships (Verified Working):
- Production → Employees (12 employee lookups: saw operators, helpers, jig leaders, etc.) ✅
- Production → Customers (customer lookup) ✅
- Production → Sales Orders (order number lookup)
- Logistics → Employees (9 employee lookups: drivers, dispatch managers, helpers, etc.)
- Logistics → Vehicles (2 vehicle lookups: vehicle, trailer)
- Delivery → Employees, Vehicles, Customers, Orders (14 total lookups)

### Key Technical Solutions
1. **D365 Lookup Field Discovery**: D365 Web API returns lookup fields with `_value` suffix containing related record GUIDs (e.g., `_cr694_sawoperator_value` returns the Employee GUID, not `cr694_sawoperator`). This is the standard D365 OData convention for navigating relationships. All field mappings updated to use `_<fieldname>_value` pattern.

2. **D365 Entity Set Naming Quirks**: D365 uses non-standard pluralization rules (e.g., `cr694_vehicleses` not `cr694_vehicles`, `cr694_driverses` not `cr694_employees`, `cr694_dispatchs` not `cr694_dispatches`). Always test API endpoints to confirm actual names.

3. **GUID Preservation**: D365 GUIDs preserved as primary keys in ERP to ensure referential integrity. This approach maximizes data fidelity and ensures all foreign key relationships align correctly.

4. **JSON Type Conversion**: D365 returns numeric values for fields like tax IDs (e.g., `new_incometaxnumber: 1484167141`), but ERP expects strings. Solution: Migration script converts all numbers to strings, and API configured with `JsonNumberHandling.AllowReadingFromString` to deserialize correctly.

5. **MaxLength Constraints**: Removed all `[MaxLength]` attributes from migrated entities (Employee, Production, Logistics, Delivery) to accept D365 data of any length without truncation.

6. **Nullable Fields**: Made all entity fields nullable to accommodate D365's flexible data model where any field can be null.

### Migration Architecture
- **Auth**: OAuth 2.0 with MSAL for secure D365 API access
- **Script**: Python migration script (`dynamics365_integration/migrate_data.py`) with field mapping and transformation logic
- **API Config**: ASP.NET Core configured with flexible JSON deserialization to handle D365's data types
- **Entity Mapping**: Explicit field mappings for each entity to handle D365's naming conventions

## External Dependencies

- **React 18.2.0**: Frontend UI framework.
- **Fluent UI v8.123.6**: Microsoft's React component library.
- **TypeScript**: For type-safe development.
- **Vite**: Build tool and dev server.
- **React Router v7**: Client-side routing.
- **ASP.NET Core 8 Web API**: Backend framework.
- **SQLite with Entity Framework Core**: Database and ORM.
- **Microsoft Dynamics 365**: OAuth 2.0 integration with Dataverse API for schema extraction and data migration (using MSAL).
- **Google Maps Platform**: Places API, Maps JavaScript API, Geocoding API.
- **SheetJS/xlsx**: Excel file parsing and generation.
- **Mitek Pamir**: CAD software for design data integration.