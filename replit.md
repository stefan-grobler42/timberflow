# Millennium Timber Roof ERP

## Overview
Millennium Timber Roof ERP is a specialized, web-based ERP system designed for timber roofing contractors. Its core purpose is to manage complex projects comprehensively, from initial quotation through to stock management, integrating with Mitek Pamir design software. The system supports hierarchical project structures, dynamic quotation generation, and sophisticated stock handling to streamline business operations, improve material calculation efficiency, and provide an all-encompassing project workflow management solution. The project aims to enhance market potential and operational ambitions for timber roofing contractors.

## Recent Changes
**November 24, 2025 - Production Grid Default View:**
- **Feature**: Set default sort and filter for Production grid to focus on pending work
- **Default Sort**: Order No. (largest to smallest / descending order)
- **Default Filter**: Production Complete = NO (shows only incomplete production records)
- **Purpose**: Grid now defaults to show incomplete production sorted by newest orders first
- **Note**: Users with existing custom views in localStorage will see their saved views; clear browser storage to inherit new defaults

**November 24, 2025 - South Africa Timezone (GMT+2) Implementation:**
- **Architecture**: System-wide timezone strategy using UTC storage with South Africa timezone conversions at all ingress/egress points
- **Backend**:
  - Created UTC DateTime value converters (UtcDateTimeConverter, NullableUtcDateTimeConverter) for Entity Framework Core
  - Converters perform real SAST→UTC conversion using TimeZoneInfo.ConvertTimeToUtc (not just Kind relabeling) to prevent timezone drift
  - Configured AppDbContext with Npgsql.EnableLegacyTimestampBehavior=false to enforce UTC timestamps
  - Created TimezoneService for SAST↔UTC conversions using TimeZoneInfo with 'South Africa Standard Time'
  - Applied UTC converter globally to all DateTime and DateTime? properties via modelBuilder
- **Database**: PostgreSQL stores all timestamps in UTC (timestamp with time zone)
- **Migration Script**:
  - Updated migrate_data.py to parse D365 datetimes with timezone awareness using Python zoneinfo
  - Assumes South Africa timezone (Africa/Johannesburg) if no timezone info present
  - Converts all datetimes to UTC and formats with 'Z' suffix for PostgreSQL compatibility
  - Fixed DateTime.Kind=Unspecified error that caused 99.9% failure rate (2,915/2,918 records failed → 100% success)
- **Frontend**:
  - Installed Luxon library for timezone-aware date handling
  - Created timezoneUtils.ts with comprehensive SAST↔UTC conversion utilities
  - Functions: convertUtcToSast(), convertSastToUtc(), formatUtcAsSast(), displaySastDateTime(), displaySastDate()
  - DatePicker components configured to work in Africa/Johannesburg timezone
- **Data Flow**: User inputs SAST dates → API receives → Convert to UTC → Store in PostgreSQL UTC → Read from DB → Convert to SAST → Display to user in South Africa time

**November 24, 2025 - Production Form Team Allocation Enhancements:**
- **Feature**: Fixed team lookup sources to use distinct lookup tables for three team types
- **Team Lookups**: Picking Team uses Picking_Teams table, Saw Team uses Saws table, Jig Team uses Jigs table
- **UI Layout**: Team selectors in top row with 24px spacing below, individual staff allocation columns beneath for clear visual separation
- **Bug Fix**: Save & New now properly clears all team lookup text and ID fields to prevent inconsistent state
- **cleanFormData**: Extended to handle team ID fields (pickingTeamId, sawId, jigId) for proper null conversion before API submission

**November 24, 2025 - Three-Level Production Planner with Hierarchical Drill-Down:**
- **Feature**: Created staged/stepped Production Planner with Month → Week → Day navigation hierarchy
- **Month View (Default)**: 
  - Shows date cards organized by weeks with total E-Finks per week and per day
  - Vertically stacked jobs (no team columns) for simplified overview
  - Click on week header to drill down to Week View
  - Color-coded booking status: Blue (available), Orange (nearly full 75%+), Red (fully booked 90%+)
- **Week View**:
  - Team-based calendar (3 jig teams) with jobs assigned to specific teams and dates
  - Shows E-Finks capacity per team (90 max per day)
  - Click on day header to drill down to Day View
  - Drag-and-drop job allocation to specific team and date
- **Day View**:
  - 12-hour timeline visualization (07:00-19:00) with side header
  - Working hours integration from System Settings (Factory Staff schedule)
  - Working hours shown in white, non-working hours greyed out
  - Team columns with capacity indicators
  - Jobs displayed as overlay cards on timeline
