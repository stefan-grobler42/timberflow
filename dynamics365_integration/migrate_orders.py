#!/usr/bin/env python3
"""
Migrate Sales Orders from Dynamics 365 to Millennium ERP
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dynamics365_integration.migrate_data import D365ToERPMigrator

def main():
    """Run migration for Sales Order entity"""
    print("\n" + "="*70)
    print("DYNAMICS 365 SALES ORDERS MIGRATION")
    print("="*70)
    
    migrator = D365ToERPMigrator()
    
    # Migrate Sales Order entity
    migrator.migrate_entity('salesorder')
    
    print("\n" + "="*70)
    print("SALES ORDERS MIGRATION COMPLETE")
    print("="*70)
    print(f"Total Migrated: {migrator.stats['total_migrated']}")
    print(f"Total Failed: {migrator.stats['total_failed']}")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
