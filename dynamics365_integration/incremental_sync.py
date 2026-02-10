#!/usr/bin/env python3
"""
Incremental Sync for Dynamics 365 to Millennium ERP
Only fetches records created after the last successful sync.
"""
import sys
import os
import argparse
import json
import requests
from datetime import datetime, timezone
from typing import List, Dict, Optional, Tuple
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from dynamics365_integration.auth import DynamicsAuthenticator
from dynamics365_integration.migrate_data import D365ToERPMigrator


class IncrementalSyncer:
    """Performs incremental sync from Dynamics 365 to Millennium ERP"""
    
    SUPPORTED_ENTITIES = ['salesorder', 'cr694_production']
    
    PAGE_SIZE = 500
    
    def __init__(self, entity: str, api_url: str = 'http://localhost:8000'):
        """
        Initialize the incremental syncer
        
        Args:
            entity: Entity to sync (salesorder or cr694_production)
            api_url: Backend API URL
        """
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
        
    def get_last_sync_timestamp(self) -> Optional[str]:
        """
        Get the last successful sync timestamp from the backend
        
        Returns:
            ISO format timestamp string or None if no previous sync
        """
        try:
            url = f"{self.api_url}/api/sync/d365/last-sync/{self.entity}"
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                timestamp = data.get('lastSyncTimestamp') or data.get('last_sync_timestamp')
                if timestamp:
                    return timestamp
                return None
            elif response.status_code == 404:
                return None
            else:
                self.errors.append(f"Failed to get last sync timestamp: HTTP {response.status_code}")
                return None
                
        except requests.exceptions.RequestException as e:
            self.errors.append(f"Error getting last sync timestamp: {str(e)}")
            return None
    
    def fetch_records_since(self, since_timestamp: Optional[str] = None) -> Tuple[List[Dict], int]:
        """
        Fetch D365 records created OR modified after the given timestamp with pagination
        
        Args:
            since_timestamp: ISO format timestamp to filter records created/modified after
            
        Returns:
            Tuple of (list of records, total count)
        """
        all_records = []
        entity_set = self.entity_mapping['d365_entity_set']
        
        try:
            headers = self.d365_auth.get_auth_headers()
            headers['Prefer'] = f'odata.maxpagesize={self.PAGE_SIZE}'
            
            base_url = f"{self.d365_base_url}/{entity_set}"
            
            params = []
            params.append("$count=true")
            params.append("$orderby=modifiedon asc")
            
            if since_timestamp:
                odata_timestamp = since_timestamp.replace('+00:00', 'Z')
                if not odata_timestamp.endswith('Z'):
                    odata_timestamp = odata_timestamp + 'Z'
                params.append(f"$filter=createdon gt {odata_timestamp} or modifiedon gt {odata_timestamp}")
            
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
                    
            return all_records, len(all_records)
            
        except requests.exceptions.RequestException as e:
            self.errors.append(f"Error fetching D365 records: {str(e)}")
            return [], 0
    
    def check_record_exists(self, record_id: str) -> bool:
        """
        Check if a record already exists in the backend
        
        Args:
            record_id: The GUID of the record
            
        Returns:
            True if record exists, False otherwise
        """
        try:
            endpoint = self.entity_mapping['endpoint']
            url = f"{self.api_url}/api/{endpoint}/{record_id}"
            
            response = requests.get(url, timeout=30)
            return response.status_code == 200
            
        except requests.exceptions.RequestException:
            return False
    
    def import_record(self, record: Dict) -> bool:
        """
        Import a single record to the backend
        
        Args:
            record: D365 record to import
            
        Returns:
            True if successfully imported, False otherwise
        """
        try:
            transformed = self.migrator.transform_record(record, self.entity)
            
            endpoint = self.entity_mapping['endpoint']
            url = f"{self.api_url}/api/{endpoint}"
            
            response = requests.post(
                url,
                json=transformed,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                return True
            else:
                primary_key = self.entity_mapping['primary_key']
                record_id = record.get(primary_key, 'unknown')
                self.errors.append(f"Failed to import record {record_id}: HTTP {response.status_code} - {response.text[:200]}")
                return False
                
        except Exception as e:
            primary_key = self.entity_mapping['primary_key']
            record_id = record.get(primary_key, 'unknown')
            self.errors.append(f"Error importing record {record_id}: {str(e)}")
            return False
    
    def import_records_bulk(self, records: List[Dict]) -> Tuple[int, int]:
        """
        Import or update records (upsert behavior)
        
        Args:
            records: List of D365 records to import/update
            
        Returns:
            Tuple of (imported/updated count, skipped count)
        """
        imported = 0
        skipped = 0
        primary_key = self.entity_mapping['primary_key']
        
        for record in records:
            record_id = record.get(primary_key)
            
            exists = record_id and self.check_record_exists(record_id)
            
            if exists:
                if self.update_record(record):
                    imported += 1
                else:
                    skipped += 1
            else:
                if self.import_record(record):
                    imported += 1
                
        return imported, skipped
    
    def update_record(self, record: Dict) -> bool:
        """
        Update an existing record in the backend
        
        Args:
            record: D365 record to update
            
        Returns:
            True if successfully updated, False otherwise
        """
        try:
            transformed = self.migrator.transform_record(record, self.entity)
            
            endpoint = self.entity_mapping['endpoint']
            primary_key = self.entity_mapping['primary_key']
            record_id = record.get(primary_key)
            
            url = f"{self.api_url}/api/{endpoint}/{record_id}"
            
            response = requests.put(
                url,
                json=transformed,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code in [200, 204]:
                return True
            else:
                self.errors.append(f"Failed to update record {record_id}: HTTP {response.status_code} - {response.text[:200]}")
                return False
                
        except Exception as e:
            primary_key = self.entity_mapping['primary_key']
            record_id = record.get(primary_key, 'unknown')
            self.errors.append(f"Error updating record {record_id}: {str(e)}")
            return False
    
    def run(self) -> Dict:
        """
        Execute the incremental sync
        
        Returns:
            Status dictionary with sync results
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
            'last_sync_timestamp': None,
            'sync_timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        last_sync = self.get_last_sync_timestamp()
        result['last_sync_timestamp'] = last_sync
        
        records, total_count = self.fetch_records_since(last_sync)
        result['records_found'] = len(records)
        
        if records:
            imported, skipped = self.import_records_bulk(records)
            result['records_imported'] = imported
            result['records_skipped'] = skipped
        
        result['errors'] = self.errors
        result['duration_seconds'] = round(time.time() - start_time, 2)
        result['success'] = len(self.errors) == 0 and result['records_imported'] >= 0
        
        return result


def main():
    """Main entry point for incremental sync"""
    parser = argparse.ArgumentParser(
        description='Incremental sync from Dynamics 365 to Millennium ERP'
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
            print(f"Starting incremental sync for {args.entity}...", file=sys.stderr)
        
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
