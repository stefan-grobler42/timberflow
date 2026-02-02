# Millennium Timber Roof ERP

## Overview
Millennium Timber Roof ERP is a specialized, web-based ERP system designed for timber roofing contractors. Its core purpose is to manage projects comprehensively, from initial quotation to stock management, and integrate with Mitek Pamir design software. Key capabilities include supporting hierarchical project structures, dynamic quotation generation, and sophisticated stock handling. The system aims to streamline operations, improve material calculation accuracy, and provide an all-encompassing project workflow management solution to enhance market potential and operational efficiency for timber roofing contractors.

## User Preferences
Preferred communication style: Simple, everyday language.
Technology stack preference: React + Fluent UI v8 for modern, Microsoft-style interface
Architecture preference: Clean separation with ASP.NET Core Web API backend and React frontend

## System Architecture

### Core Principles
The system is built as a Single-Page Application (SPA) using React with Fluent UI for a professional, Microsoft-style interface. The frontend communicates with an ASP.NET Core Web API backend, utilizing PostgreSQL for data persistence. The architecture emphasizes a clean separation of concerns, type safety through TypeScript, and reusable component patterns.

### UI/UX Decisions
-   **Frontend Framework**: React with TypeScript, leveraging Fluent UI v8 for a professional Microsoft-style interface.
-   **Design**: Modern, Microsoft-style with a professional color scheme (Carolina Blue for branding). Features include Power Apps-style grids (responsive, resizable columns, advanced filtering), D365-style forms with Google Maps integration (mini maps, autocomplete, draggable markers), functional subgrids, and consistent tab animations.
-   **Navigation**: Consistent header, sidebar, and content areas follow a Microsoft-style navigation structure (e.g., My Work, Customers, Sales, Procurement, Dispatch, Installation, Settings).
-   **Timezone Strategy**: All date/time data is stored in UTC in PostgreSQL. Conversions to and from 'South Africa Standard Time' (SAST, GMT+2) occur at application ingress/egress points using `TimeZoneInfo` on the backend and Luxon on the frontend.

### Technical Implementations
-   **Backend**: ASP.NET Core 8 Web API with a layered architecture (Controllers → Services → Data), separate DTOs, and PostgreSQL managed by Entity Framework Core (Npgsql driver).
-   **Production Planner**: Features a three-level hierarchical planner (Month → Week → Day views) with team-based calendar, drag-and-drop allocation, capacity indicators, and visual differentiation for job statuses.
    -   **Continuous Flow Model**: Jobs are treated as single, continuous blocks that can span multiple days based on their estimated duration.
    -   **WIP-First Architecture**: `TeamWorkItem` table serves as the single source of truth for allocated jobs during planning. Production records are read-only during this phase. Display fields are copied from Production to WIP upon allocation, and modifications occur only within WIP. Final data writes back to Production only upon job completion.
    -   **Scheduling Engine**: Sequential job placement starting at 07:00, including mandatory 30-minute gaps between jobs and break-aware scheduling (tea, lunch, dinner for overtime).
    -   **Immediate Persistence**: All allocation and resize changes are immediately saved to the database.
    -   **Team Efficiency**: Job duration is calculated based on estimated E-Finks and team average E-Finks, allowing teams with higher efficiency to complete work faster.
    -   **Overtime Toggle**: Per-day overtime settings dynamically extend working hours and adjust capacity.
    -   **Schedule Blocks**: Non-job time blocking for public holidays, breakdowns, maintenance, material shortages, and general delays, visualized on the DayView timeline with type-specific colors.
-   **System Settings**: Configuration module for Financial Year, Working Hours (Office/Factory Staff with Break Times, Overtime Defaults), Timezone, and Production Scheduling parameters (Buffer Between Jobs, Min Job Duration, Duration Rounding, UI Display settings).
-   **Order Form Summary**: Reactive workflow timeline (Quote Created to Order Complete) updates dynamically based on form data, presented in a responsive two-column layout.
-   **Data Migration**: Python script for schema-aware data migration from Microsoft Dynamics 365 to PostgreSQL, preserving GUIDs and data integrity.
-   **D365 Incremental Sync**: Automated system to fetch only new records from D365 using OData filters, tracking sync history, and running automatically at midnight SAST. It supports manual refresh and includes concurrency protection. Syncs `salesorder` and `cr694_production` entities.
-   **Unallocated Sidebar**: Differentiates between 'Ready to Schedule' (draggable productions) and 'Missing Production' (non-draggable orders without corresponding production records).
-   **Unallocated Column Date Persistence**: Moving jobs between unallocated columns updates `cr694_productionplanneddate` in the Production table.

### Feature Specifications
-   **ERP Modules**: Includes Activities, Installations, Trips, Loads, Procurement, Suppliers, Sub-Contractors, Accounts, Contacts, Quotes, Orders, Tenders, Products, Employees, Designers, Sales Representatives, Vehicles.
-   **View Management**: Custom grid views with `localStorage` persistence, default view support, and advanced filtering capabilities.
-   **Quote Management**: Dynamic generation, D365-style panel forms, multi-tab layout, and line item CRUD subgrids with automatic total recalculation.
-   **CRM Features**: PeekView, SubGrid, LookupField with typeahead search, and duplicate detection with configurable rules and merging.
-   **Project/Stock Management**: Features hierarchical project structures and sophisticated stock handling functionalities.

## External Dependencies

-   **React**: Frontend UI framework.
-   **Fluent UI v8**: Microsoft's React component library for UI.
-   **TypeScript**: For type-safe development.
-   **Vite**: Build tool and dev server.
-   **React Router**: For client-side routing.
-   **ASP.NET Core 8 Web API**: Backend framework.
-   **PostgreSQL with Entity Framework Core**: Production database and ORM.
-   **Microsoft Dynamics 365**: OAuth 2.0 integration for data synchronization.
-   **Google Maps Platform**: Provides Places API, Maps JavaScript API, and Geocoding API for location-based functionalities.
-   **SheetJS/xlsx**: For Excel file parsing and generation.
-   **Mitek Pamir**: CAD software for design data integration.
-   **Luxon**: JavaScript library for timezone-aware date/time handling on the frontend.