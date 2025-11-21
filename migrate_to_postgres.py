#!/usr/bin/env python3
"""
Migrate data from SQLite backup to PostgreSQL.
Preserves all D365 GUIDs and relationships.
"""
import os
import psycopg2
from psycopg2.extras import execute_values
import sqlite3
import sys

# PostgreSQL connection
pg_conn = psycopg2.connect(
    host=os.environ['PGHOST'],
    port=os.environ['PGPORT'],
    database=os.environ['PGDATABASE'],
    user=os.environ['PGUSER'],
    password=os.environ['PGPASSWORD'],
    sslmode='require'
)

# SQLite connection
sqlite_conn = sqlite3.connect('millennium.db')
sqlite_conn.row_factory = sqlite3.Row

def migrate_table(table_name, column_mapping=None):
    """Migrate a single table from SQLite to PostgreSQL"""
    print(f"\nMigrating {table_name}...", end=' ', flush=True)
    
    sqlite_cursor = sqlite_conn.cursor()
    pg_cursor = pg_conn.cursor()
    
    # Get all rows from SQLite
    sqlite_cursor.execute(f'SELECT * FROM {table_name}')
    rows = sqlite_cursor.fetchall()
    
    if not rows:
        print(f"✓ (0 records)")
        return
    
    # Get column names
    columns = [description[0] for description in sqlite_cursor.description]
    
    # Apply column mapping if provided
    if column_mapping:
        pg_columns = [column_mapping.get(col, col) for col in columns]
    else:
        pg_columns = columns
    
    # Prepare INSERT statement
    columns_str = ', '.join([f'"{col}"' for col in pg_columns])
    placeholders = ', '.join(['%s'] * len(columns))
    insert_sql = f'INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})'
    
    # Convert rows to tuples
    data = [tuple(row) for row in rows]
    
    # Batch insert
    try:
        pg_cursor.executemany(insert_sql, data)
        pg_conn.commit()
        print(f"✓ ({len(data)} records)")
    except Exception as e:
        pg_conn.rollback()
        print(f"✗ ERROR: {e}")
        raise

# Migration order (respecting foreign key constraints)
tables_to_migrate = [
    # Base tables (no dependencies)
    'companies',
    'roles',
    'users',
    'accounts',
    'cr694_employees',
    'cr694_designer',
    'cr694_salerepresentative',
    'cr694_vehicles',
    'picking_teams',
    'saws',
    'jigs',
    'd365_products',
    'd365_quotes',
    
    # Tables with foreign keys
    'd365_contacts',
    'd365_quotedetails',
    'd365_salesorders',
    'customers',
    'contacts',
    'activities',
    'cr694_production',
    'cr694_installationprogress',
    'cr694_logistics',
    'cr694_quotemroofing',
    'cr694_tender',
    'cr694_pricingcalculation',
    'd365_appointments',
    'd365_emails',
]

try:
    print("=" * 60)
    print("MIGRATING DATA FROM SQLite TO PostgreSQL")
    print("=" * 60)
    
    for table in tables_to_migrate:
        try:
            migrate_table(table)
        except sqlite3.OperationalError as e:
            if "no such table" in str(e):
                print(f"⚠ Table {table} not found in SQLite, skipping")
            else:
                raise
    
    print("\n" + "=" * 60)
    print("MIGRATION COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    
    # Verify counts
    print("\nVerifying record counts:")
    pg_cursor = pg_conn.cursor()
    
    verification_tables = [
        'accounts', 'd365_contacts', 'd365_quotes', 'd365_salesorders',
        'cr694_production', 'cr694_installationprogress', 'cr694_logistics',
        'cr694_tender', 'cr694_employees', 'cr694_designer', 'cr694_vehicles'
    ]
    
    for table in verification_tables:
        try:
            pg_cursor.execute(f'SELECT COUNT(*) FROM {table}')
            count = pg_cursor.fetchone()[0]
            print(f"  {table}: {count:,} records")
        except Exception as e:
            print(f"  {table}: Error - {e}")
    
except Exception as e:
    print(f"\n✗ MIGRATION FAILED: {e}")
    sys.exit(1)
finally:
    sqlite_conn.close()
    pg_conn.close()

print("\n✓ All data migrated successfully!")