- **Navigation**: Breadcrumb navigation (Month View / Week View / Day View) with clickable links to navigate back
- **Architecture**: Three separate view components (MonthView, WeekView, DayView) with centralized state management
- **Booking Logic**: Visual indicators for capacity utilization across all views (90 E-Finks max, 90% = fully booked, 75% = nearly full)

**November 24, 2025 - System Settings Module:**
- **Feature**: Added System Settings configuration page with Financial Year, Working Hours, and Timezone management
- **Database**: Created `system_settings` table with key-value storage for configuration data
- **Backend**: 
  - SystemSetting entity with category, description, and JSON value support
  - SystemSettingsController with GET/PUT endpoints
  - Separate DTOs for FinancialYearSettings, WorkingHoursSettings, and TimezoneSettings
  - TimezoneSettings includes timeZoneId, displayName, and utcOffset (default: South Africa GMT+2:00)
- **Frontend**:
  - SettingsPage with tabbed interface (Financial Year, Working Hours, Timezone)
  - Financial Year: Configurable start month/day (default: March 1)
  - Working Hours: Separate configuration for Office Staff and Factory Staff with day-by-day hour ranges
  - Timezone: Dropdown selector with 10 common timezones (default: South Africa Standard Time GMT+2:00)
  - Form validation and default value initialization
- **Navigation**: Added "System Settings" link to sidebar Settings section
- **Data Persistence**: Settings stored in PostgreSQL with upsert logic for updates
- **Timezone Options**: South Africa, UK, Central Europe, US (Eastern/Central/Mountain/Pacific), China, India, Australia Eastern

**November 24, 2025 - Order Form Summary Tab with Reactive Timeline:**
- **Feature**: Enhanced Order Form Summary Tab with responsive two-column layout and dynamic workflow timeline
- **Layout**: Left column (400px fixed width) with form fields, right column (flexible width) with timeline visualization
- **Responsive Design**: Uses Fluent UI `selectors` pattern with @media queries - collapses to single column below 960px screen width
- **Timeline Features**: 
  - 6-stage workflow visualization (Quote Created, Order Placed, Production Started, Dispatch Scheduled, Installation in Progress, Order Complete)
  - Numbered circles (32px) with checkmarks for completed stages, vertical connecting lines, contextual status messages
  - Reactive behavior: Reads from live `formData` so timeline updates immediately when user changes quote linkage or status code
  - Stage-specific colors: Blue (#0078d4) for quote, Green (#107c10) for order, Orange (#d83b01) for production, Teal (#008272) for complete
- **Form Sections**: Order Info, Dates (order/request/fulfill), Status dropdowns, Description textarea, Financial Summary (subtotal/tax/total)
- **Backend Fix**: Added `cleanFormData` function to convert empty date/lookup strings to `undefined` before API submission for nullable fields

**November 21, 2025 - PostgreSQL Migration Completed:**
- **Achievement**: Successfully migrated entire system from SQLite to PostgreSQL for production deployment
- **Data Migrated**: 13,566 D365 records across 28 tables with 100% data integrity
  - Core Data: 1,076 accounts, 683 contacts, 774 quotes, 3,187 sales orders, 37 products
  - Operations: 2,914 production records, 5,000 installation progress, 2,521 logistics, 431 tenders
  - Resources: 74 drivers/employees, 19 vehicles, 11 designers, 18 sales reps
- **GUID Preservation**: All Dynamics 365 GUIDs maintained as primary keys, preserving data relationships
- **Relationship Integrity**: 2,904 production-order links verified (100% success rate), all foreign keys configured
- **Technical Implementation**: 
  - Created migrate_sqlite_to_postgres.py with schema-aware type conversion
  - Automated SQLite TEXT→UUID, INTEGER→BOOLEAN, TEXT→NUMERIC, TEXT→TIMESTAMP conversions
  - Bulk insert optimization (500 rows/batch) for large tables
- **Database Status**: PostgreSQL fully operational, backend API serving data successfully
- **Deployment Ready**: System now supports persistent storage for Replit deployments (SQLite data would be lost on redeploy)

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
-   **Database**: PostgreSQL with Entity Framework Core (Neon-backed, managed by Replit).
-   **Architecture**: Layered structure (Controllers → Services → Data).
-   **Data Transfer**: Separate DTOs for Create/Update/Read operations.
-   **Connection**: Uses Npgsql.EntityFrameworkCore.PostgreSQL with SSL/TLS security.

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
-   **PostgreSQL with Entity Framework Core**: Production database and ORM (Npgsql driver).
-   **Microsoft Dynamics 365**: OAuth 2.0 integration for data migration.
-   **Google Maps Platform**: Places API, Maps JavaScript API, Geocoding API for address management.
-   **SheetJS/xlsx**: For Excel file parsing and generation.
-   **Mitek Pamir**: CAD software for design data integration.