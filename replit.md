# Millennium Timber Roof ERP

## Overview
Millennium Timber Roof ERP is a specialized, web-based ERP system for timber roofing contractors. It comprehensively manages projects from quotation to stock, integrating with Mitek Pamir design software. The system supports hierarchical project structures, dynamic quotation, and sophisticated stock handling to streamline operations, improve material calculation, and provide an all-encompassing project workflow management solution. The project aims to enhance market potential and operational ambitions for timber roofing contractors.

## User Preferences
Preferred communication style: Simple, everyday language.
Technology stack preference: React + Fluent UI v8 for modern, Microsoft-style interface
Architecture preference: Clean separation with ASP.NET Core Web API backend and React frontend

## System Architecture

### Core Principles
The system is a modern Single-Page Application (SPA) using React with Fluent UI for a professional Microsoft-style interface. The frontend communicates with an ASP.NET Core Web API backend using PostgreSQL for data storage. The architecture emphasizes clean separation of concerns, type safety with TypeScript, and reusable component patterns.

### UI/UX Decisions
-   **Frontend Framework**: React with TypeScript, Fluent UI v8 for a professional Microsoft-style interface.
-   **Design**: Modern, Microsoft-style interface with a professional color scheme (Carolina Blue for branding). Power Apps-style grid features (responsive design, column resizing, advanced filtering). D365-style forms with Google Maps integration (mini maps, autocomplete, draggable markers) and functional subgrids. Consistent tab animations.
-   **Navigation**: Consistent header, sidebar, and content area with a Microsoft-style navigation structure (e.g., My Work, Customers, Sales, Procurement, Dispatch, Installation, Settings).
-   **Timezone Strategy**: System-wide UTC storage in PostgreSQL with conversion to and from 'South Africa Standard Time' (SAST, GMT+2) at application ingress/egress points using `TimeZoneInfo` on the backend and Luxon on the frontend.

### Technical Implementations
-   **Backend**: ASP.NET Core 8 Web API, layered structure (Controllers → Services → Data), separate DTOs, PostgreSQL with Entity Framework Core (Npgsql driver).
-   **Database**: PostgreSQL is the primary database, replacing SQLite for production persistence.
-   **Production Planner**: Three-level hierarchical planner (Month → Week → Day views) with team-based calendar, drag-and-drop allocation, capacity indicators, and visual differentiation for completed jobs.
-   **System Settings**: Configuration module for Financial Year, Working Hours (Office/Factory Staff), and Timezone management.
-   **Order Form Summary**: Reactive workflow timeline (Quote Created to Order Complete) dynamically updating based on form data, responsive two-column layout.
-   **Form Enhancements**: `cleanFormData` function for robust handling of nullable fields and team allocations.
-   **Data Migration**: Python script for schema-aware data migration from Microsoft Dynamics 365 to PostgreSQL, preserving D365 GUIDs and ensuring data integrity.

### Feature Specifications
-   **ERP Modules**: Comprehensive modules including Activities, Installations, Trips, Loads, Procurement, Suppliers, Sub-Contractors, Accounts, Contacts, Quotes, Orders, Tenders, Products, Employees, Designers, Sales Representatives, Vehicles.
-   **View Management**: Custom grid views with `localStorage` persistence, default view support, and advanced filtering with `FilterBuilder`.
-   **Quote Management**: Dynamic generation, D365-style panel forms, multi-tab layout, line item CRUD subgrids with automatic total recalculation.
-   **CRM Features**: PeekView, SubGrid, LookupField with typeahead search, duplicate detection with configurable rules and merging.
-   **Project/Stock Management**: Hierarchical project structures and sophisticated stock handling.

## External Dependencies

-   **React**: Frontend UI framework.
-   **Fluent UI v8**: Microsoft's React component library.
-   **TypeScript**: For type-safe development.
-   **Vite**: Build tool and dev server.
-   **React Router**: Client-side routing.
-   **ASP.NET Core 8 Web API**: Backend framework.
-   **PostgreSQL with Entity Framework Core**: Production database and ORM (Npgsql driver).
-   **Microsoft Dynamics 365**: OAuth 2.0 integration for data migration.
-   **Google Maps Platform**: Places API, Maps JavaScript API, Geocoding API for address management.
-   **SheetJS/xlsx**: For Excel file parsing and generation.
-   **Mitek Pamir**: CAD software for design data integration.
-   **Luxon**: JavaScript library for timezone-aware date/time handling on the frontend.