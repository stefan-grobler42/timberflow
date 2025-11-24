#!/usr/bin/env python3
"""
Optimized bulk import for Sales Orders from Dynamics 365
Imports all 3,187 sales orders in batches for speed
"""

import os
import sys
import json
import psycopg2
from psycopg2 import sql
from psycopg2.extras import execute_values
from datetime import datetime
from auth import DynamicsAuthenticator

# Database connection
DATABASE_URL = os.environ.get('DATABASE_URL')

# Initialize authenticator
authenticator = DynamicsAuthenticator()
API_BASE = authenticator.get_api_base_url()

def convert_datetime(value):
    """Convert datetime string to PostgreSQL format with UTC timezone"""
    if not value:
        return None
    try:
        # Parse ISO datetime
        dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
        # Return as ISO string with Z suffix for PostgreSQL
        return dt.strftime('%Y-%m-%d %H:%M:%S+00')
    except Exception as e:
        print(f"  ⚠ Datetime conversion error: {value} -> {e}")
        return None

def fetch_all_orders(access_token):
    """Fetch all sales orders from Dynamics 365"""
    import requests
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
    }
    
    endpoint = f"{API_BASE}/salesorders"
    all_records = []
    
    print(f"\n  Fetching from: {endpoint}")
    
    while endpoint:
        response = requests.get(endpoint, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        records = data.get('value', [])
        all_records.extend(records)
        
        endpoint = data.get('@odata.nextLink')
        print(f"  ✓ Fetched {len(all_records)} records so far...")
    
    print(f"  ✓ Total fetched: {len(all_records)} records")
    return all_records

def bulk_insert_orders(records):
    """Insert all orders in batches into PostgreSQL"""
    if not records:
        print("  ⚠ No records to insert")
        return
    
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Prepare data tuples
    values = []
    for record in records:
        values.append((
            record.get('salesorderid'),
            record.get('ordernumber'),
            record.get('name'),
            record.get('_customerid_value'),
            record.get('_quoteid_value'),
            convert_datetime(record.get('datefulfilled')),
            convert_datetime(record.get('requestdeliveryby')),
            float(record.get('totalamount', 0)) if record.get('totalamount') else None,
            float(record.get('totaldiscountamount', 0)) if record.get('totaldiscountamount') else None,
            float(record.get('totallineitemamount', 0)) if record.get('totallineitemamount') else None,
            record.get('statecode'),
            record.get('statuscode'),
            record.get('description'),
            record.get('_ownerid_value'),
            convert_datetime(record.get('createdon')),
            convert_datetime(record.get('modifiedon')),
            record.get('_createdby_value', {}).get('name') if isinstance(record.get('_createdby_value'), dict) else str(record.get('_createdby_value'))[:100] if record.get('_createdby_value') else None,
            record.get('_modifiedby_value', {}).get('name') if isinstance(record.get('_modifiedby_value'), dict) else str(record.get('_modifiedby_value'))[:100] if record.get('_modifiedby_value') else None
        ))
    
    # Bulk insert using execute_values
    insert_query = """
        INSERT INTO d365_salesorders (
            salesorderid, ordernumber, name, customerid, quoteid,
            datefulfilled, requestdeliveryby, totalamount, totaldiscountamount,
            totallineitemamount, statecode, statuscode, description, ownerid,
            createdon, modifiedon, "CreatedBy", "ModifiedBy"
        ) VALUES %s
        ON CONFLICT (salesorderid) DO NOTHING
    """
    
    batch_size = 500
    total_inserted = 0
    
    for i in range(0, len(values), batch_size):
        batch = values[i:i+batch_size]
        execute_values(cursor, insert_query, batch)
        conn.commit()
        total_inserted += len(batch)
        print(f"  ✓ Inserted batch {i//batch_size + 1}: {total_inserted}/{len(values)} records")
    
    cursor.close()
    conn.close()
    
    print(f"  ✓ Total inserted: {total_inserted} records")
    return total_inserted

def main():
    print("\n" + "="*70)
    print("DYNAMICS 365 SALES ORDERS - OPTIMIZED BULK IMPORT")
    print("="*70)
    
    # Get access token
    print("\n  Getting access token...")
    access_token = authenticator.get_access_token()
    print("  ✓ Access token obtained")
    
    # Fetch all orders
    print("\n  Fetching all sales orders from Dynamics 365...")
    records = fetch_all_orders(access_token)
    
    # Bulk insert
    print(f"\n  Inserting {len(records)} orders into PostgreSQL...")
    inserted = bulk_insert_orders(records)
    
    print("\n" + "="*70)
    print(f"IMPORT COMPLETE: {inserted} records inserted")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()
