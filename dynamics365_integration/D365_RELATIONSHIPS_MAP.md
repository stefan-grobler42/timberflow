# D365 to ERP Relationship Mapping

## Overview
This document maps all Dynamics 365 table relationships to the ERP database schema for proper lookup field implementation.

## Entity Consolidation Required

### 1. Customers & Accounts → **Customers** (single entity)
- D365 `accounts` entity maps to ERP `customers` table
- Current duplicate: Both "Customers" and "Accounts" exist in sidebar
- **Action**: Keep Customers, remove Accounts duplicate

### 2. Contacts & D365Contacts → **Contacts** (single entity)
- D365 `contacts` entity maps to ERP `contacts` table  
- Current duplicate: Both exist in sidebar
- **Action**: Merge into single Contacts entity

### 3. Installations Table
- **Finding**: No separate cr694_installations table exists in D365
- Only `cr694_installationprogress` exists (already migrated)
- **Action**: Rename "Installation Progress" to "Installations" in UI

---

## Table Relationships (Lookup Fields)

### CR694_DESIGNER (Designers)
**No custom lookup fields** - standalone entity

### CR694_SALEREPRESENTATIVE (Sale Representatives)  
**No custom lookup fields** - standalone entity

### CR694_VEHICLES (Vehicles)
| Lookup Field | References | D365 Field Name |
|--------------|-----------|-----------------|
| approvedDriver | cr694_drivers (Employees) | cr694_approveddriver |

### CR694_DRIVERS (Employees)
**No custom lookup fields** - standalone entity

### CR694_PRODUCTION (Production)
| Lookup Field | References | D365 Field Name |
|--------------|-----------|-----------------|
| sawOperator | cr694_drivers (Employees) | cr694_sawoperator |
| sawHelper1 | cr694_drivers (Employees) | cr694_sawhelper1 |
| sawHelper2 | cr694_drivers (Employees) | cr694_sawhelper2 |
| jigLeader | cr694_drivers (Employees) | cr694_jigleader |
| pickingMaster | cr694_drivers (Employees) | cr694_pickingmaster |
| jigHelper1 | cr694_drivers (Employees) | cr694_jighelper1 |
| jigHelper2 | cr694_drivers (Employees) | cr694_jighelper2 |
| pickingHelper1 | cr694_drivers (Employees) | cr694_pickinghelper1 |
| jigHelper3 | cr694_drivers (Employees) | cr694_jighelper3 |
| pickingHelper2 | cr694_drivers (Employees) | cr694_pickinghelper2 |
| jigHelper4 | cr694_drivers (Employees) | cr694_jighelper4 |
| pickingHelper3 | cr694_drivers (Employees) | cr694_pickinghelper3 |
| orderNo | salesorder (Sales Orders) | cr694_orderno |
| customer | account OR contact (Polymorphic!) | cr694_customer |

**Note**: `cr694_customer` is **polymorphic** - can reference either Account or Contact

### CR694_LOGISTICS (Logistics)
| Lookup Field | References | D365 Field Name |
|--------------|-----------|-----------------|
| driver | cr694_drivers (Employees) | cr694_driver |
| security | cr694_drivers (Employees) | cr694_security |
| helper1 | cr694_drivers (Employees) | cr694_helper1 |
| helper2 | cr694_drivers (Employees) | cr694_helper2 |
| helper3 | cr694_drivers (Employees) | cr694_helper3 |
| helper4 | cr694_drivers (Employees) | cr694_helper4 |
| helper5 | cr694_drivers (Employees) | cr694_helper5 |
| dispatchManager | cr694_drivers (Employees) | cr694_dispatchmanager |
| loadMaster | cr694_drivers (Employees) | cr694_loadmaster |
| vehicle | cr694_vehicles (Vehicles) | cr694_vehicle |
| trailer | cr694_vehicles (Vehicles) | cr694_trailer |

### CR694_DISPATCH (Deliveries)
| Lookup Field | References | D365 Field Name |
|--------------|-----------|-----------------|
| driver | cr694_drivers (Employees) | cr694_driver |
| security | cr694_drivers (Employees) | cr694_security |
| helper1 | cr694_drivers (Employees) | cr694_helper1 |
| helper2 | cr694_drivers (Employees) | cr694_helper2 |
| helper3 | cr694_drivers (Employees) | cr694_helper3 |
| helper | cr694_drivers (Employees) | cr694_helper |
| helper5 | cr694_drivers (Employees) | cr694_helper5 |
| dispatchManager | cr694_drivers (Employees) | cr694_dispatchmanager |
| loadMaster | cr694_drivers (Employees) | cr694_loadmaster |
| vehicle | cr694_vehicles (Vehicles) | cr694_vehicle |
| trailer | cr694_vehicles (Vehicles) | cr694_trailer |
| orderNo | salesorder (Sales Orders) | cr694_orderno |
| salesOrder | salesorder (Sales Orders) | cr694_salesorder |
| customer | account OR contact (Polymorphic!) | cr694_customer |

**Note**: `cr694_customer` is **polymorphic** - can reference either Account or Contact

---

## D365 Entity Set Naming Quirks

D365 uses non-standard pluralization rules:
- `cr694_designers` ✅
- `cr694_salerepresentatives` ✅ (not "sales")
- `cr694_vehicleses` ✅ (double 'es')
- `cr694_driverses` ✅ (double 'es')
- `cr694_productions` ✅
- `cr694_logisticses` ✅ (double 'es')
- `cr694_dispatchs` ✅ (no 'es', just 's')

---

## Implementation Tasks

### Phase 1: Database Schema Updates
1. Add foreign key columns to entities (all GUIDs to match D365)
2. Update migration script to populate lookup fields with D365 GUIDs
3. Handle polymorphic lookups (customer field can be Account OR Contact)

### Phase 2: Entity Consolidation  
1. Merge Accounts into Customers entity
2. Merge D365Contacts into Contacts entity
3. Update all references

### Phase 3: UI Updates
1. Update LookupField component to handle new relationships
2. Clean up sidebar navigation (remove duplicates)
3. Rename "Installation Progress" to "Installations"

### Phase 4: Standard D365 Entities
1. Migrate SalesOrders from D365
2. Update Production/Delivery orderNo lookups to reference SalesOrders
3. Update Production/Delivery customer lookups to reference Accounts/Contacts
