-- Database Migration Script for Timberflow ERP
-- Creates all necessary tables for the modular system

-- Drop existing tables if they exist (in correct order to handle foreign keys)
DROP TABLE IF EXISTS account_relationships CASCADE;
DROP TABLE IF EXISTS account_types CASCADE;
DROP TABLE IF EXISTS company_types CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS item_types CASCADE;
DROP TABLE IF EXISTS units_of_measure CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS emails CASCADE;
DROP TABLE IF EXISTS phone_calls CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS stock_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS tenders CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- ==== CORE BUSINESS TABLES ====

-- Customers Table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    customer_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'South Africa',
    customer_type_id INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    gps_coordinates VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Contacts Table
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees Table
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    hire_date TIMESTAMP,
    salary DECIMAL(12,2),
    address TEXT,
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    project_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    customer_id INTEGER REFERENCES customers(id),
    project_manager_id INTEGER REFERENCES employees(id),
    status VARCHAR(50) DEFAULT 'planning',
    priority VARCHAR(20) DEFAULT 'medium',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    estimated_value DECIMAL(15,2),
    actual_value DECIMAL(15,2),
    address TEXT,
    gps_coordinates VARCHAR(100),
    pamir_data JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quotes Table
CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    quote_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INTEGER REFERENCES customers(id),
    project_id INTEGER REFERENCES projects(id),
    status VARCHAR(50) DEFAULT 'draft',
    valid_until TIMESTAMP,
    subtotal DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    terms TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(id)
);

-- Tenders Table
CREATE TABLE tenders (
    id SERIAL PRIMARY KEY,
    tender_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    customer_id INTEGER REFERENCES customers(id),
    submission_date TIMESTAMP,
    closing_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'open',
    estimated_value DECIMAL(15,2),
    actual_bid DECIMAL(15,2),
    result VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    order_type VARCHAR(20) NOT NULL, -- 'purchase' or 'sales'
    customer_id INTEGER REFERENCES customers(id),
    supplier_id INTEGER,
    project_id INTEGER REFERENCES projects(id),
    status VARCHAR(50) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    required_date TIMESTAMP,
    delivery_date TIMESTAMP,
    subtotal DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES employees(id)
);

-- Stock Items Table
CREATE TABLE stock_items (
    id SERIAL PRIMARY KEY,
    item_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER,
    item_type_id INTEGER,
    unit_of_measure_id INTEGER,
    unit_cost DECIMAL(12,4),
    selling_price DECIMAL(12,4),
    quantity_on_hand DECIMAL(12,4) DEFAULT 0,
    reorder_level DECIMAL(12,4),
    maximum_level DECIMAL(12,4),
    barcode VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_id INTEGER REFERENCES projects(id),
    assigned_to_id INTEGER REFERENCES employees(id),
    created_by_id INTEGER REFERENCES employees(id),
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phone Calls Table
CREATE TABLE phone_calls (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    contact_id INTEGER REFERENCES contacts(id),
    employee_id INTEGER REFERENCES employees(id),
    project_id INTEGER REFERENCES projects(id),
    call_type VARCHAR(20) DEFAULT 'outbound', -- inbound/outbound
    phone_number VARCHAR(50),
    duration INTEGER, -- in minutes
    subject VARCHAR(255),
    notes TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMP,
    call_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emails Table
CREATE TABLE emails (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    contact_id INTEGER REFERENCES contacts(id),
    employee_id INTEGER REFERENCES employees(id),
    project_id INTEGER REFERENCES projects(id),
    email_type VARCHAR(20) DEFAULT 'outbound', -- inbound/outbound
    to_email VARCHAR(255),
    from_email VARCHAR(255),
    cc_emails TEXT,
    bcc_emails TEXT,
    subject VARCHAR(255),
    body TEXT,
    is_html BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'sent',
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meetings Table
CREATE TABLE meetings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    customer_id INTEGER REFERENCES customers(id),
    project_id INTEGER REFERENCES projects(id),
    organizer_id INTEGER REFERENCES employees(id),
    meeting_type VARCHAR(50) DEFAULT 'in-person',
    location VARCHAR(255),
    meeting_url VARCHAR(500),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    agenda TEXT,
    minutes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==== SETTINGS/CONFIGURATION TABLES ====

-- Units of Measure Table
CREATE TABLE units_of_measure (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10),
    description TEXT,
    base_unit VARCHAR(10),
    conversion_factor DECIMAL(12,6),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Item Types Table
CREATE TABLE item_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company Types Table
CREATE TABLE company_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Account Types Table
CREATE TABLE account_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Account Relationships Table
CREATE TABLE account_relationships (
    id SERIAL PRIMARY KEY,
    parent_account_id INTEGER REFERENCES customers(id),
    child_account_id INTEGER REFERENCES customers(id),
    relationship_type VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==== SEED DATA ====

-- Insert default units of measure
INSERT INTO units_of_measure (code, name, symbol, description) VALUES
('EA', 'Each', 'ea', 'Individual items'),
('M', 'Metre', 'm', 'Linear measurement'),
('M2', 'Square Metre', 'm²', 'Area measurement'),
('M3', 'Cubic Metre', 'm³', 'Volume measurement'),
('KG', 'Kilogram', 'kg', 'Weight measurement'),
('L', 'Litre', 'l', 'Liquid volume'),
('SET', 'Set', 'set', 'Collection of items'),
('BOX', 'Box', 'box', 'Packaged items');

-- Insert default item types
INSERT INTO item_types (code, name, description) VALUES
('TIMBER', 'Timber Products', 'All timber and wood products'),
('HARDWARE', 'Hardware', 'Bolts, screws, and fasteners'),
('ROOFING', 'Roofing Materials', 'Tiles, sheeting, and roofing components'),
('LABOR', 'Labor', 'Work and services'),
('TRANSPORT', 'Transport', 'Delivery and logistics');

-- Insert default categories
INSERT INTO categories (code, name, description) VALUES
('STRUCT', 'Structural', 'Structural timber components'),
('FINISH', 'Finishing', 'Finishing materials'),
('FASTEN', 'Fasteners', 'Bolts, screws, nails'),
('MISC', 'Miscellaneous', 'Other items');

-- Insert default company types
INSERT INTO company_types (code, name, description) VALUES
('HOMEOWNER', 'Homeowner', 'Individual property owners'),
('CONTRACTOR', 'Contractor', 'Building contractors'),
('DEVELOPER', 'Developer', 'Property developers'),
('ARCHITECT', 'Architect', 'Architectural firms'),
('SUPPLIER', 'Supplier', 'Material suppliers');

-- Insert default account types
INSERT INTO account_types (code, name, description) VALUES
('PROSPECT', 'Prospect', 'Potential customers'),
('CUSTOMER', 'Customer', 'Active customers'),
('SUPPLIER', 'Supplier', 'Service suppliers'),
('EMPLOYEE', 'Employee', 'Company employees'),
('ADMIN', 'Administrator', 'System administrators');

-- Create indexes for performance
CREATE INDEX idx_customers_code ON customers(customer_code);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_contacts_customer ON contacts(customer_id);
CREATE INDEX idx_projects_customer ON projects(customer_id);
CREATE INDEX idx_quotes_customer ON quotes(customer_id);
CREATE INDEX idx_quotes_project ON quotes(project_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_stock_items_code ON stock_items(item_code);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to_id);

-- Update functions for tracking changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON stock_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();