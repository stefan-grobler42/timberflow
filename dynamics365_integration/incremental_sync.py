#!/usr/bin/env python3
"""
Sync for Dynamics 365 to Millennium ERP (Timber Flow 01)
Simple logic: fetch all D365 records, compare IDs with local system,
only import records that don't exist locally. Never update existing records.
Uses bulk import endpoints for speed.
"""
import sys
import os
import argparse
import json
import requests
from datetime import datetime, timezone
from typing import List, Dict, Set, Tuple
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from dynamics365_integration.auth import DynamicsAuthenticator
from dynamics365_integration.migrate_data import D365ToERPMigrator


class IncrementalSyncer:
    """Syncs new records from Dynamics 365 to Millennium ERP"""
    
    SUPPORTED_ENTITIES = ['salesorder', 'cr694_production']
    
    PAGE_SIZE = 5000
    BULK_BATCH_SIZE = 200
    
    def __init__(self, entity: str, api_url: str = 'http://localhost:8000'):
        if entity not in self.SUPPORTED_ENTITIES:
            raise ValueError(f"Unsupported entity: {entity}. Supported: {self.SUPPORTED_ENTITIES}")
        
        self.entity = entity
        self.api_url = api_url.rstrip('/')
        
        self.d365_auth = DynamicsAuthenticator()
        self.d365_base_url = self.d365_auth.get_api_base_url()
        
        self.entity_mapping = D365ToERPMigrator.ENTITY_MAPPING[entity]
        self.field_mapping = D365ToERPMigrator.FIELD_MAPPINGS.get(entity, {})
        
        self.migrator = D365ToERPMigrator(erp_api_url=f"{api_url}/api")
        
        self.errors: List[str] = []
    
    def get_existing_ids(self) -> Set[str]:
        """Get all existing record IDs from the local system."""
        try:
            endpoint = self.entity_mapping['endpoint']
            url = f"{self.api_url}/api/{endpoint}/ids"
            
            response = requests.get(url, timeout=60)
            
            if response.status_code == 200:
                ids = response.json()
                return set(str(id_val).lower() for id_val in ids)
            else:
                self.errors.append(f"Failed to get existing IDs: HTTP {response.status_code}")
                return set()
                
        except requests.exceptions.RequestException as e:
            self.errors.append(f"Error getting existing IDs: {str(e)}")
            return set()
    
    def fetch_all_d365_records(self) -> List[Dict]:
        """
        Fetch ALL records from D365 with proper pagination.
        Uses Prefer: odata.maxpagesize header for per-page sizing
        and follows @odata.nextLink for all pages.
        """
        all_records = []
        entity_set = self.entity_mapping['d365_entity_set']
        
        try:
            headers = self.d365_auth.get_auth_headers()
            headers['Prefer'] = f'odata.maxpagesize={self.PAGE_SIZE}'
            
            base_url = f"{self.d365_base_url}/{entity_set}"
            
            params = ["$count=true"]
            url = f"{base_url}?{'&'.join(params)}"
            
            page = 1
            while url:
                response = requests.get(url, headers=headers, timeout=120)
                response.raise_for_status()
                
                data = response.json()
                records = data.get('value', [])
                all_records.extend(records)
                
                next_link = data.get('@odata.nextLink')
                if next_link:
                    url = next_link
                    page += 1
                else:
                    url = None
                    
            return all_records
            
        except requests.exceptions.RequestException as e:
            self.errors.append(f"Error fetching D365 records: {str(e)}")
            return []
    
    def bulk_import_records(self, records: List[Dict]) -> int:
        """
        Import new records using the bulk import endpoint.
        Sends records in batches. The backend handles deduplication.
        Returns total imported count.
        """
        if not records:
            return 0
        
        total_imported = 0
        endpoint = self.entity_mapping['endpoint']
        url = f"{self.api_url}/api/{endpoint}/bulk"
        
        for i in range(0, len(records), self.BULK_BATCH_SIZE):
            batch = records[i:i + self.BULK_BATCH_SIZE]
            
            transformed_batch = []
            for record in batch:
                try:
                    transformed = self.migrator.transform_record(record, self.entity)
                    transformed_batch.append(transformed)
                except Exception as e:
                    primary_key = self.entity_mapping['primary_key']
                    record_id = record.get(primary_key, 'unknown')
                    self.errors.append(f"Transform error for {record_id}: {str(e)}")
            
            if not transformed_batch:
                continue
            
            try:
                response = requests.post(
                    url,
                    json=transformed_batch,
                    headers={'Content-Type': 'application/json'},
                    timeout=120
                )
                
                if response.status_code == 200:
                    result = response.json()
                    total_imported += result.get('imported', 0)
                else:
                    self.errors.append(f"Bulk import failed: HTTP {response.status_code} - {response.text[:300]}")
                    
            except Exception as e:
                self.errors.append(f"Bulk import error: {str(e)}")
        
        return total_imported
    
    def run(self) -> Dict:
        """
        Execute the sync:
        1. Get all existing IDs from local system
        2. Fetch all records from D365
        3. Filter to only new records (not in local system)
        4. Bulk import only new records - never update existing ones
        """
        start_time = time.time()
        
        result = {
            'entity': self.entity,
            'records_found': 0,
            'records_imported': 0,
            'records_skipped': 0,
            'errors': [],
            'duration_seconds': 0,
            'success': False,
        }
        
        existing_ids = self.get_existing_ids()
        
        all_d365_records = self.fetch_all_d365_records()
        result['records_found'] = len(all_d365_records)
        
        primary_key = self.entity_mapping['primary_key']
        new_records = []
        for record in all_d365_records:
            record_id = str(record.get(primary_key, '')).lower()
            if record_id and record_id not in existing_ids:
                new_records.append(record)
        
        result['records_skipped'] = len(all_d365_records) - len(new_records)
        
        imported = self.bulk_import_records(new_records)
        
        result['records_imported'] = imported
        result['errors'] = self.errors
        result['duration_seconds'] = round(time.time() - start_time, 2)
        result['success'] = len(self.errors) == 0
        
        return result


def main():
    """Main entry point for sync"""
    parser = argparse.ArgumentParser(
        description='Sync new records from Dynamics 365 to Millennium ERP'
    )
    parser.add_argument(
        '--entity',
        required=True,
        choices=['salesorder', 'cr694_production'],
        help='Entity to sync (salesorder or cr694_production)'
    )
    parser.add_argument(
        '--api-url',
        default='http://localhost:8000',
        help='Backend API URL (default: http://localhost:8000)'
    )
    parser.add_argument(
        '--quiet',
        action='store_true',
        help='Only output JSON result, no progress messages'
    )
    
    args = parser.parse_args()
    
    try:
        syncer = IncrementalSyncer(
            entity=args.entity,
            api_url=args.api_url
        )
        
        if not args.quiet:
            print(f"Starting sync for {args.entity}...", file=sys.stderr)
        
        result = syncer.run()
        
        print(json.dumps(result))
        
        return 0 if result['success'] else 1
        
    except Exception as e:
        error_result = {
            'entity': args.entity,
            'records_found': 0,
            'records_imported': 0,
            'records_skipped': 0,
            'errors': [str(e)],
            'duration_seconds': 0,
            'success': False
        }
        print(json.dumps(error_result))
        return 1


if __name__ == '__main__':
    sys.exit(main())
