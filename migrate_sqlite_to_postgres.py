#!/usr/bin/env python3
"""
SQLite to PostgreSQL Migration Script for Millennium ERP D365 Data
Migrates all data from SQLite backup to PostgreSQL with proper type conversions
"""

import os
import sys
import sqlite3
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime
import traceback

# PostgreSQL connection details from environment
PG_CONFIG = {
    'host': os.environ.get('PGHOST'),
    'port': os.environ.get('PGPORT', '5432'),
    'database': os.environ.get('PGDATABASE'),
    'user': os.environ.get('PGUSER'),
    'password': os.environ.get('PGPASSWORD'),
    'sslmode': 'require'
}

# SQLite database path
SQLITE_DB = '/tmp/migration.db'

# Define table migration order (respecting dependencies)
# Tables without foreign keys come first, then tables with dependencies
TABLE_MIGRATION_ORDER = [
    # Independent lookup tables
    ('roles', 'roles'),
    ('users', 'users'),
    ('companies', 'companies'),
    ('customers', 'customers'),
    
    # D365 core entities (no dependencies)
    ('accounts', 'accounts'),
    ('d365_products', 'd365_products'),
    
    # D365 entities with dependencies on accounts
    ('d365_contacts', 'd365_contacts'),
    ('d365_quotes', 'd365_quotes'),
    ('d365_appointments', 'd365_appointments'),
    ('d365_emails', 'd365_emails'),
    
    # D365 entities with dependencies on quotes
    ('d365_quotedetails', 'd365_quotedetails'),
    ('d365_salesorders', 'd365_salesorders'),
    
    # Millennium custom entities - lookup tables
    ('cr694_salerepresentative', 'cr694_salerepresentative'),
    ('cr694_designer', 'cr694_designer'),
    ('cr694_drivers', 'cr694_drivers'),
    ('cr694_vehicles', 'cr694_vehicles'),
    ('picking_teams', 'picking_teams'),
    ('saws', 'saws'),
    ('jigs', 'jigs'),
    
    # Millennium custom entities - main data
    ('cr694_quotemroofing', 'cr694_quotemroofing'),
    ('cr694_tender', 'cr694_tender'),
    ('cr694_production', 'cr694_production'),
    ('cr694_logistics', 'cr694_logistics'),
    ('cr694_installationprogress', 'cr694_installationprogress'),
    ('cr694_pricingcalculation', 'cr694_pricingcalculation'),
    ('cr694_dispatch', 'cr694_dispatch'),
    
    # Other entities
    ('contacts', 'contacts'),
    ('activities', 'activities'),
]

def connect_sqlite():
    """Connect to SQLite database"""
    try:
        conn = sqlite3.connect(SQLITE_DB)
        conn.row_factory = sqlite3.Row
        print(f"✓ Connected to SQLite: {SQLITE_DB}")
        return conn
    except Exception as e:
        print(f"✗ Failed to connect to SQLite: {e}")
        sys.exit(1)

def connect_postgres():
    """Connect to PostgreSQL database"""
    try:
        conn = psycopg2.connect(**PG_CONFIG)
        conn.autocommit = False
        print(f"✓ Connected to PostgreSQL: {PG_CONFIG['host']}/{PG_CONFIG['database']}")
        return conn
    except Exception as e:
        print(f"✗ Failed to connect to PostgreSQL: {e}")
        sys.exit(1)

