# Millennium Timber Roof ERP

## Overview
Millennium Timber Roof ERP is a specialized, web-based ERP system designed for timber roofing contractors. Its core purpose is to manage complex projects comprehensively, from initial quotation through to stock management, integrating with Mitek Pamir design software. The system supports hierarchical project structures, dynamic quotation generation, and sophisticated stock handling to streamline business operations, improve material calculation efficiency, and provide an all-encompassing project workflow management solution. The project aims to enhance market potential and operational ambitions for timber roofing contractors.

## Recent Changes
**November 21, 2025 - Critical Data Migration Fix:**
- **Issue**: Production-to-Order GUID linking failed (0 matches out of 2,904 production records)
- **Root Cause**: D365OrdersController was generating new GUIDs with `Guid.NewGuid()` instead of accepting original D365 salesorderid values from migration script
- **Fix**: Modified `CreateD365OrderDto` to include `Id` field and updated controller to use `createDto.Id ?? Guid.NewGuid()` for GUID preservation
- **Result**: Re-migrated 3,187 salesorders with original D365 GUIDs preserved; 2,904 production-order links now working (100% success rate)
- **Additional**: Fixed pagination display bug in ProductionPage (changed `totalItems` prop to `totalRecords`)

## User Preferences
Preferred communication style: Simple, everyday language.
Technology stack preference: React + Fluent UI v8 for modern, Microsoft-style interface
Architecture preference: Clean separation with ASP.NET Core Web API backend and React frontend

## System Architecture

### Core Principles
The system is a modern Single-Page Application (SPA) using React with Fluent UI for a professional Microsoft-style interface. The frontend communicates with an ASP.NET Core Web API backend using SQLite for data storage. The architecture emphasizes clean separation of concerns, type safety with TypeScript, and reusable component patterns.

### Frontend
-   **Framework**: React with TypeScript
-   **UI Library**: Fluent UI v8 for a professional Microsoft-style interface.
-   **Layout**: Consistent header, sidebar, and content area with a Microsoft-style navigation structure (e.g., My Work, Customers, Sales, Procurement, Dispatch, Installation, Settings).
-   **Key Components**: DetailsList (Power Apps-style data grid), Pivot tabs, CommandBar, Panel/Dialog for modal interactions.
-   **UI/UX Decisions**: Modern, Microsoft-style interface with a professional color scheme (Carolina Blue for branding). Power Apps-style grid features (responsive design, column resizing, advanced filtering). D365-style forms (Accounts, Contacts, Quotes) with Google Maps integration for addresses (mini maps, autocomplete, draggable markers) and functional subgrids. Consistent tab animations using a `borderBottom` active indicator.

### Backend
-   **API**: ASP.NET Core 8 Web API.
-   **Database**: SQLite with Entity Framework Core.
-   **Architecture**: Layered structure (Controllers → Services → Data).
-   **Data Transfer**: Separate DTOs for Create/Update/Read operations.

### Key Features and Modules
-   **Comprehensive ERP Modules**: Activities, Installations, Trips, Loads, Procurement, Suppliers, Sub-Contractors, Sub-Contractor Deductions, Accounts, Contacts, Quotes, Orders, Tenders, Products, Employees, Designers, Sales Representatives, Vehicles.
-   **View Management**: Custom grid views with `localStorage` persistence, default view support, and save/delete/set default functionality.
-   **Advanced Filtering**: `FilterBuilder` with AND/OR conditions and multiple operators.
-   **Quote Management**: Dynamic generation, D365-style panel forms, multi-tab layout (Summary, Financials, Products), line item CRUD subgrids with automatic total recalculation.
-   **CRM Features**: PeekView, SubGrid, LookupField with typeahead search, duplicate detection with configurable rules and merging capabilities.
-   **Project Management**: Hierarchical project structures.
-   **Stock Management**: Sophisticated material handling.
-   **Excel Integration**: Import/export capabilities.

### Data Migration Architecture
-   **Source**: Microsoft Dynamics 365.
-   **Process**: Python migration script for field mapping and transformation.
-   **Data Integrity**: Preservation of D365 GUIDs as primary keys, allowing flexible data types and nullable fields.

## External Dependencies

-   **React**: Frontend UI framework.
-   **Fluent UI v8**: Microsoft's React component library.
-   **TypeScript**: For type-safe development.
-   **Vite**: Build tool and dev server.
-   **React Router**: Client-side routing.
-   **ASP.NET Core 8 Web API**: Backend framework.
-   **SQLite with Entity Framework Core**: Database and ORM.
-   **Microsoft Dynamics 365**: OAuth 2.0 integration for data migration.
-   **Google Maps Platform**: Places API, Maps JavaScript API, Geocoding API for address management.
-   **SheetJS/xlsx**: For Excel file parsing and generation.
-   **Mitek Pamir**: CAD software for design data integration.