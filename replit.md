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

## Module Structure

### General Module
- Customer management with full contact details
- Contact management with relationship tracking

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
- **Component System**: Separate JavaScript classes for each major feature (PamirImport, QuoteBuilder, StockSelector, FormulaEngine)
- **State Management**: Centralized application controller (MillenniumERP class) managing component lifecycle and inter-component communication
- **File Handling**: Client-side file parsing utilities supporting Excel, JSON, CSV, and text formats

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
- **Mitek Pamir**: CAD software integration for importing design variables and material calculations
- **Excel/Spreadsheet Processing**: Client-side Excel file processing for stock imports and data exchange
- **Browser APIs**: File API for drag-and-drop functionality and FileReader for client-side file processing

### Development Dependencies
- **Modern Browser APIs**: FileReader, Fetch API, Local Storage for offline capabilities
- **JavaScript ES6+**: Modern JavaScript features including classes, async/await, and modules
- **CSS3**: Advanced styling features including custom properties (CSS variables) and animations