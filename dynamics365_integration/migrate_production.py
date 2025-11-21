#!/usr/bin/env python3
"""
Migrate Production data from Dynamics 365 to Millennium ERP
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dynamics365_integration.migrate_data import D365ToERPMigrator

def main():
    """Run migration for Production entity"""
    print("\n" + "="*70)
    print("DYNAMICS 365 PRODUCTION MIGRATION")
    print("="*70)
    
    migrator = D365ToERPMigrator()
    
    # Migrate Production entity
    migrator.migrate_entity('cr694_production')
    
    print("\n" + "="*70)
    print("PRODUCTION MIGRATION COMPLETE")
    print("="*70)
    print(f"Total Migrated: {migrator.stats['total_migrated']}")
    print(f"Total Failed: {migrator.stats['total_failed']}")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
