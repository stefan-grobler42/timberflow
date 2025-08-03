# Millennium Timber Roof ERP

## Overview

Millennium Timber Roof ERP is a specialized construction industry ERP system designed for timber roofing contractors. The system focuses on project management, quotation generation, and stock management with tight integration to Mitek Pamir design software. It handles complex quotation scenarios ranging from simple homeowner projects to large-scale developer contracts with multiple building types and quantities.

The application features a modern web-based interface with specialized modules for importing Pamir design data, building dynamic quotes, managing complex stock items with variable attributes, and calculating material quantities using custom formulas. The system is designed to handle the unique challenges of the timber roofing industry, including variable-length materials, composite tender rates, and complex hierarchical project structures.

## User Preferences

Preferred communication style: Simple, everyday language.

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