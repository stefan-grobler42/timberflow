# Millennium Timber Roof ERP

## Overview
Millennium Timber Roof ERP is a specialized, web-based ERP system for timber roofing contractors, designed to manage complex projects from quotation to stock management. It integrates with Mitek Pamir design software and supports hierarchical project structures, dynamic quotation generation, and sophisticated stock handling for diverse client types (homeowners, contractors, developers). The system aims to streamline business operations, improve efficiency in material calculations, and provide comprehensive project workflow management.

## User Preferences
Preferred communication style: Simple, everyday language.
Technology stack preference: Microsoft stack (ASP.NET Core, C#, Razor Views)
Architecture preference: Clean MVC pattern with proper separation of concerns for team collaboration

## Recent Changes
- **React + Fluent UI Migration - Phase 1 (Oct 6, 2025)**:
  - **Tasks 3-6 Complete**: Full-stack application with backend API and React frontend
  - **Backend API** (Tasks 3-5):
    - SQLite database with EF Core schema (6 tables: users, roles, companies, customers, contacts, activities) at backend/MillenniumERP.API/millennium_erp.db (88KB)
    - Data migrated from PostgreSQL (5 users, 5 companies, 4 customers) using idempotent migration utility
    - 6 API controllers with full CRUD operations (Users, Roles, Companies, Customers, Contacts, Activities)
    - Complete DTO layer with Create/Update/Read DTOs for all entities
    - Navigation properties with proper eager loading (Customer.CompanyType)
    - Query filters (activeOnly, customerId), sorting, logging, error handling, RESTful patterns
    - Running on port 8000 with CORS configured for frontend
    - Build status: Zero errors, zero warnings (production-ready)
  - **React Frontend** (Task 6):
    - Vite + React 18.2.0 + TypeScript running on port 5000
    - Fluent UI v8.123.6 with Nav sidebar, CommandBar header, Stack containers
    - React Router 7.9.3 with client-side navigation and active route highlighting
    - TypeScript types matching all backend DTOs
    - API service layer with fetch wrapper and error handling
    - Pages implemented: Home, Users (with DetailsList grid), Customers (with CompanyType navigation)
    - End-to-end integration verified: Frontend → API → SQLite → Frontend
    - Professional Fluent UI styling with loading states, error messages, and resizable columns
  - **Security Fix**: Upgraded Npgsql from 8.0.0 to 8.0.5 (patched GHSA-x9vc-6hfv-hg8c high-severity vulnerability)
  - **Architecture**: Clean monorepo structure with /backend (ASP.NET Core 8 Web API + SQLite) and /frontend (Vite + React 18 + TypeScript + Fluent UI v8)
- **Radzen.Blazor Grid Integration (Oct 6, 2025)**: Successfully migrated Customer module from jQuery DataTables to Radzen.Blazor DataGrid using hybrid Blazor Server + MVC architecture. Blazor component renders on initial page load and is toggled via CSS show/hide for seamless integration with existing JavaScript features. Other modules (Users, Settings) remain on DataTables for gradual migration.
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
    - Tabbed layout with separate tabs for each lookup table (Company Types and Account Types)
    - Complete create/edit/delete functionality with validation
    - Double-click to edit functionality and refresh buttons for each grid
  - **Responsive Design Improvements**:
    - Enhanced flex-based layout for dynamic screen resizing
    - Added breakpoints for tablets (992px), mobile (768px), and small mobile (576px)
    - Improved sidebar behavior on mobile with fixed overlay
    - Better padding and typography scaling across different screen sizes
- **Grid Enhancements (Sept 30, 2025)**: Comprehensive grid improvements for better usability:
  - **Responsive Grid Behavior**: Removed fixed-width constraints; grids now resize dynamically with screen size changes
  - **Select-All Functionality**: Added select-all checkboxes in header row for all grids (Customer, Users, Company Types, Account Types)
  - **Narrower Checkbox Column**: Reduced checkbox column width from 40px to 30px for better space utilization
  - **Double-Click to Edit**: Implemented double-click functionality on Users and Settings grids (matching Customer grid behavior)
  - **Enhanced DataTables Configuration**: All grids configured with scrollX: true, responsive: true, and autoWidth: false for optimal responsiveness
  - **Column Resize Fix**: Fixed column resize handles to persist across DataTables redraws by hooking into draw.dt event; handles now remain functional after pagination, sorting, and filtering
- **Navigation Redesign (Sept 30, 2025)**: Complete replacement of sidebar with top hamburger menu:
  - **Removed Sidebar**: Completely removed left sidebar navigation (~250px wide) that was problematic on mobile devices
  - **Top Hamburger Menu**: Implemented Microsoft Business Central-style dropdown menu accessible from hamburger icon (☰) in top navbar
  - **Organized Sections**: Menu organized by business sections (CRM, Projects, Inventory, Administration) with visual separators
  - **Full-Width Layout**: Content area now uses 100% screen width, maximizing space for data grids and forms
  - **Mobile-First Design**: Hamburger menu works seamlessly across all screen sizes; no overlay issues or wasted space on mobile
  - **Enhanced UX**: Menu items have hover animations (slide right), active state highlighting, and auto-close after selection

## System Architecture

### Core Principles
The system is built as a Single-Page Application (SPA) with a modular, component-based frontend. It adheres to a "safety-first" development approach, prioritizing backward compatibility and gradual migration of features. A core principle is the centralization of system defaults (`system/defaults.js`) to ensure universal standards for UI components, functionality, and brand consistency across all modules. This includes standardized behaviors for data grids, lookup fields, map integrations, and an auto-save pattern.

### Frontend
- **Frameworks**: Bootstrap 5 for responsive design, customized with CSS for timber industry theming.
- **Component Model**: Vanilla JavaScript with dedicated classes for features like PamirImport, QuoteBuilder, and EnhancedLocationField.
- **State Management**: Managed by a central `MillenniumERP` class for component lifecycle and communication.
- **UI/UX Decisions**:
    - **Color Palette**: Official brand colors (Carolina Blue #59AAD5, Middle Blue #54C3D6, Black Olive #464746, Raisin Black #231f20) and typography (Roboto font family) are applied system-wide.
    - **Navigation**: Top navigation bar with hamburger menu dropdown, organized by business sections (CRM, Projects, Inventory, Administration), providing full-width content area for maximum screen real estate.
    - **Data Entry**: Keyboard-driven interface with searchable lookup fields replacing dropdowns, and tab navigation support.
    - **Forms**: Universal auto-save functionality with change detection and undo capability, eliminating explicit save/cancel buttons.
    - **Data Grids**: Enterprise-grade component with sorting, column visibility, multi-select, Excel export, persistent column resizing, and responsive behavior across all screen sizes.
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