def get_pg_column_types(pg_conn, table_name):
    """Get column types from PostgreSQL table"""
    cursor = pg_conn.cursor()
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = %s
    """, (table_name,))
    column_types = {row[0]: row[1] for row in cursor.fetchall()}
    cursor.close()
    return column_types

def convert_value(value, column_name, column_type):
    """
    Convert SQLite value to PostgreSQL-compatible value based on target column type
    Handles: GUIDs (TEXT -> UUID), Booleans (INTEGER -> BOOLEAN), 
             Decimals (TEXT -> NUMERIC), Dates (TEXT -> TIMESTAMP)
    """
    if value is None:
        return None
    
    # Boolean conversion (INTEGER to BOOLEAN)
    if column_type == 'boolean' and isinstance(value, int):
        return bool(value)
    
    # UUID conversion (TEXT to UUID)  
    if column_type == 'uuid' and isinstance(value, str):
        return value  # Keep as string, PostgreSQL will convert
    
    # Timestamp conversion (TEXT to TIMESTAMP)
    if column_type in ('timestamp without time zone', 'timestamp with time zone', 'date') and isinstance(value, str):
        if value and value.strip():
            return value  # Keep as string, PostgreSQL will parse
        return None
    
    # Decimal/Numeric conversion (TEXT to NUMERIC)
    if column_type in ('numeric', 'decimal', 'double precision', 'real') and isinstance(value, str):
        if value and value.strip():
            try:
                return float(value)
            except:
                return None
        return None
    
    return value

def get_table_columns(sqlite_conn, table_name):
    """Get list of columns from SQLite table"""
    cursor = sqlite_conn.cursor()
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [row['name'] for row in cursor.fetchall()]
    return columns

def check_table_exists(pg_conn, table_name):
    """Check if table exists in PostgreSQL"""
    cursor = pg_conn.cursor()
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = %s
        )
    """, (table_name,))
    exists = cursor.fetchone()[0]
    cursor.close()
    return exists

def migrate_table(sqlite_conn, pg_conn, sqlite_table, pg_table):
    """
    Migrate data from SQLite table to PostgreSQL table
    Returns: (success: bool, rows_migrated: int)
    """
    try:
        # Check if PostgreSQL table exists
        if not check_table_exists(pg_conn, pg_table):
            print(f"  ⚠ PostgreSQL table '{pg_table}' does not exist, skipping...")
            return (False, 0)
        
        # Get columns from SQLite
        columns = get_table_columns(sqlite_conn, sqlite_table)
        
        # Get PostgreSQL column types
        pg_column_types = get_pg_column_types(pg_conn, pg_table)
        
        # Get data from SQLite
        sqlite_cursor = sqlite_conn.cursor()
        sqlite_cursor.execute(f"SELECT * FROM {sqlite_table}")
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            print(f"  ℹ Table '{sqlite_table}' is empty, skipping...")
            return (True, 0)
        
        # Convert rows to list of tuples with proper type conversion
        converted_rows = []
        for row in rows:
            converted_row = tuple(
                convert_value(row[col], col, pg_column_types.get(col, 'text')) 
                for col in columns
            )
            converted_rows.append(converted_row)
        
        # Prepare PostgreSQL insert statement
        pg_cursor = pg_conn.cursor()
        columns_str = ', '.join([f'"{col}"' for col in columns])
        placeholders = ', '.join(['%s'] * len(columns))
        insert_sql = f'INSERT INTO "{pg_table}" ({columns_str}) VALUES ({placeholders})'
        
        # Clear existing data from PostgreSQL table
        pg_cursor.execute(f'DELETE FROM "{pg_table}"')
        deleted_count = pg_cursor.rowcount
        
        # Use execute_values for much faster bulk inserts
        batch_size = 500
        total_inserted = 0
        
        for i in range(0, len(converted_rows), batch_size):
            batch = converted_rows[i:i + batch_size]
            execute_values(
                pg_cursor,
                f'INSERT INTO "{pg_table}" ({columns_str}) VALUES %s',
                batch,
                page_size=500
            )
            total_inserted += len(batch)
            
            # Print progress for large tables
            if len(converted_rows) > 100 and total_inserted % 500 == 0:
                print(f"  ... {total_inserted}/{len(converted_rows)} rows inserted")
        
        # Commit transaction
        pg_conn.commit()
        pg_cursor.close()
        
        return (True, total_inserted)
        
    except Exception as e:
        print(f"  ✗ Error migrating table '{sqlite_table}': {e}")
        traceback.print_exc()
        try:
            pg_conn.rollback()
        except:
            pass
        return (False, 0)

