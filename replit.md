# Millennium Timber Roof ERP

## Overview
Millennium Timber Roof ERP is a specialized, web-based ERP system for timber roofing contractors, designed to manage complex projects from quotation to stock management. It integrates with Mitek Pamir design software and supports hierarchical project structures, dynamic quotation generation, and sophisticated stock handling for diverse client types (homeowners, contractors, developers). The system aims to streamline business operations, improve efficiency in material calculations, and provide comprehensive project workflow management.

## User Preferences
Preferred communication style: Simple, everyday language.
Technology stack preference: React + Fluent UI v8 for modern, Microsoft-style interface
Architecture preference: Clean separation with ASP.NET Core Web API backend and React frontend

## Recent Changes
- **Millennium Entities Implementation Complete (Oct 11, 2025)**:
  - **Backend API**: All 11 custom Millennium entities fully implemented with Clean Architecture
    - Entity models for all 11 entities with proper D365 field mappings (Designer, SaleRepresentative, Vehicles, Employee, QuoteMRoofing, Tender, PricingCalculation, InstallationProgress, Production, Logistics, Delivery)
    - Complete DTO layer with PascalCase properties that serialize to camelCase JSON
    - API controllers with full CRUD operations for all 11 entities
    - SQLite database with EF Core schema matching D365 structure
    - All controllers operational with 0-1ms query performance
  - **Frontend UI**: React pages for all 11 Millennium entities
    - TypeScript interfaces aligned with backend DTOs (198 properties across 11 entities)
    - Fluent UI pages with DetailsList grids, search, sorting, and CRUD operations
    - Proper field name mapping (orderNo, deliveryNo, jigStart, employeeNo, etc.)
    - Navigation menu organized into logical sections (CRM, Sales & Quotes, Operations, Resources)
  - **Data Migration Utility**: Python utility for D365 to ERP data migration
    - Comprehensive 206-field mapping table covering all 11 entities
    - Correct D365 entity set names (cr694_logisticses, cr694_dispatches, etc.)
    - Fixed primary key mappings (cr694_vehicleid, cr694_employeeid, activityid)
    - Transform logic converts D365 fields to correct camelCase format for ASP.NET binding
    - Ready for production data import from Dynamics 365
  - **End-to-End Testing**: Verified full system functionality
    - Both workflows running successfully (Frontend on port 5000, WebAPI on port 8000)
    - Production page displaying test data correctly
    - API communication working (Frontend → Backend → Database)
    - All Millennium pages operational and error-free
- **Dynamics 365 ExtractSpec Solution Analysis (Oct 11, 2025)**:
  - **Solution Discovery**: Successfully identified and extracted ExtractSpec solution (v1.0.0.1) containing all Millennium Roofing customizations
  - **Complete Metadata Extraction**: Retrieved full schema for 115 entities (11 custom Millennium + 104 D365 standard)
  - **Component Analysis**: Documented 388 total components including 177 attributes, 67 relationships, 5 web resources, 1 plugin, 1 workflow
  - **Custom Entities Identified**:
    - Delivery (cr694_dispatch): 138 fields, 143 relationships - most complex entity for dispatch management
    - Production (cr694_production): 78 fields, 34 relationships - manufacturing & production scheduling
    - Tender (cr694_tender): 67 fields, 26 relationships - tender/bid management with pricing
    - Logistics (cr694_logistics): 65 fields, 30 relationships - supply chain & logistics planning
    - Employee (cr694_drivers): 65 fields, 55 relationships - driver/employee management with licensing
    - Vehicles (cr694_vehicles): 46 fields, 25 relationships - fleet management
    - Pricing Calculation (cr694_pricingcalculation): 45 fields, 16 relationships - tender cost calculations
    - Designer (cr694_designer): 41 fields, 21 relationships - designer/estimator personnel
    - Sale Representative (cr694_salerepresentative): 41 fields, 21 relationships - sales team & territories
    - Quote - MRoofing (cr694_quotemroofing): 36 fields, 19 relationships - custom roofing quotes
    - Installation Progress (cr694_installationprogress): 35 fields, 17 relationships - project milestone tracking
  - **Standard D365 Entities**: Account (199 rels), Contact (168 rels), Quote (88 rels), Order (92 rels), Product (75 rels), Email, Appointment
  - **Integration Tools**: OAuth 2.0 authentication with MSAL, Dataverse API schema inspector, metadata extraction utilities
  - **Migration Planning**: Generated comprehensive analysis reports with database mapping recommendations and phased migration strategy
  - **Files Generated**: ExtractSpec_FULL_METADATA.json, ExtractSpec_ANALYSIS.md, millennium_roofing_schema.json
