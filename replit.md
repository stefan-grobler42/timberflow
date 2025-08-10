# Millennium Timber Roof ERP

## Overview

Millennium Timber Roof ERP is a specialized construction industry ERP system designed for timber roofing contractors. The system focuses on hierarchical project management, complex quotation generation, and stock management with tight integration to Mitek Pamir design software. It handles sophisticated business scenarios from simple homeowner projects to large-scale developer contracts with multiple building types, quantities, options, and revisions.

The application features a modern web-based interface with specialized modules for importing Pamir design data, building dynamic quotes with complex hierarchies, managing complex stock items with variable attributes, and calculating material quantities using custom formulas. The system implements a comprehensive project workflow supporting three client types: homeowners (single building/type), contractors (multiple buildings/types), and developers (multiple buildings/types/quantities) with full revision tracking and logical numbering systems.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 2025)

- Implemented comprehensive project management system with hierarchical structure
- Added CRM functionality requirements: Tasks, Mail, Phone Call tracking
- System-wide search functionality requirement identified
- Module restructure: General (Customer, Contact), Sales (Project, Quote, Tender, Order), Stock
- **Complete Millennium Roofing CI Implementation**: Applied official brand colors, typography, and styling throughout application
- **Brand Color Palette**: Carolina Blue (#59AAD5), Middle Blue (#54C3D6), Black Olive (#464746), Rasin Black (#231f20) with monochromatic support colors
- **Typography**: Implemented Roboto font family as per corporate identity guidelines
- **Logo Integration**: Added stylized SVG logo representation in navbar with proper brand colors
- Enhanced Business Central UI design with professional look and feel
- Collapsible Pinned and Recent sections with 3-item limit for Recent items
- Improved navigation with better spacing, colors, and hover effects
- Fixed stock management loading issues with non-blocking initialization and improved rendering
- Dashboard personalization: "My Dashboard" and "My Activities" 
- Settings redesign: Gear icon opening right-side panel instead of dropdown
- Employee management module requirement added
- **Browser Cache Resolution**: Identified and resolved browser caching issues preventing UI updates from displaying
- **Deployment Configuration**: Fixed Express.js server setup with proper health checks and port 5000 configuration
- **Stock Items Interface**: Implemented comprehensive stock management grid with toolbar, search, filters, and sample data
- **Sidebar Layout Enhancement**: Fixed navigation sidebar to prevent text wrapping and improved responsive layout
- **Stock Grid Features**: Added proper categorization, action buttons, and pagination for all stock item types
- **Single-Page Application (SPA) Implementation**: Restructured stock management to work as true SPA with persistent sidebar navigation
- **In-Panel Content Switching**: Grid and form views now switch within the same container, maintaining sidebar visibility
- **Enhanced Navigation Pattern**: Click item rows → content area switches to form view; save/back → returns to grid with updates
- **Universal Module Pattern**: Established SPA navigation pattern to be applied across all future system modules
- **Settings Tables Module**: Added comprehensive settings tables group for UOM, Item Types, Categories, Company Types, Account Types, and Account Relationships
- **Customer Management System**: Implemented complete customer/account management based on Excel specification with comprehensive field validation and relationship management
- **Lookup Table Integration**: Established foundation for settings tables to support dropdown lookups across all modules
- **Keyboard-Driven Interface**: Implemented searchable lookup fields replacing all dropdowns with type-ahead search functionality
- **Google Maps Integration**: Added address autocomplete with mini-map display and direct Google Maps navigation
- **Enhanced User Experience**: Tab navigation support, arrow key selection, and keyboard-only data entry workflow
- **Universal Lookup Pattern**: Enhanced lookup fields with search buttons implemented across Customer and Stock modules
- **Visual Map Improvements**: Mini-maps now display location pins and visual confirmation when addresses are located
- **Standardized Interface**: All future lookup fields will use searchable input with magnifying glass browse button
- **Address Field Standard**: All address fields include Google Maps autocomplete with mini-map and click-to-navigate functionality
- **Enhanced Location System**: Implemented comprehensive location handling with Google Maps search, interactive pin dropping, and GPS "Use My Location" functionality for mobile users
- **Customer Workflow Management**: Three-tier customer status system (Prospect → Confirmed Customer → Account Review) with approval tracking for financial department coordination
- **Mobile-Friendly GPS Integration**: Field workers can use GPS location detection for marking delivery locations and customer sites
- **Contact Management Enhancement**: Separate contact records linked to customer accounts for better data organization and relationship tracking
- **Standardized Address Fields**: Enhanced location field pattern established as universal standard for all address/location inputs throughout application with Google Maps autocomplete, GPS positioning, interactive pin dropping, and visual confirmation
- **Auto-Save System Implementation**: Universal auto-save functionality deployed across all forms - changes automatically save after 1-second delay, replacing traditional save/cancel buttons with undo functionality for seamless user experience
- **Button Layout Optimization**: Repositioned Undo and Back to List buttons at the top of record forms in grouped button layout for improved accessibility
- **Comprehensive Audit Trail System**: Implemented system-wide audit tracking for all data changes with timestamp, user, change details, and action history across all modules
- **Interactive Spreadsheet Grids**: Created Excel-like interactive grids with inline editing, keyboard navigation, copy/paste functionality, and bidirectional Excel import/export capabilities
- **Universal Grid Component**: InteractiveGrid component provides spreadsheet-like experience with cell selection, row operations, and real-time editing for all data lists
- **Universal Audit System Implementation**: Deployed comprehensive system-wide audit trail system that automatically tracks ALL data changes across ALL modules (current and future)
- **Automatic Audit Tracking**: System monitors form submissions, button clicks, deletions, storage operations, and view switches with full metadata capture
- **Customer Module Stabilization**: Fixed customer management loading issues with robust error handling and graceful component initialization fallbacks

## Module Structure

### General Module
- **Customer Management**: Complete customer lifecycle management with three-tier workflow system
  - Prospect management for initial leads and quote requests
  - Confirmed customer transition with approval tracking
  - Account review process for credit and financial assessment
  - Contact management with relationship tracking and role-based access
  - Enhanced location handling with GPS positioning and interactive maps
  - Quote history and order tracking for performance analysis

### Sales Module  
- Project management (parent record)
- Quote management (sub-record with options/revisions)
- Tender management (sub-record with assemblies)
- Order management (sub-record from quotes/tenders)

### Stock Module
- **Complex Stock Hierarchy**: Three-tier system supporting manufactured items (timber trusses), standard stock items (timber/materials), and service items (labour/transport)
- **Variable Attributes**: Dynamic stock variants for colours, girths, finishes with configurable pricing
- **Composite Tender Rates**: Recipe-based composite items for tender pricing (sheeting + screws + labour + transport)
- **Unit Conversion System**: Automatic conversion between m, m2, ea with cover width calculations for sheeting
- **Flexible BOM System**: Unique BOMs for each manufactured item (timber trusses) linked to Pamir exports
- **Temporary Stock Codes**: 120-day expiring temporary codes for rare/custom items
- **Material Grouping**: Collapsible groups (Roof Trusses > Timber/Plates, Hangers, Bracing, etc.)
- **Tally System**: Interactive quantity/length capture for cut-to-length materials
- **Pamir Integration**: Automatic BOM creation from CSV/Excel exports with variable extraction

### CRM Module
- Task management (calls, emails, meetings)
- Activity tracking and follow-ups
- Lead and opportunity management

## System Architecture

### Frontend Architecture
- **Single-Page Application (SPA)**: Built with vanilla JavaScript using a modular component-based architecture
- **UI Framework**: Bootstrap 5 for responsive design with custom CSS for timber industry theming
- **Component System**: Separate JavaScript classes for each major feature (PamirImport, QuoteBuilder, StockSelector, FormulaEngine, EnhancedLocationField)
- **State Management**: Centralized application controller (MillenniumERP class) managing component lifecycle and inter-component communication
- **File Handling**: Client-side file parsing utilities supporting Excel, JSON, CSV, and text formats
- **Address Field Standard**: Universal EnhancedLocationField component pattern with Google Maps integration, GPS positioning, interactive pin dropping, and type="button" attributes to prevent form submission conflicts

### Backend Integration
- **API Architecture**: RESTful API integration layer with existing .NET backend at cloud-mroofing.co.za
- **Authentication**: Session-based authentication with credential inclusion for cross-origin requests
- **Data Models**: 
  - Project hierarchy: Projects → Quotes/Tenders → Orders
  - Complex stock management with base codes and variable attributes
  - Formula engine for dynamic calculations
  - Import tracking and variable extraction

### Data Management
- **Project Structure**: Hierarchical project management supporting three client types (homeowners, contractors, developers)
- **Quote Management**: Multiple quote variations, revisions, and options per project with logical numbering system
- **Stock Complexity**: Multi-tier stock system supporting manufactured items, standard stock items, and service items
- **Variable Attributes**: Dynamic stock item variants (colors, girths, finishes) with configurable pricing

### Formula Engine
- **Dynamic Calculations**: Custom formula parser supporting mathematical operations, conditional logic, and timber-specific functions
- **Variable Integration**: Seamless integration with Pamir-extracted variables for automated quantity calculations
- **Function Library**: Built-in functions for timber calculations (TRUSS_COUNT, BOARD_FEET, CUBIC_METERS) and standard math operations

### File Processing
- **Multi-Format Support**: Excel (.xlsx, .xls), JSON, CSV, and text file parsing
- **Pamir Integration**: Specialized parsers for Mitek Pamir export data extraction
- **Variable Extraction**: Pattern-based extraction of dimensions, materials, quantities, and grades from design files

## External Dependencies

### Core Technologies
- **Bootstrap 5**: UI component framework and responsive design system
- **Font Awesome 6**: Icon library for user interface elements
- **SheetJS/xlsx**: Excel file parsing and manipulation (implied by Excel support)

### Backend Services
- **Primary API**: https://cloud-mroofing.co.za/api - Main .NET backend for all business operations
- **Authentication Service**: Session-based user management through existing .NET infrastructure
- **File Storage**: Document and plan storage for project files and attachments

### Third-Party Integrations
- **Google Maps Platform**: Comprehensive location services including Places API for address autocomplete, Maps JavaScript API for interactive mapping, and Geocoding API for coordinate conversion
- **Mitek Pamir**: CAD software integration for importing design variables and material calculations
- **Excel/Spreadsheet Processing**: Client-side Excel file processing for stock imports and data exchange
- **Browser APIs**: File API for drag-and-drop functionality, FileReader for client-side file processing, and Geolocation API for GPS positioning

### Development Dependencies
- **Modern Browser APIs**: FileReader, Fetch API, Local Storage for offline capabilities
- **JavaScript ES6+**: Modern JavaScript features including classes, async/await, and modules
- **CSS3**: Advanced styling features including custom properties (CSS variables) and animations