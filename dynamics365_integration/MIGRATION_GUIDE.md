# Millennium Roofing Data Migration Guide

This guide explains how to migrate data from Microsoft Dynamics 365 Sales to the new Millennium Roofing ERP system.

## Overview

The migration utility (`migrate_data.py`) automatically transfers all 11 Millennium custom entities from Dynamics 365 to the new ERP:

1. **Designer** - Design team members
2. **Sale Representative** - Sales team members  
3. **Vehicles** - Company vehicles and equipment
4. **Employee** - All employees
5. **Quote - MRoofing** - Roofing quotes
6. **Tender** - Tender/bid submissions
7. **Pricing Calculation** - Pricing worksheets
8. **Installation Progress** - Project installation tracking
9. **Production** - Production schedules and records
10. **Logistics** - Logistics and load planning
11. **Delivery** - Delivery/dispatch records

## Prerequisites

1. **Dynamics 365 Credentials** - You need the following environment variables:
   ```bash
   export DYNAMICS_TENANT_ID="your-tenant-id"
   export DYNAMICS_CLIENT_ID="your-client-id"
   export DYNAMICS_CLIENT_SECRET="your-client-secret"
   export DYNAMICS_INSTANCE_URL="https://yourorg.crm.dynamics.com"
   ```

2. **Python Dependencies**:
   ```bash
   pip install msal requests python-dotenv
   ```

3. **Running ERP Backend**: Ensure the ASP.NET Core API is running on `http://localhost:8000`

## Running the Migration

### Full Migration (All Entities)

```bash
cd dynamics365_integration
python migrate_data.py
```

This will:
1. Connect to Dynamics 365
2. Fetch all records from each of the 11 entities
3. Transform the data to match the new ERP schema
4. POST each record to the new ERP API
5. Display a progress report and final statistics

### Expected Output

```
======================================================================
MILLENNIUM ROOFING DATA MIGRATION
Dynamics 365 → New ERP System
======================================================================

============================================================
Migrating: cr694_designer → designers
============================================================
  Fetching from: https://yourorg.crm.dynamics.com/api/data/v9.2/cr694_designers
  ✓ Fetched 25 records

  [1/25] ✓ Migrated: John Smith
  [2/25] ✓ Migrated: Sarah Johnson
  ...
  
  Summary: 25/25 migrated successfully

... (repeats for all 11 entities)

======================================================================
MIGRATION COMPLETE
======================================================================

Total Duration: 45.3 seconds
Total Records Fetched: 1,247
Successfully Migrated: 1,245
Failed: 2

Per-Entity Breakdown:
  cr694_designer                  25/  25 (100.0%)
  cr694_salerepresentative        12/  12 (100.0%)
  cr694_vehicle                   18/  18 (100.0%)
  cr694_employee                 156/ 156 (100.0%)
  cr694_quotemroofing            432/ 434 ( 99.5%)
  cr694_tender                    87/  87 (100.0%)
  cr694_pricingcalculation       145/ 145 (100.0%)
  cr694_installationprogress      89/  89 (100.0%)
  cr694_production               198/ 198 (100.0%)
  cr694_logistics                 63/  63 (100.0%)
  cr694_dispatch                  20/  20 (100.0%)
```

## Data Transformation

The migration utility automatically:

### Field Name Conversion
- Converts D365 field names (e.g., `cr694_orderno`) to proper camelCase (e.g., `orderNo`)
- Removes the `cr694_` prefix from custom fields
- Converts `new_` prefixed fields appropriately

### Data Type Handling
- Converts D365 datetime strings to ISO 8601 format
- Handles GUID primary keys
- Preserves numeric precision for decimals
- Maintains boolean values

### Example Transformation

**D365 Record:**
```json
{
  "cr694_productionid": "123e4567-e89b-12d3-a456-426614174000",
  "cr694_name": "Production Order 001",
  "cr694_orderno": "456e7890-e89b-12d3-a456-426614174111",
  "cr694_jigstart": "2025-10-01T08:00:00Z",
  "cr694_productioncomplete": false
}
```

**New ERP Record:**
```json
{
  "name": "Production Order 001",
  "orderNo": "456e7890-e89b-12d3-a456-426614174111",
  "jigStart": "2025-10-01T08:00:00+00:00",
  "productionComplete": false
}
```

## Troubleshooting

### Authentication Errors

If you see "Authentication failed":
1. Verify all environment variables are set correctly
2. Check that the Azure AD app has API permissions for Dynamics 365
3. Ensure the client secret hasn't expired

### API Connection Errors

If you see "Connection refused" on port 8000:
1. Start the backend API: `cd backend/MillenniumERP.API && dotnet run`
2. Verify it's listening on port 8000

### Migration Failures

If some records fail to migrate:
1. Check the error messages for specific issues
2. Verify the ERP API is accepting the transformed data format
3. Check for required fields that may be missing in D365 data
4. Review any validation errors in the API logs

## Customizing the Migration

### Selective Entity Migration

Edit `migrate_data.py` to migrate specific entities only:

```python
# Instead of migrate_all(), call migrate_entity() for specific entities
migrator.migrate_entity('cr694_designer')
migrator.migrate_entity('cr694_employee')
```

### Custom Field Mappings

Modify the `transform_record()` method to add custom field transformations:

```python
def transform_record(self, d365_record: Dict, entity_type: str) -> Dict:
    transformed = {}
    
    # Add entity-specific transformations
    if entity_type == 'cr694_employee':
        # Custom logic for employee records
        transformed['customField'] = some_transformation(d365_record)
    
    # ... rest of transformation
    return transformed
```

## Post-Migration Steps

1. **Verify Data Integrity**: Check record counts match between D365 and new ERP
2. **Test Relationships**: Ensure foreign key references are maintained
3. **User Acceptance Testing**: Have users verify critical records
4. **Backup**: Create a backup of the migrated database

## Support

For issues with the migration utility, check:
1. Backend API logs: `backend/MillenniumERP.API/logs/`
2. D365 audit logs: Dynamics 365 → Settings → Audit Summary
3. Migration output: Review the console output for specific error messages
