# Timberflow ERP

## Overview
Timberflow is a specialized, web-based ERP system for timber roofing contractors, designed to manage complex projects from quotation to stock management. It integrates with Mitek Pamir design software and supports hierarchical project structures, dynamic quotation generation, and sophisticated stock handling for diverse client types.

## Features

### Core Modules
- **Customer Management** - Three-tier workflow (Prospect → Confirmed Customer → Account Review)
- **Products Management** - Inventory and product catalog with pricing
- **Project Management** - Hierarchical project structure with revision tracking
- **Quote Builder** - Dynamic quotation generation with material calculations

### Modern Architecture
- **Modular Design** - Component-based frontend with clear separation of concerns
- **Universal Header Bar** - Contextual actions and global search
- **Command Registry** - Page-specific actions in header bar
- **Safety-First Development** - Backward compatibility with gradual migration strategy

### Technology Stack
- **Frontend**: Vanilla JavaScript, Bootstrap 5, Font Awesome 6
- **Backend**: Node.js/Express (development), .NET (production)
- **Database**: PostgreSQL with Drizzle ORM
- **Integrations**: Google Maps API, Mitek Pamir CAD software

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Google Maps API key (for location features)

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/timberflow.git
cd timberflow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and API keys

# Start development server
npm start
```

### Development
```bash
# Start the development server
npm start

# Database migrations
npm run db:push

# Access the application
http://localhost:5000
```

## Architecture

### Directory Structure
```
src/
├── app/                    # Application shell and routing
├── layout/                 # Layout components (Header, Sidebar, AppShellV2)
├── modules/                # Feature modules
│   ├── customers/          # Customer management
│   └── products/           # Product management
├── platform/               # Shared platform services
│   ├── components/         # Reusable UI components
│   └── services/           # Data access and business logic
└── styles/                 # Global styles

components/                 # Legacy components (being phased out)
archive/                    # Archived legacy code
shared/                     # Database schema
server/                     # Backend services
```

### Modular System
- **Platform Components**: DataGrid, Form, Lookup, LocationField, SearchBox
- **Command Registry**: Context-aware header actions
- **Safety Architecture**: V2 components alongside V1 for gradual migration

## Usage

### Customer Management
1. Navigate to "Customers" in the sidebar
2. View customer list with search and filtering
3. Create new customers or edit existing ones
4. Auto-save functionality with change detection

### Product Management
1. Navigate to "Products" in the sidebar
2. Manage product catalog with SKU, pricing, and descriptions
3. Import/export product data

### Header Actions
Modules can register contextual actions in the header bar:
```javascript
const commands = useCommands('module-id');
commands.set([
  {
    id: 'new-item',
    label: 'New Item',
    icon: 'fas fa-plus',
    variant: 'primary',
    onClick: () => handleNewItem()
  }
]);
```

## Contributing

### Development Guidelines
- Follow safety-first principles: never delete, only add/archive
- Create V2 components instead of modifying V1
- Modules import only from `/src/platform` and their own folder
- Update `replit.md` for architectural changes

### Code Style
- Use Bootstrap 5 classes for styling
- Component-based architecture with clear dependencies
- Auto-save patterns for forms
- Comprehensive error handling with fallbacks

## License
Proprietary - Millennium Roofing Solutions

## Support
For support and documentation, see the `replit.md` file for detailed technical specifications and recent changes.