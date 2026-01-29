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
-   **Waterfall Production Planner** (`/waterfall-planner`): Simplified continuous-flow scheduler where jobs span across days seamlessly.
    -   **Continuous Spans**: Jobs flow through available working hours as single continuous units, automatically cascading across days based on duration
    -   **Database Tables**: `JobAllocation` (continuous job spans with start/end dates and times), `TeamDaySettings` (per-team per-day overtime toggles), `JobWorkLog` (daily time tracking)
    -   **Views**: Month → Week → Day drill-down with infinite scrolling; day view shows team columns with allocated jobs
    -   **Overtime Toggles**: Early OT (05:00-07:00) and Late OT (17:00-19:00) per team per day via TeamDaySettings
    -   **Schedule Block Integration**: Blocks for holidays, breakdowns, material shortages integrated into scheduler capacity calculations
    -   **Time Logging**: TimeLoggingPanel component for logging actual work done (start/end times, E-Finks completed, staff assignments, notes)
    -   **Reporting Endpoints**: `/api/jobworklogs/report/team-efficiency` (team performance metrics), `/api/jobworklogs/report/accuracy-analysis` (estimated vs actual E-Finks comparison)
    -   **Key Files**: `frontend/src/pages/WaterfallPlannerPage.tsx`, `frontend/src/domain/waterfallScheduler/`, `backend/MillenniumERP.API/Controllers/JobAllocationsController.cs`, `backend/MillenniumERP.API/Controllers/JobWorkLogsController.cs`
-   **Production Planner**: Three-level hierarchical planner (Month → Week → Day views) with team-based calendar, drag-and-drop allocation, capacity indicators, and visual differentiation for completed jobs.
    -   **Continuous Flow Model** (Jan 2026): Jobs are single continuous blocks that can span multiple days based on their E-Finks duration. No rollover/overflow logic - jobs simply extend past the end of day and continue on subsequent days.
    -   **WIP-First Architecture**: TeamWorkItem table is the single source of truth for all allocated jobs during planning/production phase. Production records are READ-ONLY during planning.
        -   **Production.IsInWip Flag**: Boolean flag on Production table. Set to `true` when job is allocated to a team (WIP created), set to `false` when de-allocated. Unallocated column filters to `WHERE isInWip = false`.
        -   **Read-Only Productions**: Production.NewEstimatedefinks and other planning fields are NEVER modified during allocation, OT toggle, or resize operations. Only WIP.EstimatedEfinks is modified during planning.
        -   **Self-Contained WIP Records**: WIP table stores all display fields directly (orderNumber, customerName, productionName, siteAddress, estimatedEfinks) - no Production join required for rendering.
        -   **Display Field Population**: When allocating a job, display fields are copied from Production to WIP. All modifications happen in WIP only.
        -   **Job IDs**: Production-backed jobs use production ID; WIP-only jobs use "wip-{wipId}" prefix for distinction.
        -   **Completion Write-back**: Only when a job is marked "complete" in WIP should final data (E-Finks, timing, etc.) write back to Production table.
        -   Key WIP fields: `plannedStartMinutes`, `plannedEndMinutes`, `plannedDurationMinutes`, `breakAdjustmentMinutes`, `dayStartMinutes` (nullable), `dayEndMinutes` (nullable), `overtimeEnabled`, `customDurationMinutes`.
    -   **PlannerV2 Domain Module** (`frontend/src/domain/plannerV2/`): Clean, isolated architecture with single-responsibility utilities:
        -   `types.ts`: Core type definitions (JobData, ScheduledJob, ScheduleResult). **Break type uses properties: `name`, `start`, `end`, `duration`** (minutes from midnight).
        -   `constants.ts`: Fallback constants (BUFFER_MINUTES, working hours, breaks) used when no settings configured
        -   `schedulerSettings.ts`: Adapter that converts SystemSettings from database to SchedulerConfig, enabling dynamic scheduling behavior. Maps factory staff working hours, break times, and overtime defaults from System Settings to SchedulerConfig format.
        -   `durationCalculator.ts`: Team-specific EFinks calculation using `calculateEfinksDuration(efinks, teamAverageEfinks)`. Formula: `adjustedMinutes = (efinks * 6.5625) / (teamAverageEfinks / 80)`. Teams with higher average_efinks complete work faster (baseline 80 EFinks/day).
        -   `shiftCalendar.ts`: Working hours and break expansion logic, accepts SchedulerConfig parameter for dynamic configuration
        -   `schedulerEngine.ts`: Basic scheduling with job placement and timing calculations
        -   `continuousFlowAllocator.ts`: Multi-day job allocation with config-driven shift/break handling
    -   **Scheduling Engine**: Sequential job placement starting at 07:00 with mandatory 30-minute gaps between jobs (BUFFER_MINUTES centralized in constants.ts). Break-aware scheduling (tea at 9:00-9:15, lunch at 12:00-12:30, afternoon tea at 14:30-14:45, dinner for overtime at 17:00-17:30).
    -   **Drop Zone Highlighting**: Visual drop indicators snap to valid positions (between jobs, at day start, after last job). Blue line with end circles shows insertion point.
    -   **Immediate Persistence**: All changes (allocations, resizes) are saved immediately to the database via `teamWorkItemService.batchAllocate()` and `batchUpdate()`. No staging - drag/drop and resize operations persist in real-time. UI updates optimistically after successful API calls.
    -   **Team Efficiency**: Duration formula: `adjustedMinutes = (estimatedEFinks * 6.5625) / (teamAverageEfinks / 80)`. Teams with higher average_efinks complete work faster. Calculated at allocation time using PlannerV2.getJobDuration(estimatedEFinks, team.averageEfinks).
    -   **Overtime Toggle**: Per-day overtime setting extends working hours; scheduling engine dynamically adjusts available capacity.
    -   **Schedule Blocks**: Non-job time blocking system for comprehensive schedule management:
        -   Block Types: PublicHoliday, Breakdown, Maintenance, MaterialShortage, GeneralDelay
        -   Visual display on DayView timeline with type-specific colors (light blue for holidays, red for breakdowns, purple for maintenance, yellow for material shortages, gray for delays)
        -   Team-specific blocks (teamId set) or all-teams blocks (teamId null for public holidays)
        -   Full-day toggle for public holidays that auto-sets working hours range
        -   Command bar dropdown with block type pre-selection for quick creation
        -   Click-to-edit with ScheduleBlockPanel form