def verify_migration(sqlite_conn, pg_conn):
    """Verify that all data was migrated correctly"""
    print("\n" + "="*80)
    print("VERIFICATION REPORT")
    print("="*80)
    
    verification_results = []
    total_sqlite = 0
    total_postgres = 0
    
    for sqlite_table, pg_table in TABLE_MIGRATION_ORDER:
        try:
            # Get SQLite count
            sqlite_cursor = sqlite_conn.cursor()
            sqlite_cursor.execute(f"SELECT COUNT(*) FROM {sqlite_table}")
            sqlite_count = sqlite_cursor.fetchone()[0]
            total_sqlite += sqlite_count
            
            # Get PostgreSQL count
            if check_table_exists(pg_conn, pg_table):
                pg_cursor = pg_conn.cursor()
                pg_cursor.execute(f'SELECT COUNT(*) FROM "{pg_table}"')
                pg_count = pg_cursor.fetchone()[0]
                pg_cursor.close()
                total_postgres += pg_count
            else:
                pg_count = 0
            
            # Check if counts match
            match = "✓" if sqlite_count == pg_count else "✗"
            status = "OK" if sqlite_count == pg_count else "MISMATCH"
            
            verification_results.append({
                'table': pg_table,
                'sqlite': sqlite_count,
                'postgres': pg_count,
                'match': match,
                'status': status
            })
            
        except Exception as e:
            verification_results.append({
                'table': pg_table,
                'sqlite': '?',
                'postgres': '?',
                'match': '✗',
                'status': f'ERROR: {e}'
            })
    
    # Print verification table
    print(f"\n{'Table':<35} {'SQLite':>10} {'PostgreSQL':>12} {'Status':>10}")
    print("-" * 80)
    
    for result in verification_results:
        print(f"{result['table']:<35} {str(result['sqlite']):>10} {str(result['postgres']):>12}  {result['match']} {result['status']}")
    
    print("-" * 80)
    print(f"{'TOTAL':<35} {total_sqlite:>10,} {total_postgres:>12,}")
    print("="*80)
    
    return total_sqlite == total_postgres

def main():
    """Main migration function"""
    print("="*80)
    print("MILLENNIUM ERP - D365 DATA MIGRATION")
    print("SQLite → PostgreSQL")
    print("="*80)
    print()
    
    # Connect to databases
    sqlite_conn = connect_sqlite()
    pg_conn = connect_postgres()
    
    print()
    print("="*80)
    print("MIGRATION PROGRESS")
    print("="*80)
    print()
    
    # Track migration statistics
    total_tables = len(TABLE_MIGRATION_ORDER)
    successful_tables = 0
    total_rows = 0
    
    # Migrate each table
    for i, (sqlite_table, pg_table) in enumerate(TABLE_MIGRATION_ORDER, 1):
        print(f"[{i}/{total_tables}] Migrating '{sqlite_table}' → '{pg_table}'...")
        
        success, rows_migrated = migrate_table(sqlite_conn, pg_conn, sqlite_table, pg_table)
        
        if success:
            successful_tables += 1
            total_rows += rows_migrated
            print(f"  ✓ Migrated {rows_migrated:,} rows")
        else:
            print(f"  ✗ Migration failed")
        
        print()
    
    # Print summary
    print("="*80)
    print("MIGRATION SUMMARY")
    print("="*80)
    print(f"Tables processed: {total_tables}")
    print(f"Tables migrated successfully: {successful_tables}")
    print(f"Tables failed: {total_tables - successful_tables}")
    print(f"Total rows migrated: {total_rows:,}")
    print()
    
    # Verify migration
    verification_passed = verify_migration(sqlite_conn, pg_conn)
    
    # Close connections
    sqlite_conn.close()
    pg_conn.close()
    
    # Exit with appropriate code
    if verification_passed and successful_tables == total_tables:
        print("\n✓ Migration completed successfully!")
        sys.exit(0)
    else:
        print("\n✗ Migration completed with errors")
        sys.exit(1)

if __name__ == "__main__":
    main()