- **Header and Sidebar Redesign (Oct 11, 2025)**:
  - **Prominent Header**: Increased header height to 60px with larger logo (48px), bold title (20px/700 weight), and subtle shadow for visual prominence
  - **Sidebar Styling**: Changed from Carolina Blue to light gray (#f3f2f1) with black text (#323130) for better readability
  - **Group Headings**: Reduced sidebar section headings to 12px uppercase text in gray (#605e5c), making them proportionally smaller than header
  - **Professional Color Scheme**: Carolina Blue (#59AAD5) reserved for header and selected items, creating clear visual hierarchy
- **Grid Container & Sorting (Oct 11, 2025)**:
  - **Horizontal Scrolling**: Wrapped grid in container with overflow-x: auto to prevent infinite width expansion when columns are resized
  - **Column Sorting**: Implemented full sorting functionality with visual indicators (up/down arrows) on column headers
  - **Advanced Sort Logic**: Handles null/undefined values correctly, applies secondary sort by accountName for deterministic ordering
  - **Type-Safe Sorting**: Properly sorts strings (localeCompare), numbers (numeric comparison), and booleans
- **Proxy Connection Fix (Oct 11, 2025)**:
  - Fixed frontend-backend connection issue by updating Vite proxy from localhost to 127.0.0.1:8000
  - Resolved "Internal Server Error" that was preventing API communication
- **Custom Horizontal Tab Navigation (Oct 11, 2025)**:
  - Implemented custom horizontal tab system using DefaultButton components in Stack horizontal layout
  - Abandoned Fluent UI Pivot component due to CSS conflicts causing vertical display
  - Tabs display horizontally: Basic Information | Contact Information | Address & Location | Financial Information
  - Active tab styling: Blue background (#0078d4), white text, bold font weight (600)
  - Inactive tabs: Transparent background, gray text, hover effect with light gray background
  - Conditional rendering based on activeTab state for tab content sections
  - Power Apps-style interface with professional horizontal navigation
- **React + Fluent UI Migration - Phase 1 (Oct 6, 2025)**:
  - **Tasks 3-7 Complete**: Full-stack application with backend API, React frontend, and complete CRUD functionality
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
  - **CRUD Forms** (Task 7):
    - UserForm: Fluent UI Panel with all user fields (user code, name, email, phone, department, position, role, hire date, address, emergency contacts, active status)
    - CustomerForm: Full-screen form with horizontal tabs for sections (Basic Information, Contact Information, Address & Location, Financial Information)
    - DeleteDialog: Reusable confirmation dialog for delete operations
    - Selection handling: Edit/Delete buttons enabled only when row selected
    - Full CRUD verified: Create → Read → Update → Delete for Users and Customers
    - Forms pre-populate correctly when editing
    - Error handling and loading states throughout
  - **Security Fix**: Upgraded Npgsql from 8.0.0 to 8.0.5 (patched GHSA-x9vc-6hfv-hg8c high-severity vulnerability)
  - **Architecture**: Clean monorepo structure with /backend (ASP.NET Core 8 Web API + SQLite) and /frontend (Vite + React 18 + TypeScript + Fluent UI v8)
- **Power Apps-Style Grid Features (Oct 6-11, 2025)**:
  - **View Management**: Save, edit, delete custom views with column visibility and filter configurations
  - **Advanced Filtering**: FilterBuilder component with AND/OR logic, multiple operators (equals, contains, begins with, etc.)
  - **Global Search**: SearchBox that searches across all columns including related entities (e.g., CompanyType.name)
  - **Column Management**: Show/hide columns, reorder with up/down buttons, persist preferences per view
  - **Excel Export/Import**: Full Excel integration for data import/export
  - **Responsive Grid**: Column resizing with drag handles, horizontal scroll container, sorting with visual indicators
  - **Professional Styling**: Carolina Blue theme, proper loading states, error handling, Power Apps-like interface

## System Architecture

### Core Principles
The system is built as a modern Single-Page Application (SPA) using React with Fluent UI components for a professional Microsoft-style interface. The frontend communicates with an ASP.NET Core Web API backend that uses SQLite for data storage. The architecture prioritizes clean separation of concerns, type safety with TypeScript, and reusable component patterns.

### Frontend
- **Framework**: React 18.2.0 with TypeScript for type safety
- **UI Library**: Fluent UI v8 (Microsoft's official React component library)
- **Routing**: React Router v7 for client-side navigation
- **State Management**: React hooks (useState, useEffect) with local component state
- **Styling**: Fluent UI theme with Carolina Blue (#59AAD5) brand color
- **Key Components**:
  - Layout: Header (60px height, prominent branding) + Sidebar (light gray with black text) + Content area
  - DetailsList: Power Apps-style data grid with sorting, filtering, column management, Excel export/import
  - Pivot: Horizontal tabs for form sections
  - CommandBar: Action buttons for CRUD operations
  - Panel/Dialog: Modal forms for create/edit operations

### Backend Integration
- **API**: ASP.NET Core 8 Web API
- **Database**: SQLite with Entity Framework Core
- **Architecture**: Clean layered structure (Controllers → Services → Data)
- **DTOs**: Separate Create/Update/Read data transfer objects
- **CORS**: Configured for localhost:5000 (frontend origin)
- **Port**: Backend runs on port 8000, frontend proxies /api requests

### Key Features and Modules
- **Customer Management**: Full CRUD with company type relationships, contact information, location (Google Maps), financial data
- **User Management**: Employee records with roles, departments, contact details
- **Company Types**: Configurable lookup tables for customer categorization
- **View Management**: Save custom grid views with column visibility and filters
- **Advanced Filtering**: Build complex filter expressions with AND/OR logic
- **Global Search**: Search across all entity fields including related data
- **Excel Integration**: Import/export customer data

## External Dependencies

### Core Technologies
- **React 18.2.0**: Frontend UI framework
- **Fluent UI v8.123.6**: Microsoft's React component library
- **TypeScript**: Type-safe development
- **Vite**: Build tool and dev server
- **React Router v7**: Client-side routing

### Backend Services
- **Primary API**: `http://127.0.0.1:8000/api` (ASP.NET Core Web API)
- **Database**: SQLite with Entity Framework Core
- **Authentication**: To be implemented (JWT planned)

### Third-Party Integrations
- **Microsoft Dynamics 365**: OAuth 2.0 integration with Dataverse API for schema extraction and data migration
  - Instance: https://org4fc6bdc5.crm4.dynamics.com
  - Publisher Prefix: cr694_ (Millennium Roofing custom entities)
  - ExtractSpec Solution: 115 entities with complete metadata extraction
  - Authentication: MSAL (Microsoft Authentication Library) with client credentials flow
  - Tools: dynamics365_integration/auth.py, schema_inspector.py, inspect_solution.py
- **Google Maps Platform**: Places API (autocomplete), Maps JavaScript API (interactive maps), Geocoding API (coordinate conversion)
- **SheetJS/xlsx**: Excel file parsing and generation
- **Mitek Pamir**: CAD software for importing design data (legacy integration from previous version)

### Browser APIs
- **Fetch API**: HTTP requests to backend
- **Local Storage**: View preferences and user settings
- **Geolocation API**: GPS positioning (in legacy features)
