#!/usr/bin/env python3
"""
Data Migration Utility for Millennium Roofing ERP
Migrates all 11 Millennium entities from Dynamics 365 to the new ERP system
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dynamics365_integration.auth import DynamicsAuthenticator
import requests
import json
from datetime import datetime
from typing import List, Dict, Optional
import re


class D365ToERPMigrator:
    """Migrates data from Dynamics 365 to new Millennium ERP"""
    
    # Mapping of D365 entity names to new ERP API endpoints  
    ENTITY_MAPPING = {
        'cr694_designer': {
            'd365_entity_set': 'cr694_designers',
            'endpoint': 'designers',
            'primary_key': 'cr694_designerid',
            'name_field': 'cr694_name'
        },
        'cr694_salerepresentative': {
            'd365_entity_set': 'cr694_salerepresentatives',
            'endpoint': 'salerepresentatives',
            'primary_key': 'cr694_salerepresentativeid',
            'name_field': 'cr694_name'
        },
        'cr694_vehicle': {
            'd365_entity_set': 'cr694_vehicleses',
            'endpoint': 'vehicles',
            'primary_key': 'cr694_vehiclesid',
            'name_field': 'cr694_name'
        },
        'cr694_employee': {
            'd365_entity_set': 'cr694_driverses',
            'endpoint': 'employees',
            'primary_key': 'cr694_driversid',
            'name_field': 'cr694_name'
        },
        'cr694_quotemroofing': {
            'd365_entity_set': 'cr694_quotemroofings',
            'endpoint': 'quotemroofings',
            'primary_key': 'cr694_quotemroofingid',
            'name_field': 'cr694_quotenumber'
        },
        'cr694_tender': {
            'd365_entity_set': 'cr694_tenders',
            'endpoint': 'tenders',
            'primary_key': 'cr694_tenderid',
            'name_field': 'cr694_tendernumber'
        },
        'cr694_pricingcalculation': {
            'd365_entity_set': 'cr694_pricingcalculations',
            'endpoint': 'pricingcalculations',
            'primary_key': 'cr694_pricingcalculationid',
            'name_field': 'cr694_name'
        },
        'cr694_installationprogress': {
            'd365_entity_set': 'cr694_installationprogresses',
            'endpoint': 'installationprogress',
            'primary_key': 'activityid',
            'name_field': 'subject'
        },
        'cr694_production': {
            'd365_entity_set': 'cr694_productions',
            'endpoint': 'productions',
            'primary_key': 'cr694_productionid',
            'name_field': 'cr694_name'
        },
        'cr694_logistics': {
            'd365_entity_set': 'cr694_logisticses',
            'endpoint': 'logistics',
            'primary_key': 'cr694_logisticsid',
            'name_field': 'cr694_deliveryno'
        },
        'cr694_dispatch': {
            'd365_entity_set': 'cr694_dispatchs',
            'endpoint': 'deliveries',
            'primary_key': 'activityid',
            'name_field': 'cr694_deliveryno'
        },
        # D365 Standard Entities
        'account': {
            'd365_entity_set': 'accounts',
            'endpoint': 'accounts',
            'primary_key': 'accountid',
            'name_field': 'name'
        },
        'contact': {
            'd365_entity_set': 'contacts',
            'endpoint': 'd365contacts',
            'primary_key': 'contactid',
            'name_field': 'fullname'
        },
        'product': {
            'd365_entity_set': 'products',
            'endpoint': 'd365products',
            'primary_key': 'productid',
            'name_field': 'name'
        },
        'quote': {
            'd365_entity_set': 'quotes',
            'endpoint': 'd365quotes',
            'primary_key': 'quoteid',
            'name_field': 'name'
        },
        'salesorder': {
            'd365_entity_set': 'salesorders',
            'endpoint': 'd365orders',
            'primary_key': 'salesorderid',
            'name_field': 'name'
        },
        'appointment': {
            'd365_entity_set': 'appointments',
            'endpoint': 'd365appointments',
            'primary_key': 'activityid',
            'name_field': 'subject'
        },
        'email': {
            'd365_entity_set': 'emails',
            'endpoint': 'd365emails',
            'primary_key': 'activityid',
            'name_field': 'subject'
        }
    }
    
    # Comprehensive D365 field to camelCase mappings for all entities
    # Maps D365 field names to ASP.NET JSON serialization format
    FIELD_MAPPINGS = {
        'cr694_designer': {
            'cr694_designerid': 'id',
            'cr694_cellnumber': 'cellNumber',
            'cr694_emailaddress': 'emailAddress',
            'cr694_employeeno': 'employeeNo',
            'cr694_name': 'name',
            'new_displaynamecalculated': 'newDisplayNameCalculated',
            'new_employeefile': 'newEmployeeFile',
            'createdon': 'createdOn',
            'createdby': 'createdBy',
            'modifiedon': 'modifiedOn',
            'modifiedby': 'modifiedBy'
        },
        'cr694_salerepresentative': {
            'cr694_salerepresentativeid': 'id',
            'cr694_cellnumber': 'cellNumber',
            'cr694_emailaddress': 'emailAddress',
            'cr694_employeeno': 'employeeNo',
            'cr694_name': 'name',
            'new_employeefile': 'newEmployeeFile',
            'createdon': 'createdOn',
            'createdby': 'createdBy',
            'modifiedon': 'modifiedOn',
            'modifiedby': 'modifiedBy'
        },
        'cr694_vehicle': {
            'cr694_vehiclesid': 'id',
            'cr694_approveddriver': 'approvedDriver',
            'cr694_cofinorder': 'cofInOrder',
            'cr694_licenserenewaldate': 'licenseRenewalDate',
            'cr694_make': 'make',
            'cr694_model': 'model',
            'cr694_name': 'name',
            'cr694_registrationnumber': 'registrationNumber',
            'cr694_yearmodel': 'yearModel',
            'createdon': 'createdOn',
            'createdby': 'createdBy',
            'modifiedon': 'modifiedOn',
            'modifiedby': 'modifiedBy'
        },
        'cr694_employee': {
            'cr694_driversid': 'id',
            'cr694_allowdriving': 'allowDriving',
            'cr694_driverslicenseno': 'driversLicenseNo',
            'cr694_employeeno': 'employeeNo',
            'cr694_hourlyrate': 'hourlyRate',
            'cr694_hourlyrate_base': 'hourlyRateBase',
            'cr694_idno': 'idNo',
            'cr694_jobdescription': 'jobDescription',
            'cr694_name': 'name',
            'cr694_pdp': 'pdp',
            'cr694_pdpexpirydate': 'pdpExpiryDate',
            'cr694_pdpno': 'pdpNo',
            'exchangerate': 'exchangeRate',
            'new_activeemployee': 'newActiveEmployee',
            'new_cellno': 'newCellNo',
            'new_commissionpayable': 'newCommissionPayable',
            'new_contractonfile': 'newContractOnFile',
            'new_displaynamecalculated': 'newDisplayNameCalculated',
            'new_emailaddress': 'newEmailAddress',
            'new_incometaxnumber': 'newIncomeTaxNumber',
            'new_startdate': 'newStartDate',
            'new_unionmember': 'newUnionMember',
            'transactioncurrencyid': 'transactionCurrencyId',
            'createdon': 'createdOn',
            'createdby': 'createdBy',
            'modifiedon': 'modifiedOn',
            'modifiedby': 'modifiedBy'
        },
        'cr694_quotemroofing': {
            'cr694_quotemroofingid': 'id',
            'cr694_account': 'account',
            'cr694_name': 'name',
            'createdon': 'createdOn',
            'createdby': 'createdBy',
            'modifiedon': 'modifiedOn',
            'modifiedby': 'modifiedBy'
        },
        'cr694_tender': {
            'cr694_tenderid': 'id',
            'cr694_closingdate': 'closingDate',
            'cr694_contact': 'contact',
            'cr694_customer': 'customer',
            'cr694_description': 'description',
            'cr694_distancetosite': 'distanceToSite',
            'cr694_filelink': 'fileLink',
            'cr694_name': 'name',
            'cr694_quoteno': 'quoteNo',
            'cr694_roofcoveringsheeting': 'roofCoveringSheeting',
            'cr694_roofcoveringtiles': 'roofCoveringTiles',
            'cr694_streetaddress': 'streetAddress',
            'cr694_timberstructure': 'timberStructure',
            'cr694_totalvalueexcl': 'totalValueExcl',
            'cr694_totalvalueexcl_base': 'totalValueExclBase',
            'exchangerate': 'exchangeRate',
            'new_designer': 'newDesigner',
            'new_notes': 'newNotes',
            'new_pricingsubmitted': 'newPricingSubmitted',
            'new_submissiondate': 'newSubmissionDate',
            'new_tenderstatus': 'newTenderStatus',
            'transactioncurrencyid': 'transactionCurrencyId',
            'createdon': 'createdOn',
            'createdby': 'createdBy',
            'modifiedon': 'modifiedOn',
            'modifiedby': 'modifiedBy'
        },
        'cr694_pricingcalculation': {
            'cr694_pricingcalculationid': 'id',
            'cr694_discount': 'discount',
            'cr694_installedcost': 'installedCost',
            'cr694_installedcost_base': 'installedCostBase',
            'cr694_productname': 'productName',
            'cr694_quantity': 'quantity',
            'cr694_test': 'test',
            'cr694_totalprice': 'totalPrice',
            'cr694_totalprice_base': 'totalPriceBase',
            'cr694_unitprice': 'unitPrice',
            'cr694_unitprice_base': 'unitPriceBase',
            'exchangerate': 'exchangeRate',
            'transactioncurrencyid': 'transactionCurrencyId',
            'createdon': 'createdOn',
            'createdby': 'createdBy',
            'modifiedon': 'modifiedOn',
            'modifiedby': 'modifiedBy'
        },
        'cr694_installationprogress': {
            'activityid': 'id',
            'cr694_name': 'name',
            'new_installationorderno': 'newInstallationOrderNo',
            'new_percentagecomplete': 'newPercentageComplete',
            'createdon': 'createdOn',
            'createdby': 'createdBy',
            'modifiedon': 'modifiedOn',
            'modifiedby': 'modifiedBy'
        },
        'cr694_production': {
            'cr694_productionid': 'id',
            'cr694_customer': 'customer',
            'cr694_jigend': 'jigEnd',
            'cr694_jighelper1': 'jigHelper1',
            'cr694_jighelper2': 'jigHelper2',
            'cr694_jighelper3': 'jigHelper3',
            'cr694_jighelper4': 'jigHelper4',
            'cr694_jigleader': 'jigLeader',
            'cr694_jigstart': 'jigStart',
            'cr694_name': 'name',
            'cr694_orderno': 'orderNo',
            'cr694_pickend': 'pickEnd',
            'cr694_pickinghelper1': 'pickingHelper1',
            'cr694_pickinghelper2': 'pickingHelper2',
            'cr694_pickinghelper3': 'pickingHelper3',
            'cr694_pickingmaster': 'pickingMaster',
            'cr694_pickstart': 'pickStart',
            'cr694_productioncomplete': 'productionComplete',
            'cr694_productionplanneddate': 'productionPlannedDate',
            'cr694_sawend': 'sawEnd',
            'cr694_sawhelper1': 'sawHelper1',
            'cr694_sawhelper2': 'sawHelper2',
            'cr694_sawoperator': 'sawOperator',
            'cr694_sawstart': 'sawStart',
            'cr694_totalcuts': 'totalCuts',
            'cr694_totaltimbercubes': 'totalTimberCubes',
            'cr694_trusscost': 'trussCost',
            'cr694_trussselling': 'trussSelling',
            'cr694_workunitsefinks': 'workUnitsEfinks',
            'new_estimatedefinks': 'newEstimateDefinks',
            'createdon': 'createdOn',
            'createdby': 'createdBy',
            'modifiedon': 'modifiedOn',
            'modifiedby': 'modifiedBy'
        },
        'cr694_logistics': {
            'cr694_logisticsid': 'id',
            'cr694_deliveryno': 'deliveryNo',
            'cr694_description': 'description',
            'cr694_dispatchmanager': 'dispatchManager',
            'cr694_driver': 'driver',
            'cr694_helper1': 'helper1',
            'cr694_helper2': 'helper2',
            'cr694_helper3': 'helper3',
            'cr694_helper4': 'helper4',
            'cr694_helper5': 'helper5',
            'cr694_loadmaster': 'loadMaster',
            'cr694_plannedloaddate': 'plannedLoadDate',
            'cr694_security': 'security',
            'cr694_trailer': 'trailer',
            'cr694_vehicle': 'vehicle',
            'new_kmstravelled': 'newKmsTravelled',
            'new_kmstravelled_date': 'newKmsTravelledDate',
            'new_kmstravelled_state': 'newKmsTravelledState',
            'new_loadcompleted': 'newLoadCompleted',
            'new_loadduration': 'newLoadDuration',
            'new_loadduration_date': 'newLoadDurationDate',
            'new_loadduration_state': 'newLoadDurationState',
            'createdon': 'createdOn',
            'createdby': 'createdBy',
            'modifiedon': 'modifiedOn',
            'modifiedby': 'modifiedBy'
        },
        'cr694_dispatch': {
            'activityid': 'id',
            'cr694_deliveryno': 'deliveryNo',
            'cr694_customer': 'customer',
            'cr694_orderno': 'orderNo',
            'cr694_loadingdate': 'loadingDate',
            'cr694_driver': 'driver',
            'cr694_helper1': 'helper1',
            'cr694_helper2': 'helper2',
            'cr694_helper3': 'helper3',
            'cr694_helper': 'helper4',
            'cr694_helper5': 'helper5',
            'cr694_loadmaster': 'loadMaster',
            'cr694_dispatchmanager': 'dispatchManager',
            'cr694_openkms': 'openKms',
            'cr694_closekms': 'closeKms',
            'cr694_arrivaltime': 'arrivalTime',
            'cr694_arrivaltimesite': 'arrivalTimeSite',
            'cr694_departuretime': 'departureTime',
            'cr694_departuretimesite': 'departureTimeSite',
            'cr694_partload': 'partLoad',
            'actualstart': 'actualStart',
            'actualend': 'actualEnd',
            'actualdurationminutes': 'actualDurationMinutes',
            'createdon': 'createdOn',
            'createdby': 'createdBy',
            'modifiedon': 'modifiedOn',
            'modifiedby': 'modifiedBy'
        },
        # D365 Standard Entities Field Mappings
        'account': {
            'accountid': 'id',
            'accountnumber': 'accountNumber',
            'name': 'name',
            'telephone1': 'telephone1',
            'emailaddress1': 'emailAddress1',
            'websiteurl': 'websiteUrl',
            'address1_line1': 'address1Line1',
            'address1_city': 'address1City',
            'address1_stateorprovince': 'address1StateOrProvince',
            'address1_postalcode': 'address1PostalCode',
            'address1_country': 'address1Country',
            'revenue': 'revenue',
            'numberofemployees': 'numberOfEmployees',
            'industrycode': 'industryCode',
            'ownerid': 'ownerId',
            'createdon': 'createdOn',
            'createdby': 'createdBy',
            'modifiedon': 'modifiedOn',
            'modifiedby': 'modifiedBy'
        },
        'contact': {
            'contactid': 'id',
            'firstname': 'firstName',
            'lastname': 'lastName',
            'fullname': 'fullName',
            'emailaddress1': 'emailAddress1',
            'telephone1': 'telephone1',
            'mobilephone': 'mobilePhone',
            'jobtitle': 'jobTitle',
            'parentcustomerid': 'parentCustomerId',
            'address1_line1': 'address1Line1',
            'address1_city': 'address1City',
            'address1_stateorprovince': 'address1StateOrProvince',
            'address1_postalcode': 'address1PostalCode',
            'address1_country': 'address1Country',
            'createdon': 'createdOn',
            'createdby': 'createdBy',
            'modifiedon': 'modifiedOn',
            'modifiedby': 'modifiedBy'
        },
        'product': {
            'productid': 'id',
            'productnumber': 'productNumber',
            'name': 'name',
            'description': 'description',
            'productstructure': 'productStructure',
            'producttypecode': 'productTypeCode',
            'quantityonhand': 'quantityOnHand',
            'quantitydecimal': 'quantityDecimal',
            'stockweight': 'stockWeight',
            'stockvolume': 'stockVolume',
            'price': 'price',
            'currentcost': 'currentCost',
            'standardcost': 'standardCost',
            'vendorid': 'vendorId',
            'vendorname': 'vendorName',
            'createdon': 'createdOn',
            'createdby': 'createdBy',
            'modifiedon': 'modifiedOn',
            'modifiedby': 'modifiedBy'
        },
        'quote': {
            'quoteid': 'id',
            'quotenumber': 'quoteNumber',
            'name': 'name',
            'customerid': 'customerId',
            'effectivefrom': 'effectiveFrom',
            'effectiveto': 'effectiveTo',
            'totalamount': 'totalAmount',
            'totaldiscountamount': 'totalDiscountAmount',
            'totallineitemamount': 'totalLineItemAmount',
            'statecode': 'stateCode',
            'statuscode': 'statusCode',
            'description': 'description',
            'ownerid': 'ownerId',
            'createdon': 'createdOn',
            'createdby': 'createdBy',
            'modifiedon': 'modifiedOn',
            'modifiedby': 'modifiedBy'
        },
        'salesorder': {
            'salesorderid': 'id',
            'ordernumber': 'orderNumber',
            'name': 'name',
            'customerid': 'customerId',
            'quoteid': 'quoteId',
            'datefulfilled': 'dateFulfilled',
            'requestdeliveryby': 'requestDeliveryBy',
            'totalamount': 'totalAmount',
            'totaldiscountamount': 'totalDiscountAmount',
            'totallineitemamount': 'totalLineItemAmount',
            'statecode': 'stateCode',
            'statuscode': 'statusCode',
            'description': 'description',
            'ownerid': 'ownerId',
            'createdon': 'createdOn',
            'createdby': 'createdBy',
            'modifiedon': 'modifiedOn',
            'modifiedby': 'modifiedBy'
        },
        'appointment': {
            'activityid': 'id',
            'subject': 'subject',
            'location': 'location',
            'scheduledstart': 'scheduledStart',
            'scheduledend': 'scheduledEnd',
            'actualdurationminutes': 'actualDurationMinutes',
            'scheduleddurationminutes': 'scheduledDurationMinutes',
            'description': 'description',
            'regardingobjectid': 'regardingObjectId',
            'ownerid': 'ownerId',
            'statecode': 'stateCode',
            'statuscode': 'statusCode',
            'createdon': 'createdOn',
            'createdby': 'createdBy',
            'modifiedon': 'modifiedOn',
            'modifiedby': 'modifiedBy'
        },
        'email': {
            'activityid': 'id',
            'subject': 'subject',
            'from': 'from',
            'to': 'to',
            'cc': 'cc',
            'bcc': 'bcc',
            'description': 'description',
            'directioncode': 'directionCode',
            'regardingobjectid': 'regardingObjectId',
            'ownerid': 'ownerId',
            'statecode': 'stateCode',
            'statuscode': 'statusCode',
            'createdon': 'createdOn',
            'createdby': 'createdBy',
            'modifiedon': 'modifiedOn',
            'modifiedby': 'modifiedBy'
        }
    }
    
    def __init__(self, erp_api_url: str = 'http://localhost:8000/api'):
        """Initialize migrator with D365 and ERP connections"""
        self.d365_auth = DynamicsAuthenticator()
        self.d365_base_url = self.d365_auth.get_api_base_url()
        self.erp_api_url = erp_api_url.rstrip('/')
        
        self.stats = {
            'total_fetched': 0,
            'total_migrated': 0,
            'total_failed': 0,
            'by_entity': {}
        }
    
    def fetch_d365_records(self, entity_name: str, select_fields: Optional[List[str]] = None) -> List[Dict]:
        """Fetch all records from a D365 entity"""
        try:
            # Get the correct D365 entity set name from mapping
            if entity_name not in self.ENTITY_MAPPING:
                print(f"  ✗ Unknown entity: {entity_name}")
                return []
            
            entity_set_name = self.ENTITY_MAPPING[entity_name]['d365_entity_set']
            
            headers = self.d365_auth.get_auth_headers()
            url = f"{self.d365_base_url}/{entity_set_name}"
            
            # Add $select if specific fields requested
            if select_fields:
                url += f"?$select={','.join(select_fields)}"
            
            print(f"  Fetching from: {url}")
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            records = data.get('value', [])
            print(f"  ✓ Fetched {len(records)} records")
            return records
            
        except requests.exceptions.RequestException as e:
            print(f"  ✗ Error fetching {entity_name}: {str(e)}")
            return []
    
    def _convert_to_camel_case(self, field_name: str) -> str:
        """
        Convert D365 field names to ASP.NET camelCase format
        
        Examples:
            cr694_deliveryno → deliveryNo
            cr694_employeeno → employeeNo
            cr694_jigstart → jigStart
            new_cellno → newCellNo
            activityid → activityId
        """
        # Remove cr694_ prefix if present
        if field_name.startswith('cr694_'):
            field_name = field_name[6:]
        
        # Handle special cases and common abbreviations
        # These need special handling to match ASP.NET's JSON serialization
        special_cases = {
            'id': 'Id',
            'no': 'No',
            'url': 'Url',
            'km': 'Km',
            'kms': 'Kms',
            'pdp': 'Pdp',
            'vat': 'Vat',
            'gps': 'Gps',
            'cof': 'Cof',
        }
        
        # Split on underscores
        parts = field_name.split('_')
        
        # Process each part
        result_parts = []
        for i, part in enumerate(parts):
            if i == 0:
                # First part stays lowercase
                result_parts.append(part.lower())
            else:
                # Check for special cases
                if part.lower() in special_cases:
                    result_parts.append(special_cases[part.lower()])
                else:
                    # Regular title case
                    result_parts.append(part.capitalize())
        
        return ''.join(result_parts)
    
    def transform_record(self, d365_record: Dict, entity_type: str) -> Dict:
        """Transform D365 record to match new ERP schema using explicit field mappings"""
        transformed = {}
        
        # Get field mapping for this entity type
        field_mapping = self.FIELD_MAPPINGS.get(entity_type, {})
        
        for d365_key, value in d365_record.items():
            # Skip OData metadata fields
            if d365_key.startswith('@'):
                continue
            
            # Use explicit mapping if available, otherwise use algorithmic conversion
            if d365_key.lower() in field_mapping:
                camel_case_key = field_mapping[d365_key.lower()]
            else:
                # Fallback to algorithmic conversion for unmapped fields
                camel_case_key = self._convert_to_camel_case(d365_key)
                print(f"  ⚠ Unmapped field: {d365_key} → {camel_case_key} (using fallback)")
            
            # Convert datetime strings to ISO format
            if isinstance(value, str) and ('date' in d365_key.lower() or 'time' in d365_key.lower() or d365_key.lower().endswith('on')):
                try:
                    # Try to parse as datetime
                    dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                    transformed[camel_case_key] = dt.isoformat()
                except:
                    # If parsing fails, keep original value
                    transformed[camel_case_key] = value
            # Convert numbers to strings for fields that might expect strings
            elif isinstance(value, (int, float)) and not isinstance(value, bool):
                transformed[camel_case_key] = str(value)
            else:
                transformed[camel_case_key] = value
        
        return transformed
    
    def migrate_entity(self, d365_entity_name: str) -> int:
        """Migrate all records from one D365 entity to new ERP"""
        if d365_entity_name not in self.ENTITY_MAPPING:
            print(f"⚠ Unknown entity: {d365_entity_name}")
            return 0
        
        mapping = self.ENTITY_MAPPING[d365_entity_name]
        endpoint = mapping['endpoint']
        
        print(f"\n{'='*60}")
        print(f"Migrating: {d365_entity_name} → {endpoint}")
        print(f"{'='*60}")
        
        # Fetch records from D365
        records = self.fetch_d365_records(d365_entity_name)
        
        if not records:
            print("  No records to migrate")
            self.stats['by_entity'][d365_entity_name] = {'fetched': 0, 'migrated': 0, 'failed': 0}
            return 0
        
        # Track migration stats for this entity
        entity_stats = {'fetched': len(records), 'migrated': 0, 'failed': 0}
        
        # Migrate each record
        for i, record in enumerate(records, 1):
            try:
                # Transform record
                transformed = self.transform_record(record, d365_entity_name)
                
                # Post to new ERP API
                url = f"{self.erp_api_url}/{endpoint}"
                response = requests.post(url, json=transformed)
                
                if response.status_code in [200, 201]:
                    entity_stats['migrated'] += 1
                    name = record.get(mapping['name_field'], 'Unknown')
                    print(f"  [{i}/{len(records)}] ✓ Migrated: {name}")
                else:
                    entity_stats['failed'] += 1
                    print(f"  [{i}/{len(records)}] ✗ Failed (HTTP {response.status_code}): {response.text[:100]}")
                    
            except Exception as e:
                entity_stats['failed'] += 1
                print(f"  [{i}/{len(records)}] ✗ Error: {str(e)}")
        
        # Update global stats
        self.stats['total_fetched'] += entity_stats['fetched']
        self.stats['total_migrated'] += entity_stats['migrated']
        self.stats['total_failed'] += entity_stats['failed']
        self.stats['by_entity'][d365_entity_name] = entity_stats
        
        print(f"\n  Summary: {entity_stats['migrated']}/{entity_stats['fetched']} migrated successfully")
        return entity_stats['migrated']
    
    def migrate_all(self):
        """Migrate all Millennium entities from D365 to new ERP"""
        print("\n" + "="*70)
        print("MILLENNIUM ROOFING DATA MIGRATION")
        print("Dynamics 365 → New ERP System")
        print("="*70)
        
        start_time = datetime.now()
        
        # Migrate all entities in order
        for entity_name in self.ENTITY_MAPPING.keys():
            self.migrate_entity(entity_name)
        
        # Print final summary
        duration = (datetime.now() - start_time).total_seconds()
        
        print("\n" + "="*70)
        print("MIGRATION COMPLETE")
        print("="*70)
        print(f"\nTotal Duration: {duration:.1f} seconds")
        print(f"Total Records Fetched: {self.stats['total_fetched']}")
        print(f"Successfully Migrated: {self.stats['total_migrated']}")
        print(f"Failed: {self.stats['total_failed']}")
        
        print("\nPer-Entity Breakdown:")
        for entity, stats in self.stats['by_entity'].items():
            success_rate = (stats['migrated'] / stats['fetched'] * 100) if stats['fetched'] > 0 else 0
            print(f"  {entity:30} {stats['migrated']:4}/{stats['fetched']:4} ({success_rate:5.1f}%)")


def main():
    """Run the migration"""
    try:
        migrator = D365ToERPMigrator()
        migrator.migrate_all()
        
    except Exception as e:
        print(f"\n✗ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
