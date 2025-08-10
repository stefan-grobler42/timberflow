# Millennium Timber Roof ERP

## Overview
Millennium Timber Roof ERP is a specialized, web-based ERP system for timber roofing contractors, designed to manage complex projects from quotation to stock management. It integrates with Mitek Pamir design software and supports hierarchical project structures, dynamic quotation generation, and sophisticated stock handling for diverse client types (homeowners, contractors, developers). The system aims to streamline business operations, improve efficiency in material calculations, and provide comprehensive project workflow management.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
- **Charter Implementation (Aug 10, 2025)**: Successfully implemented Modular App Charter architecture with platform loader system, charter-compliant component loading, and proper module separation following import rules (Platform components vs business modules).

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