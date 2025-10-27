# Millennium Timber Roof ERP

## Overview
Millennium Timber Roof ERP is a specialized, web-based ERP system designed for timber roofing contractors. Its core purpose is to manage complex projects comprehensively, from initial quotation through to stock management. The system integrates with Mitek Pamir design software and supports hierarchical project structures, dynamic quotation generation, and sophisticated stock handling for diverse client needs. The project aims to streamline business operations, improve material calculation efficiency, and provide an all-encompassing project workflow management solution, ultimately enhancing market potential and operational ambitions for timber roofing contractors.

## Recent Changes (October 27, 2025)

### Navigation Structure Reorganization
**Sidebar Navigation Update:**
- Restructured sidebar navigation to match comprehensive ERP workflow
- Top-level navigation: Home, Recent, Pinned (with expandable functionality)
- **My Work**: Activities, Dashboards
- **Customers**: Accounts, Contacts
- **Sales**: Quotes, Orders, Tenders
- **Procurement**: Procurement module
- **Production**: Production management
- **Dispatch**: Trips, Loads
- **Installation**: Installations, Sub-Contractor Deductions, Sub-Contractors
- **Settings**: Products, Employees, Designers, Sale Representatives, Vehicles, Suppliers
- Fixed icon compatibility issues (replaced unregistered "Shipping" icon with "NavigateForward")

## Previous Changes (October 20, 2025)

### Form Consistency & Google Maps Integration Updates
**Contact Form Improvements:**
- Updated tab animation to match Account form (borderBottom indicator instead of backgroundColor)
- Added Google Maps mini map with draggable marker (200px height)
- Implemented full address autocomplete: Search Address, Address Name, Street 1, State/Province, ZIP/Postal Code, Country/Region
- All address fields auto-populate from Google Maps search with latitude/longitude capture
- Used unique element IDs ("contact-address-search-input", "contact-form-map") to prevent conflicts with Account form

**Account Form Standardization:**
- Removed "Address 1: " prefix from all address field labels for cleaner UI
- Removed Street 2, Street 3, and City fields (no longer needed)
- Maintains Google Maps integration with mini map matching Contact form

**TypeScript Updates:**
- Added `address1Latitude` and `address1Longitude` optional fields to D365Contact interface for proper coordinate storage

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
-   **Routing**: React Router for client-side navigation.
-   **Styling**: Fluent UI theme with Carolina Blue (#59AAD5) brand color.
-   **Layout**: Consistent header, sidebar, and content area.
-   **Key Components**: DetailsList (Power Apps-style data grid), Pivot tabs, CommandBar, Panel/Dialog for modal interactions.

### Backend Integration
-   **API**: ASP.NET Core 8 Web API.
-   **Database**: SQLite with Entity Framework Core.
-   **Architecture**: Layered structure (Controllers → Services → Data).
-   **Data Transfer**: Separate DTOs for Create/Update/Read operations.
-   **CORS**: Configured for frontend origin.

### Key Features and Modules
-   **Project Management**: Hierarchical project structures.
-   **Quotation Management**: Dynamic generation.
-   **Stock Management**: Sophisticated material handling.
-   **Customer Management**: Full CRUD, contact info, location, financials.
-   **User Management**: Employee records, roles, departments.
-   **CRM Features**: PeekView, SubGrid, LookupField with typeahead search.
-   **View Management**: Custom grid views with column visibility and filters.
-   **Advanced Filtering**: Complex filter expressions (AND/OR).
-   **Global Search**: Across all entity fields.
-   **Excel Integration**: Import/export customer data.
-   **Duplicate Detection**: Scalable backend service with configurable rules, weighted scoring, and UI for side-by-side comparison and merging of records, including auto-relinking of related entities.

### UI/UX Decisions
-   Modern, Microsoft-style interface using Fluent UI.
-   Professional color scheme with Carolina Blue for branding.
-   Power Apps-style grid features including responsive design, column resizing, and advanced filtering.
-   D365-style forms for Accounts and Contacts, including Google Maps integration for addresses with mini maps (200px height) and functional subgrids.
-   Consistent tab animations across all forms using borderBottom active indicator.

### Data Migration Architecture
-   **Source**: Microsoft Dynamics 365.
-   **Authentication**: OAuth 2.0 with MSAL for secure D365 API access.
-   **Process**: Python migration script (`dynamics365_integration/migrate_data.py`) handling field mapping and transformation.
-   **Data Integrity**: Preservation of D365 GUIDs as primary keys, allowing for flexible data types (e.g., numeric to string conversion) and nullable fields.

## External Dependencies

-   **React**: Frontend UI framework.
-   **Fluent UI v8**: Microsoft's React component library.
-   **TypeScript**: For type-safe development.
-   **Vite**: Build tool and dev server.
-   **React Router**: Client-side routing.
-   **ASP.NET Core 8 Web API**: Backend framework.
-   **SQLite with Entity Framework Core**: Database and ORM.
-   **Microsoft Dynamics 365**: OAuth 2.0 integration for data migration and schema extraction.
-   **Google Maps Platform**: Places API, Maps JavaScript API, Geocoding API for address management with autocomplete and mini maps.
-   **SheetJS/xlsx**: For Excel file parsing and generation.
-   **Mitek Pamir**: CAD software for design data integration.