-   **System Settings**: Configuration module for Financial Year, Working Hours (Office/Factory Staff with Break Times, Overtime Defaults for weekdays and weekends), Timezone, and Production Scheduling (Buffer Between Jobs, Min Job Duration, Duration Rounding, UI Display settings). E-Fink duration is calculated from Team's Maximum E-Finks field rather than a global multiplier.
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
    -   Excludes legacy J23-prefixed orders from the unallocated sidebar
    -   Key files: `dynamics365_integration/incremental_sync.py`, `SyncController.cs`, `DynamicsSyncScheduler.cs`, `syncService.ts`
-   **Unallocated Sidebar Differentiation** (Jan 2026): The Production Planner sidebar now distinguishes between two types of unallocated jobs:
    -   **Ready to Schedule** (green): Productions that exist in the database but haven't been scheduled yet - these are draggable and can be assigned to teams
    -   **Missing Production** (orange): Orders that exist in D365 but don't have a corresponding production record - these are non-draggable and require production creation in D365 first
    -   Uses `sourceType` field on Job interface: 'production' for production-backed jobs, 'order-only' for orders without production records

### Feature Specifications
-   **ERP Modules**: Comprehensive modules including Activities, Installations, Trips, Loads, Procurement, Suppliers, Sub-Contractors, Accounts, Contacts, Quotes, Orders, Tenders, Products, Employees, Designers, Sales Representatives, Vehicles.
-   **View Management**: Custom grid views with `localStorage` persistence, default view support, and advanced filtering with `FilterBuilder`.
-   **Quote Management**: Dynamic generation, D365-style panel forms, multi-tab layout, line item CRUD subgrids with automatic total recalculation.
-   **CRM Features**: PeekView, SubGrid, LookupField with typeahead search, duplicate detection with configurable rules and merging.
-   **Project/Stock Management**: Hierarchical project structures and sophisticated stock handling.

## Deployment Configuration

-   **Deployment Type**: Autoscale (stateless, request-driven)
-   **Build Process**:
    1. Build React frontend with `npm run build:prod` (skips TypeScript checking for incomplete modules)
    2. Copy frontend assets to `backend/MillenniumERP.API/wwwroot/`
    3. Publish .NET backend with `dotnet publish -c Release -o ../../publish`
-   **Run Command**: `dotnet publish/MillenniumERP.API.dll`
-   **Static File Serving**: In production, the .NET backend serves the React SPA from wwwroot using `UseDefaultFiles()`, `UseStaticFiles()`, and `MapFallbackToFile()` for client-side routing
-   **Port Configuration**: Production uses port 5000 (Replit webview), Development uses port 8000 for API
-   **Environment Detection**: Uses `builder.Environment.IsProduction()` to determine port and static file serving behavior

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