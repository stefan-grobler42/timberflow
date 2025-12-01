#!/usr/bin/env python3
"""
Script to update all production records with calculated durations based on EFinks.

Duration formula:
- PlannedDurationMinutes = ceil(EFinks * 6.5625 / 15) * 15 (round UP to nearest 15 min)
- Minimum duration: 15 minutes

This script updates productions that:
1. Have an EFinks value (newEstimateDefinks > 0)
2. Don't have a custom duration set
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
import math

# Database connection
DATABASE_URL = os.environ.get('DATABASE_URL')

MINUTES_PER_EFINK = 6.5625
MIN_DURATION = 15

def round_up_to_15_minutes(minutes: float) -> int:
    """Round UP to nearest 15-minute increment, minimum 15 minutes."""
    rounded = math.ceil(minutes / 15) * 15
    return max(MIN_DURATION, rounded)

def calculate_duration_from_efinks(efinks) -> int:
    """Calculate duration from EFinks value, rounded UP to nearest 15 minutes."""
    if efinks is None or float(efinks) <= 0:
        return MIN_DURATION
    raw_minutes = float(efinks) * MINUTES_PER_EFINK
    return round_up_to_15_minutes(raw_minutes)

def main():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL environment variable not set")
        return
    
    print("Connecting to database...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Get all productions with EFinks that need duration update
        print("Fetching productions...")
        cursor.execute("""
            SELECT 
                cr694_productionid as id,
                cr694_name as name,
                new_estimatedefinks as efinks,
                planned_duration_minutes,
                custom_duration_minutes
            FROM cr694_production
            WHERE new_estimatedefinks IS NOT NULL
              AND new_estimatedefinks > 0
        """)
        
        productions = cursor.fetchall()
        print(f"Found {len(productions)} productions with EFinks values")
        
        # Count how many need updates
        needs_update = []
        for prod in productions:
            efinks = prod['efinks'] or 0
            calculated_duration = calculate_duration_from_efinks(efinks)
            current_planned = prod['planned_duration_minutes']
            has_custom = prod['custom_duration_minutes'] is not None and prod['custom_duration_minutes'] > 0
            
            # Only update if:
            # 1. No custom duration is set (user hasn't manually resized)
            # 2. Planned duration is not set or differs from calculated
            if not has_custom and (current_planned is None or current_planned != calculated_duration):
                needs_update.append({
                    'id': prod['id'],
                    'name': prod['name'],
                    'efinks': efinks,
                    'old_duration': current_planned,
                    'new_duration': calculated_duration
                })
        
        print(f"\n{len(needs_update)} productions need duration updates")
        
        if not needs_update:
            print("No updates needed!")
            return
        
        # Show first 10 updates as preview
        print("\nPreview of updates (first 10):")
        print("-" * 80)
        for prod in needs_update[:10]:
            old_str = f"{prod['old_duration']}min" if prod['old_duration'] else "NULL"
            print(f"  {prod['name'][:40]:<40} | EFinks: {prod['efinks']:>6.2f} | {old_str:>8} -> {prod['new_duration']}min")
        
        if len(needs_update) > 10:
            print(f"  ... and {len(needs_update) - 10} more")
        print("-" * 80)
        
        # Perform updates in batches
        print("\nUpdating productions...")
        update_count = 0
        batch_size = 500
        
        for i in range(0, len(needs_update), batch_size):
            batch = needs_update[i:i + batch_size]
            for prod in batch:
                cursor.execute("""
                    UPDATE cr694_production
                    SET planned_duration_minutes = %s,
                        "ModifiedOn" = NOW()
                    WHERE cr694_productionid = %s
                """, (prod['new_duration'], prod['id']))
                update_count += 1
            
            conn.commit()
            print(f"  Updated {min(update_count, len(needs_update))}/{len(needs_update)}...")
        
        print(f"\n✓ Successfully updated {update_count} production records!")
        
        # Verify updates
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM cr694_production
            WHERE new_estimatedefinks IS NOT NULL
              AND new_estimatedefinks > 0
              AND planned_duration_minutes IS NOT NULL
        """)
        result = cursor.fetchone()
        print(f"✓ {result['count']} productions now have planned durations set")
        
    except Exception as e:
        print(f"ERROR: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
