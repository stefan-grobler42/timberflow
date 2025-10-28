# Millennium Timber Roof ERP

## Overview
Millennium Timber Roof ERP is a specialized, web-based ERP system designed for timber roofing contractors. Its core purpose is to manage complex projects comprehensively, from initial quotation through to stock management. The system integrates with Mitek Pamir design software and supports hierarchical project structures, dynamic quotation generation, and sophisticated stock handling for diverse client needs. The project aims to streamline business operations, improve material calculation efficiency, and provide an all-encompassing project workflow management solution, ultimately enhancing market potential and operational ambitions for timber roofing contractors.

## Recent Changes (October 28, 2025)

### Quotes Module - Complete D365 Implementation
**Backend Implementation:**
- D365Quote entity with 48 fields: billing/shipping addresses (with lat/long), financial fields (totalAmount, tax, freight, discount), dates (effective from/to, expires, closed, delivery), contact info (name, phone, email), status codes
- D365QuoteDetail entity with 16 fields for line items: product lookup, quantity, pricing, manual discount, tax, base amount, extended amount, line item number
- Full CRUD APIs: /api/d365quotes, /api/d365quotedetails with DTOs for Create/Update/Read operations
- QuoteDetails navigation property in D365Quote entity for parent-child relationships
- GET /api/d365quotes/{id} returns quote WITH line items array
- GET /api/d365quotes?includeDetails=true returns all quotes with line items (optional loading for performance)
- Automatic total recalculation when line items change: TotalLineItemAmount = sum of (BaseAmount - ManualDiscountAmount), TotalTax = sum of Tax, TotalAmount = LineItems + Tax + Freight - Discount
- Strict QuoteId validation in quote details creation (prevents orphaned records)

**Frontend Implementation:**
- Quotes grid page (/quotes) with DetailsList showing 4,542 quotes: Quote Number, Name, Customer, Total Amount, Status, Effective From
- CommandBar with New, Edit, Delete, Refresh, Export to Excel buttons
- Search across all columns functionality
- Quote form with 5 tabs using all standardized components:
  - **General**: Quote Number, Name, Customer lookup (StandardLookupField), dates, status, description
  - **Billing Address**: StandardAddressFields with Google Maps mini map (200px), autocomplete, draggable marker, StandardPhoneField
  - **Shipping Address**: StandardAddressFields with Google Maps mini map (200px), autocomplete, draggable marker, StandardPhoneField
  - **Financials**: Total calculations (read-only), manual discount/freight fields
  - **Line Items**: Full CRUD subgrid with Add Panel (+ New Line Item button), Edit Panel (click row), Delete Dialog with confirmation
- Line items features: Product lookup (StandardLookupField), automatic calculation (Base Amount = Quantity × Price, Extended Amount = Base - Discount + Tax), POST/PUT/DELETE operations, auto-refresh grid and quote totals, success messages with updated totals
- Consistent tab animation using borderBottom indicator (matches Account/Contact forms)

**D365 Data Migration:**
- Successfully migrated 4,542 quotes from Microsoft Dynamics 365
- Successfully migrated 5,000 quote details (line items) from D365 (average 1.1 details per quote)
- Removed all foreign key constraints from D365 entities to allow flexible migration with nullable GUIDs
- Migration handles field mapping with fallback for unmapped D365 custom fields
- Orphaned quote details (referencing non-existent quotes) properly rejected with validation

**Technical Architecture:**
- Backend: ASP.NET Core 8 Web API with Entity Framework Core, clean controller-based architecture
- Frontend: React + TypeScript with Fluent UI v8, consistent component patterns
- Data integrity: Strict parent-child validation for production, flexible migration for D365 import
- Total calculation accuracy: Single-pass calculation without tax double-counting
- Component reuse: StandardLookupField, StandardPhoneField, StandardAddressFields, StandardFormHeader used throughout

## Previous Changes (October 27, 2025)

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
