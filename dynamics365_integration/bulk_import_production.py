#!/usr/bin/env python3
"""
Optimized bulk import for Production records from Dynamics 365
Imports all 2,908 production records in batches for speed
"""

import os
import sys
import json
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime
from zoneinfo import ZoneInfo
from auth import DynamicsAuthenticator

# Database connection
DATABASE_URL = os.environ.get('DATABASE_URL')

# Initialize authenticator
authenticator = DynamicsAuthenticator()
API_BASE = authenticator.get_api_base_url()

# South Africa timezone for datetime conversions
SAST_TZ = ZoneInfo('Africa/Johannesburg')

def convert_datetime_to_utc(value):
    """Convert datetime string to UTC for PostgreSQL storage"""
    if not value:
        return None
    try:
        # Parse the ISO datetime string
        dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
        
        # If no timezone info, assume South Africa timezone
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=SAST_TZ)
        
        # Convert to UTC
        dt_utc = dt.astimezone(ZoneInfo('UTC'))
        
        # Return as PostgreSQL timestamp with timezone
        return dt_utc.strftime('%Y-%m-%d %H:%M:%S+00')
    except Exception as e:
        print(f"  ⚠ Datetime conversion error: {value} -> {e}")
        return None

def fetch_all_production(access_token):
    """Fetch all production records from Dynamics 365"""
    import requests
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
    }
    
    endpoint = f"{API_BASE}/cr694_productions"
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

def bulk_insert_production(records):
    """Insert all production records in batches into PostgreSQL"""
    if not records:
        print("  ⚠ No records to insert")
        return
    
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Prepare data tuples
    values = []
    for record in records:
        values.append((
            record.get('cr694_productionid'),
            record.get('_cr694_customer_value'),
            convert_datetime_to_utc(record.get('cr694_jigend')),
            record.get('_cr694_jighelper1_value'),
            record.get('_cr694_jighelper2_value'),
            record.get('_cr694_jighelper3_value'),
            record.get('_cr694_jighelper4_value'),
            record.get('_cr694_jigleader_value'),
            convert_datetime_to_utc(record.get('cr694_jigstart')),
            record.get('cr694_name'),
            record.get('_cr694_orderno_value'),  # This is the sales order link
            convert_datetime_to_utc(record.get('cr694_pickend')),
            record.get('_cr694_pickinghelper1_value'),
            record.get('_cr694_pickinghelper2_value'),
            record.get('_cr694_pickinghelper3_value'),
            record.get('_cr694_pickingmaster_value'),
            convert_datetime_to_utc(record.get('cr694_pickstart')),
            record.get('cr694_productioncomplete'),
            convert_datetime_to_utc(record.get('cr694_productionplanneddate')),
            convert_datetime_to_utc(record.get('cr694_sawend')),
            record.get('_cr694_sawhelper1_value'),
            record.get('_cr694_sawhelper2_value'),
            record.get('_cr694_sawoperator_value'),
            convert_datetime_to_utc(record.get('cr694_sawstart')),
            int(record.get('cr694_totalcuts')) if record.get('cr694_totalcuts') else None,
            float(record.get('cr694_totaltimbercubes')) if record.get('cr694_totaltimbercubes') else None,
            float(record.get('cr694_trusscost')) if record.get('cr694_trusscost') else None,
            float(record.get('cr694_trussselling')) if record.get('cr694_trussselling') else None,
            float(record.get('cr694_workunitsefinks')) if record.get('cr694_workunitsefinks') else None,
            float(record.get('new_estimatedefinks')) if record.get('new_estimatedefinks') else None,
            convert_datetime_to_utc(record.get('createdon')),
            record.get('_createdby_value'),
            convert_datetime_to_utc(record.get('modifiedon')),
            record.get('_modifiedby_value')
        ))
    
    # Bulk insert using execute_values
    insert_query = """
        INSERT INTO cr694_production (
            cr694_productionid, cr694_customer, cr694_jigend, cr694_jighelper1, cr694_jighelper2,
            cr694_jighelper3, cr694_jighelper4, cr694_jigleader, cr694_jigstart, cr694_name,
            cr694_orderno, cr694_pickend, cr694_pickinghelper1, cr694_pickinghelper2,
            cr694_pickinghelper3, cr694_pickingmaster, cr694_pickstart, cr694_productioncomplete,
            cr694_productionplanneddate, cr694_sawend, cr694_sawhelper1, cr694_sawhelper2,
            cr694_sawoperator, cr694_sawstart, cr694_totalcuts, cr694_totaltimbercubes,
            cr694_trusscost, cr694_trussselling, cr694_workunitsefinks, new_estimatedefinks,
            "CreatedOn", "CreatedBy", "ModifiedOn", "ModifiedBy"
        ) VALUES %s
        ON CONFLICT (cr694_productionid) DO NOTHING
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
    print("DYNAMICS 365 PRODUCTION - OPTIMIZED BULK IMPORT")
    print("="*70)
    
    # Get access token
    print("\n  Getting access token...")
    access_token = authenticator.get_access_token()
    print("  ✓ Access token obtained")
    
    # Fetch all production records
    print("\n  Fetching all production records from Dynamics 365...")
    records = fetch_all_production(access_token)
    
    # Bulk insert
    print(f"\n  Inserting {len(records)} production records into PostgreSQL...")
    inserted = bulk_insert_production(records)
    
    print("\n" + "="*70)
    print(f"IMPORT COMPLETE: {inserted} records inserted")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()
