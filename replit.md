# Millennium Timber Roof ERP

## Overview
Millennium Timber Roof ERP is a specialized, web-based ERP system for timber roofing contractors, designed to manage complex projects from quotation to stock management. It integrates with Mitek Pamir design software and supports hierarchical project structures, dynamic quotation generation, and sophisticated stock handling for diverse client types (homeowners, contractors, developers). The system aims to streamline business operations, improve efficiency in material calculations, and provide comprehensive project workflow management.

## User Preferences
Preferred communication style: Simple, everyday language.
Technology stack preference: Microsoft stack (ASP.NET Core, C#, Razor Views)
Architecture preference: Clean MVC pattern with proper separation of concerns for team collaboration

## Recent Changes
- **Complete Microsoft Stack Rebuild (Jan 27, 2025)**: Completely rebuilt application using pure Microsoft stack (ASP.NET Core MVC, C#, Razor Views) as a true single-page application. No page navigation - everything loads dynamically in the same page.
- **Database Integration Completion (Sept 26, 2025)**: Fully completed database integration for all core APIs:
  - **Customer API**: Converted from mock data to full PostgreSQL database integration with complete CRUD operations
  - **Users API**: Database-driven user management with sales representative lookup functionality
  - **Lookups API**: Complete settings management for company types, account types, and other configurable lists
  - **Security Hardening**: Removed unsafe TrustServerCertificate settings from all database connections
  - **Sample Data**: Added realistic customer records (ABC Construction, XYZ Developers, Smith Family Home) for testing
- **Customer Module Implementation (Jan 27, 2025)**: Fully implemented Customer module with:
  - DataTables grid with sorting, paging, search
  - Consolidated action bar with all controls (New, Edit, Delete, Filter, Export, Import)
  - Searchable lookup fields with type-to-filter and hourglass dialog for full browsing
  - Google Maps integration for addresses with autocomplete, mini interactive map, and current location support
  - ZAR currency fields with 15% default VAT rate
- **Grid Enhancement (Sept 29, 2025)**: Enhanced all data grids with professional column resizing:
  - Universal column resizing functionality across Customer, Users, and Settings grids
  - Fixed-width grid containers that maintain layout boundaries during column resizing
  - Internal horizontal scrolling when columns exceed container width
  - Proper pagination (25 records per page) with streamlined controls
  - Removed redundant DataTable controls for cleaner interface
- **Module Enhancements (Sept 30, 2025)**: Comprehensive updates to Customer, Users, and Settings modules:
  - **Customer Module Enhancements**:
    - Added company information section to Contact tab (Phone, Email, Website)
    - Implemented Primary Contact lookup field with details display
    - Enhanced Additional Contacts grid with Designation column
    - Added address display fields (Street, Suburb, Postal Code, Province) that auto-populate from Google Maps selections
    - Renamed "Status & Relationship" tab to "Financial Information" with updated icon
    - Removed Customer Status field from Basic Information tab (now only in Financial Information)
  - **Users Module Complete Implementation**:
    - Created full CRUD forms with all employee fields (First Name, Last Name, Email, Phone, Department, Position, Role, Hire Date, Address, Emergency Contact, Emergency Phone)
    - Implemented role-based field with User, Sales Representative, Manager, and Administrator options
    - Added department dropdown with Sales, Operations, Finance, Administration, and IT options
    - Comprehensive list view with action bar and DataTable grid
    - Full save/edit/delete/save-and-new functionality
  - **Settings Module Forms**:
    - Created modal-based CRUD forms for Company Types (Code, Name, Description, Sort Order, Active status)
    - Created modal-based CRUD forms for Account Types (Code, Name, Description, Sort Order, Active status)
    - Side-by-side layout with separate grids for each lookup table
    - Complete create/edit/delete functionality with validation
  - **Responsive Design Improvements**:
    - Enhanced flex-based layout for dynamic screen resizing
    - Added breakpoints for tablets (992px), mobile (768px), and small mobile (576px)
    - Improved sidebar behavior on mobile with fixed overlay
    - Better padding and typography scaling across different screen sizes

## System Architecture

### Core Principles
The system is built as a Single-Page Application (SPA) with a modular, component-based frontend. It adheres to a "safety-first" development approach, prioritizing backward compatibility and gradual migration of features. A core principle is the centralization of system defaults (`system/defaults.js`) to ensure universal standards for UI components, functionality, and brand consistency across all modules. This includes standardized behaviors for data grids, lookup fields, map integrations, and an auto-save pattern.

### Frontend
- **Frameworks**: Bootstrap 5 for responsive design, customized with CSS for timber industry theming.
- **Component Model**: Vanilla JavaScript with dedicated classes for features like PamirImport, QuoteBuilder, and EnhancedLocationField.
- **State Management**: Managed by a central `MillenniumERP` class for component lifecycle and communication.
- **UI/UX Decisions**:
    - **Color Palette**: Official brand colors (Carolina Blue #59AAD5, Middle Blue #54C3D6, Black Olive #464746, Raisin Black #231f20) and typography (Roboto font family) are applied system-wide.
    - **Navigation**: Universal HeaderBar with global search and contextual actions, alongside a persistent sidebar navigation (AppShellV2).
    - **Data Entry**: Keyboard-driven interface with searchable lookup fields replacing dropdowns, and tab navigation support.
    - **Forms**: Universal auto-save functionality with change detection and undo capability, eliminating explicit save/cancel buttons.
    - **Data Grids**: Enterprise-grade component with sorting, column visibility, multi-select, Excel export, and persistent resizing.
    - **Location Handling**: Universal `EnhancedLocationField` component integrating Google Maps for address autocomplete, mini-map display, interactive pin dropping, and GPS "Use My Location" functionality.

### Backend Integration
- **API**: RESTful API layer interacting with an existing .NET backend hosted at `cloud-mroofing.co.za`.
- **Authentication**: Session-based authentication.

### Key Features and Modules
- **Project & Quote Management**: Hierarchical project structure with support for multiple client types, revision tracking, and dynamic quotation generation.
- **Customer Management**: Three-tier workflow (Prospect → Confirmed Customer → Account Review) with approval tracking, contact management, and integrated location handling.
- **Stock Management**: Currently a placeholder ("Coming Soon") after a complete removal of the previous module. A new architecture for stock management is planned.
- **Formula Engine**: Custom parser for dynamic calculations using timber-specific functions and Pamir-extracted variables.
- **File Processing**: Client-side parsing for Excel, JSON, CSV, and text files, with specialized parsers for Mitek Pamir export data.

## External Dependencies

### Core Technologies
- **Bootstrap 5**: Frontend UI framework.
- **Font Awesome 6**: Icon library.
- **SheetJS/xlsx**: For Excel file parsing and manipulation.

### Backend Services
- **Primary API**: `https://cloud-mroofing.co.za/api` (main .NET backend).
- **Authentication Service**: Existing .NET infrastructure for session-based user management.
- **File Storage**: For project documents and attachments.

### Third-Party Integrations
- **Google Maps Platform**: Includes Places API (autocomplete), Maps JavaScript API (interactive maps), and Geocoding API (coordinate conversion).
- **Mitek Pamir**: CAD software for importing design data and material calculations.

### Browser APIs
- **FileReader, Fetch API, Local Storage**: For client-side file processing and data persistence.
- **Geolocation API**: For GPS positioning.