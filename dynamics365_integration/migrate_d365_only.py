#!/usr/bin/env python3
"""
Migrate ONLY D365 standard entities (Accounts, Contacts, Products, Quotes, Orders, Appointments, Emails)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dynamics365_integration.migrate_data import D365ToERPMigrator

def main():
    """Run migration for D365 standard entities only"""
    print("\n" + "="*70)
    print("DYNAMICS 365 STANDARD ENTITIES MIGRATION")
    print("="*70)
    
    migrator = D365ToERPMigrator()
    
    # Only migrate D365 standard entities
    d365_entities = [
        'account',
        'contact', 
        'product',
        'quote',
        'salesorder',
        'appointment',
        'email'
    ]
    
    for entity in d365_entities:
        migrator.migrate_entity(entity)
    
    print("\n" + "="*70)
    print("D365 MIGRATION COMPLETE")
    print("="*70)
    print(f"Total Migrated: {migrator.stats['total_migrated']}")
    print(f"Total Failed: {migrator.stats['total_failed']}")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
