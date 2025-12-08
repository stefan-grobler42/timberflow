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
    -   **WIP Architecture**: TeamWorkItem table is the single source of truth for all allocated jobs. The planner reads from WIP joined with Production metadata via `GET /api/TeamWorkItems/planner` endpoint. Key WIP fields include: `plannedStartMinutes`, `plannedEndMinutes`, `plannedDurationMinutes`, `breakAdjustmentMinutes`, `dayStartMinutes` (nullable), `dayEndMinutes` (nullable), and `overtimeEnabled`. Nullable day fields allow shift config defaults to apply when not explicitly overridden by user.
    -   **PlannerV2 Domain Module** (`frontend/src/domain/plannerV2/`): Clean, isolated architecture with single-responsibility utilities:
        -   `types.ts`: Core type definitions (JobData, StagedChange, StagingState, ScheduleResult)
        -   `constants.ts`: Centralized BUFFER_MINUTES (30), working hours, break definitions
        -   `durationCalculator.ts`: EFinks calculation (multiply by 6.5625, round UP to nearest 15 min, minimum 15 min)
        -   `shiftCalendar.ts`: Working hours (07:00-17:00 base, 07:00-19:00 with overtime), break expansion logic
        -   `schedulerEngine.ts`: Cascade scheduling with queue-based multi-day overflow and 30-day iteration guard
        -   `stagingManager.ts`: In-memory change tracking with staging API (`createStagingState`, `stageChange`, `buildPersistencePayloads`, `buildAuditRecords`)
    -   **Scheduling Engine**: Sequential job placement starting at 07:00 with mandatory 30-minute gaps between jobs (BUFFER_MINUTES centralized in constants.ts). Break-aware scheduling (tea at 9:00-9:15, lunch at 12:00-12:30, afternoon tea at 14:30-14:45, dinner for overtime at 17:00-17:30).
    -   **Rollover Logic**: Jobs exceeding daily capacity trigger rollover dialog (Rollover vs Resize options). Rollovers create linked child jobs on next working day with parent-child relationship tracking (parentProductionId, rolloverSequence).
    -   **Drop Zone Highlighting**: Visual drop indicators snap to valid positions (between jobs, at day start, after last job). Blue line with end circles shows insertion point.
    -   **Cascade Scheduling**: Inserting a job before existing jobs pushes all subsequent jobs forward with automatic rollover creation. Queue-based overflow processing handles multi-day cascading across weeks with 30-day iteration guard. Jobs staged with change types: 'allocate', 'cascade', 'rollover' for tracking.
    -   **Multi-Day Cascade**: When cascaded jobs overflow the current day, they're automatically scheduled on subsequent working days. Partial fits truncate jobs and create rollover segments. Jobs pushed entirely past end of day are fully moved to next available day.
    -   **Global Staging**: All changes (allocations, cascades, rollovers) are staged in-memory using plannerV2.StagingState before persistence. Accept button persists all staged changes across all affected days/weeks/months with batch API calls and comprehensive audit logging.
    -   **React useCallback Dependencies**: Critical pattern - any useCallback that calls another useCallback (e.g., `checkJobOverflow` calling `getBaseDuration`) MUST include the called callback in its dependency array. Failure to do so causes stale closure bugs where the inner callback uses outdated state.
    -   **Chain Management**: Rollover chains have parent-child relationships; segment deletion redistributes time to previous segment.
    -   **Overtime Toggle**: Per-day overtime setting extends working hours; scheduling engine dynamically adjusts available capacity.
    -   **Schedule Blocks**: Non-job time blocking system for comprehensive schedule management:
        -   Block Types: PublicHoliday, Breakdown, Maintenance, MaterialShortage, GeneralDelay
        -   Visual display on DayView timeline with type-specific colors (light blue for holidays, red for breakdowns, purple for maintenance, yellow for material shortages, gray for delays)
        -   Team-specific blocks (teamId set) or all-teams blocks (teamId null for public holidays)
        -   Full-day toggle for public holidays that auto-sets working hours range
        -   Command bar dropdown with block type pre-selection for quick creation
        -   Click-to-edit with ScheduleBlockPanel form
-   **System Settings**: Configuration module for Financial Year, Working Hours (Office/Factory Staff), and Timezone management.
-   **Order Form Summary**: Reactive workflow timeline (Quote Created to Order Complete) dynamically updating based on form data, responsive two-column layout.
-   **Form Enhancements**: `cleanFormData` function for robust handling of nullable fields and team allocations.
-   **Data Migration**: Python script for schema-aware data migration from Microsoft Dynamics 365 to PostgreSQL, preserving D365 GUIDs and ensuring data integrity.
-   **D365 Incremental Sync**: Automated synchronization system that:
    -   Fetches only NEW records from D365 using OData `$filter=createdon gt {last_sync_timestamp}` to avoid re-importing existing data
    -   Tracks sync history in `sync_history` database table with entity name, timestamps, status, records imported, duration, and errors
    -   Runs automatically at midnight South Africa time (SAST, UTC+2) via `DynamicsSyncScheduler` background service
    -   Provides manual "Refresh from Dynamics" button in Production Planner action bar with real-time status feedback
    -   Uses thread-safe concurrency protection to prevent overlapping sync operations
    -   Syncs both `salesorder` and `cr694_production` entities
    -   Key files: `dynamics365_integration/incremental_sync.py`, `SyncController.cs`, `DynamicsSyncScheduler.cs`, `syncService.ts`

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