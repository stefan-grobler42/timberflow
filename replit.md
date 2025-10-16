# Millennium Timber Roof ERP

## Overview
Millennium Timber Roof ERP is a specialized, web-based ERP system for timber roofing contractors. Its purpose is to manage complex projects from quotation to stock management, integrating with Mitek Pamir design software. The system supports hierarchical project structures, dynamic quotation generation, and sophisticated stock handling for diverse client types, aiming to streamline business operations, improve material calculation efficiency, and provide comprehensive project workflow management.

## User Preferences
Preferred communication style: Simple, everyday language.
Technology stack preference: React + Fluent UI v8 for modern, Microsoft-style interface
Architecture preference: Clean separation with ASP.NET Core Web API backend and React frontend

## System Architecture

### Core Principles
The system is built as a modern Single-Page Application (SPA) using React with Fluent UI components for a professional Microsoft-style interface. The frontend communicates with an ASP.NET Core Web API backend that uses SQLite for data storage. The architecture prioritizes clean separation of concerns, type safety with TypeScript, and reusable component patterns.

### Frontend
- **Framework**: React 18.2.0 with TypeScript
- **UI Library**: Fluent UI v8
- **Routing**: React Router v7 for client-side navigation
- **Styling**: Fluent UI theme with Carolina Blue (#59AAD5) brand color
- **Layout**: Prominent Header (60px), light gray Sidebar, and Content area
- **Key Components**: DetailsList (Power Apps-style data grid with sorting, filtering, column management, Excel export/import), Pivot (horizontal tabs), CommandBar (action buttons), Panel/Dialog (modal forms).

### Backend Integration
- **API**: ASP.NET Core 8 Web API
- **Database**: SQLite with Entity Framework Core
- **Architecture**: Clean layered structure (Controllers → Services → Data)
- **DTOs**: Separate Create/Update/Read data transfer objects
- **CORS**: Configured for frontend origin
- **Port**: Backend runs on port 8000, frontend proxies /api requests

### Key Features and Modules
- **Project Management**: Support for hierarchical project structures.
- **Quotation Management**: Dynamic quotation generation.
- **Stock Management**: Sophisticated handling for diverse materials.
- **Customer Management**: Full CRUD operations, company type relationships, contact information, location, financial data.
- **User Management**: Employee records with roles, departments, contact details.
- **CRM Features**: PeekView for related record previews, SubGrid for related records, LookupField with typeahead search and inline record creation.
- **View Management**: Save custom grid views with column visibility and filters.
- **Advanced Filtering**: Complex filter expressions with AND/OR logic.
- **Global Search**: Search across all entity fields including related data.
- **Excel Integration**: Import/export customer data.
- **Horizontal Tab Navigation**: Custom tab system for form sections, mimicking Power Apps style.

### UI/UX Decisions
- Modern, Microsoft-style interface using Fluent UI.
- Prominent header with clear branding.
- Professional color scheme with Carolina Blue for branding and selected items, light gray for sidebar for readability.
- Power Apps-style grid features including responsive design, column resizing, and advanced filtering.

## External Dependencies

- **React 18.2.0**: Frontend UI framework.
- **Fluent UI v8.123.6**: Microsoft's React component library.
- **TypeScript**: For type-safe development.
- **Vite**: Build tool and dev server.
- **React Router v7**: Client-side routing.
- **ASP.NET Core 8 Web API**: Backend framework.
- **SQLite with Entity Framework Core**: Database and ORM.
- **Microsoft Dynamics 365**: OAuth 2.0 integration with Dataverse API for schema extraction and data migration (using MSAL).
- **Google Maps Platform**: Places API, Maps JavaScript API, Geocoding API.
- **SheetJS/xlsx**: Excel file parsing and generation.
- **Mitek Pamir**: CAD software for design data integration.