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
        'quotedetail': {
            'd365_entity_set': 'quotedetails',
            'endpoint': 'd365quotedetails',
            'primary_key': 'quotedetailid',
            'name_field': 'productdescription'
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
            '_cr694_approveddriver_value': 'approvedDriver',
            'cr694_cofinorder': 'cofInOrder',
            'cr694_licenserenewaldate': 'licenseRenewalDate',
            'cr694_make': 'make',
            'cr694_model': 'model',
            'cr694_name': 'name',
            'cr694_registrationnumber': 'registrationNumber',
            'cr694_yearmodel': 'yearModel',
            'createdon': 'createdOn',
            '_createdby_value': 'createdBy',
            'modifiedon': 'modifiedOn',
            '_modifiedby_value': 'modifiedBy'
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
            '_cr694_customer_value': 'customer',
            'cr694_jigend': 'jigEnd',
            '_cr694_jighelper1_value': 'jigHelper1',
            '_cr694_jighelper2_value': 'jigHelper2',
            '_cr694_jighelper3_value': 'jigHelper3',
            '_cr694_jighelper4_value': 'jigHelper4',
            '_cr694_jigleader_value': 'jigLeader',
            'cr694_jigstart': 'jigStart',
            'cr694_name': 'name',
            '_cr694_orderno_value': 'orderNo',
            'cr694_pickend': 'pickEnd',
            '_cr694_pickinghelper1_value': 'pickingHelper1',
            '_cr694_pickinghelper2_value': 'pickingHelper2',
            '_cr694_pickinghelper3_value': 'pickingHelper3',
            '_cr694_pickingmaster_value': 'pickingMaster',
            'cr694_pickstart': 'pickStart',
            'cr694_productioncomplete': 'productionComplete',
            'cr694_productionplanneddate': 'productionPlannedDate',
            'cr694_sawend': 'sawEnd',
            '_cr694_sawhelper1_value': 'sawHelper1',
            '_cr694_sawhelper2_value': 'sawHelper2',
            '_cr694_sawoperator_value': 'sawOperator',
            'cr694_sawstart': 'sawStart',
            'cr694_totalcuts': 'totalCuts',
            'cr694_totaltimbercubes': 'totalTimberCubes',
            'cr694_trusscost': 'trussCost',
            'cr694_trussselling': 'trussSelling',
            'cr694_workunitsefinks': 'workUnitsEfinks',
            'new_estimatedefinks': 'newEstimateDefinks',
            'createdon': 'createdOn',
            '_createdby_value': 'createdBy',
            'modifiedon': 'modifiedOn',
            '_modifiedby_value': 'modifiedBy'
        },
        'cr694_logistics': {
            'cr694_logisticsid': 'id',
            'cr694_deliveryno': 'deliveryNo',
            'cr694_description': 'description',
            '_cr694_dispatchmanager_value': 'dispatchManager',
            '_cr694_driver_value': 'driver',
            '_cr694_helper1_value': 'helper1',
            '_cr694_helper2_value': 'helper2',
            '_cr694_helper3_value': 'helper3',
            '_cr694_helper4_value': 'helper4',
            '_cr694_helper5_value': 'helper5',
            '_cr694_loadmaster_value': 'loadMaster',
            'cr694_plannedloaddate': 'plannedLoadDate',
            '_cr694_security_value': 'security',
            '_cr694_trailer_value': 'trailer',
            '_cr694_vehicle_value': 'vehicle',
            'new_kmstravelled': 'newKmsTravelled',
            'new_kmstravelled_date': 'newKmsTravelledDate',
            'new_kmstravelled_state': 'newKmsTravelledState',
            'new_loadcompleted': 'newLoadCompleted',
            'new_loadduration': 'newLoadDuration',
            'new_loadduration_date': 'newLoadDurationDate',
            'new_loadduration_state': 'newLoadDurationState',
            'createdon': 'createdOn',
            '_createdby_value': 'createdBy',
            'modifiedon': 'modifiedOn',
            '_modifiedby_value': 'modifiedBy'
        },
        'cr694_dispatch': {
            'activityid': 'id',
            'cr694_deliveryno': 'deliveryNo',
            '_cr694_customer_value': 'customer',
            '_cr694_orderno_value': 'orderNo',
            'cr694_loadingdate': 'loadingDate',
            '_cr694_driver_value': 'driver',
            '_cr694_helper1_value': 'helper1',
            '_cr694_helper2_value': 'helper2',
            '_cr694_helper3_value': 'helper3',
            '_cr694_helper_value': 'helper4',
            '_cr694_helper5_value': 'helper5',
            '_cr694_loadmaster_value': 'loadMaster',
            '_cr694_dispatchmanager_value': 'dispatchManager',
            '_cr694_vehicle_value': 'vehicle',
            '_cr694_trailer_value': 'trailer',
            '_cr694_security_value': 'security',
            '_cr694_salesorder_value': 'salesOrder',
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
            '_createdby_value': 'createdBy',
            'modifiedon': 'modifiedOn',
            '_modifiedby_value': 'modifiedBy'
        },
        # D365 Standard Entities Field Mappings
        'account': {
            # Basic Information
            'accountid': 'id',
            'name': 'name',
            'accountnumber': 'accountNumber',
            
            # Contact Information
            'telephone1': 'telephone1',
            'telephone2': 'telephone2',
            'telephone3': 'telephone3',
            'fax': 'fax',
            'emailaddress1': 'emailAddress1',
            'emailaddress2': 'emailAddress2',
            'emailaddress3': 'emailAddress3',
            'websiteurl': 'websiteUrl',
            'ftpsiteurl': 'ftpSiteUrl',
            
            # Primary Address (Address 1)
            'address1_addressid': 'address1AddressId',
            'address1_addresstypecode': 'address1AddressTypeCode',
            'address1_name': 'address1Name',
            'address1_primarycontactname': 'address1PrimaryContactName',
            'address1_line1': 'address1Line1',
            'address1_line2': 'address1Line2',
            'address1_line3': 'address1Line3',
            'address1_city': 'address1City',
            'address1_stateorprovince': 'address1StateOrProvince',
            'address1_county': 'address1County',
            'address1_country': 'address1Country',
            'address1_postalcode': 'address1PostalCode',
            'address1_postofficebox': 'address1PostOfficeBox',
            'address1_latitude': 'address1Latitude',
            'address1_longitude': 'address1Longitude',
            'address1_shippingmethodcode': 'address1ShippingMethodCode',
            'address1_telephone1': 'address1Telephone1',
            'address1_telephone2': 'address1Telephone2',
            'address1_telephone3': 'address1Telephone3',
            'address1_fax': 'address1Fax',
            'address1_composite': 'address1Composite',
            'address1_upszone': 'address1UpsZone',
            'address1_utcoffset': 'address1UtcOffset',
            'address1_freighttermscode': 'address1FreightTermsCode',
            
            # Secondary Address (Address 2)
            'address2_addressid': 'address2AddressId',
            'address2_addresstypecode': 'address2AddressTypeCode',
            'address2_name': 'address2Name',
            'address2_primarycontactname': 'address2PrimaryContactName',
            'address2_line1': 'address2Line1',
            'address2_line2': 'address2Line2',
            'address2_line3': 'address2Line3',
            'address2_city': 'address2City',
            'address2_stateorprovince': 'address2StateOrProvince',
            'address2_county': 'address2County',
            'address2_country': 'address2Country',
            'address2_postalcode': 'address2PostalCode',
            'address2_postofficebox': 'address2PostOfficeBox',
            'address2_latitude': 'address2Latitude',
            'address2_longitude': 'address2Longitude',
            'address2_shippingmethodcode': 'address2ShippingMethodCode',
            'address2_telephone1': 'address2Telephone1',
            'address2_telephone2': 'address2Telephone2',
            'address2_telephone3': 'address2Telephone3',
            'address2_fax': 'address2Fax',
            'address2_composite': 'address2Composite',
            'address2_upszone': 'address2UpsZone',
            'address2_utcoffset': 'address2UtcOffset',
            'address2_freighttermscode': 'address2FreightTermsCode',
            
            # Business Information
            'description': 'description',
            'revenue': 'revenue',
            'revenue_base': 'revenueBase',
            'numberofemployees': 'numberOfEmployees',
            'industrycode': 'industryCode',
            'sic': 'sic',
            'tickersymbol': 'tickerSymbol',
            'stockexchange': 'stockExchange',
            'sharesoutstanding': 'sharesOutstanding',
            'marketcap': 'marketCap',
            'marketcap_base': 'marketCapBase',
            
            # Custom Fields (Millennium-specific)
            'cr694_accounttype': 'cr694AccountType',
            'cr694_companyregistrationnumber': 'cr694CompanyRegistrationNumber',
            'cr694_companytype': 'cr694CompanyType',
            'cr694_vatregistrationno': 'cr694VatRegistrationNo',
            '_cr694_businesstype_value': 'cr694BusinessTypeValue',
            '_cr694_salesrepresentative_value': 'cr694SalesRepresentativeValue',
            
            # Account Classification
            'accountcategorycode': 'accountCategoryCode',
            'accountclassificationcode': 'accountClassificationCode',
            'accountratingcode': 'accountRatingCode',
            'businesstypecode': 'businessTypeCode',
            'customersizecode': 'customerSizeCode',
            'customertypecode': 'customerTypeCode',
            'ownershipcode': 'ownershipCode',
            'territorycode': 'territoryCode',
            
            # Credit & Financial
            'creditlimit': 'creditLimit',
            'creditlimit_base': 'creditLimitBase',
            'creditonhold': 'creditOnHold',
            'paymenttermscode': 'paymentTermsCode',
            'aging30': 'aging30',
            'aging30_base': 'aging30Base',
            'aging60': 'aging60',
            'aging60_base': 'aging60Base',
            'aging90': 'aging90',
            'aging90_base': 'aging90Base',
            
            # Communication Preferences
            'donotbulkemail': 'doNotBulkEmail',
            'donotbulkpostalmail': 'doNotBulkPostalMail',
            'donotemail': 'doNotEmail',
            'donotfax': 'doNotFax',
            'donotphone': 'doNotPhone',
            'donotpostalmail': 'doNotPostalMail',
            'donotsendmm': 'doNotSendMM',
            'followemail': 'followEmail',
            'preferredcontactmethodcode': 'preferredContactMethodCode',
            'preferredappointmentdaycode': 'preferredAppointmentDayCode',
            'preferredappointmenttimecode': 'preferredAppointmentTimeCode',
            
            # Marketing
            'marketingonly': 'marketingOnly',
            'lastusedincampaign': 'lastUsedInCampaign',
            
            # Status & Workflow
            'statecode': 'stateCode',
            'statuscode': 'statusCode',
            'participatesinworkflow': 'participatesInWorkflow',
            'merged': 'merged',
            'onholdtime': 'onHoldTime',
            'lastonholdtime': 'lastOnHoldTime',
            
            # Relationships (Lookup GUIDs)
            'ownerid': 'ownerId',
            '_ownerid_value': 'ownerId',
            '_owningbusinessunit_value': 'owningBusinessUnitValue',
            '_owninguser_value': 'owningUserValue',
            '_owningteam_value': 'owningTeamValue',
            '_primarycontactid_value': 'primaryContactIdValue',
            '_parentaccountid_value': 'parentAccountIdValue',
            '_preferredsystemuserid_value': 'preferredSystemUserIdValue',
            '_preferredserviceid_value': 'preferredServiceIdValue',
            '_preferredequipmentid_value': 'preferredEquipmentIdValue',
            '_defaultpricelevelid_value': 'defaultPriceLevelIdValue',
            '_masterid_value': 'masterIdValue',
            '_originatingleadid_value': 'originatingLeadIdValue',
            '_territoryid_value': 'territoryIdValue',
            '_transactioncurrencyid_value': 'transactionCurrencyIdValue',
            '_slaid_value': 'slaIdValue',
            '_slainvokedid_value': 'slaInvokedIdValue',
            
            # Exchange & Currency
            'exchangerate': 'exchangeRate',
            
            # Performance Metrics
            'opendeals': 'openDeals',
            'opendeals_date': 'openDealsDate',
            'opendeals_state': 'openDealsState',
            'openrevenue': 'openRevenue',
            'openrevenue_base': 'openRevenueBase',
            'openrevenue_date': 'openRevenueDate',
            'openrevenue_state': 'openRevenueState',
            
            # Social
            'primarysatoriid': 'primarySatoriId',
            'primarytwitterid': 'primaryTwitterId',
            'yominame': 'yomiName',
            
            # Dynamics 365-specific
            'msdyn_externalaccountid': 'msdynExternalAccountId',
            'msdyn_gdproptout': 'msdynGdprOptOut',
            'msdyn_taxexempt': 'msdynTaxExempt',
            'msdyn_taxexemptnumber': 'msdynTaxExemptNumber',
            'msdyn_travelcharge': 'msdynTravelCharge',
            'msdyn_travelcharge_base': 'msdynTravelChargeBase',
            'msdyn_travelchargetype': 'msdynTravelChargeType',
            'msdyn_workorderinstructions': 'msdynWorkOrderInstructions',
            'msdyn_primarytimezone': 'msdynPrimaryTimezone',
            '_msdyn_salestaxcode_value': 'msdynSalesTaxCodeValue',
            '_msdyn_serviceterritory_value': 'msdynServiceTerritoryValue',
            '_msdyn_billingaccount_value': 'msdynBillingAccountValue',
            '_msdyn_workhourtemplate_value': 'msdynWorkHourTemplateValue',
            '_msdyn_preferredresource_value': 'msdynPreferredResourceValue',
            '_msdyn_accountkpiid_value': 'msdynAccountKpiIdValue',
            '_msdyn_salesaccelerationinsightid_value': 'msdynSalesAccelerationInsightIdValue',
            '_msdyn_segmentid_value': 'msdynSegmentIdValue',
            '_msa_managingpartnerid_value': 'msaManagingPartnerIdValue',
            
            # Workflow & Process
            'processid': 'processId',
            'stageid': 'stageId',
            'traversedpath': 'traversedPath',
            
            # System Fields
            'createdon': 'createdOn',
            'modifiedon': 'modifiedOn',
            '_createdby_value': 'createdByValue',
            '_modifiedby_value': 'modifiedByValue',
            '_createdonbehalfby_value': 'createdOnBehalfByValue',
            '_modifiedonbehalfby_value': 'modifiedOnBehalfByValue',
            'createdby': 'createdBy',
            'modifiedby': 'modifiedBy',
            'overriddencreatedon': 'overriddenCreatedOn',
            'importsequencenumber': 'importSequenceNumber',
            'timezoneruleversionnumber': 'timeZoneRuleVersionNumber',
            'utcconversiontimezonecode': 'utcConversionTimeZoneCode',
            'versionnumber': 'versionNumber',
            'teamsfollowed': 'teamsFollowed',
            'timespentbymeonemailandmeetings': 'timeSpentByMeOnEmailAndMeetings',
            
            # Image
            'entityimageid': 'entityImageId',
            'entityimage_timestamp': 'entityImageTimestamp',
            'entityimage_url': 'entityImageUrl',
            
            # Portal/ADX fields
            'adx_createdbyipaddress': 'adxCreatedByIpAddress',
            'adx_createdbyusername': 'adxCreatedByUsername',
            'adx_modifiedbyipaddress': 'adxModifiedByIpAddress',
            'adx_modifiedbyusername': 'adxModifiedByUsername',
            
            # External Party
            '_createdbyexternalparty_value': 'createdByExternalPartyValue',
            '_modifiedbyexternalparty_value': 'modifiedByExternalPartyValue',
            
            'shippingmethodcode': 'shippingMethodCode'
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
            # Primary and Basic Fields
            'quoteid': 'Id',
            'quotenumber': 'QuoteNumber',
            'name': 'Name',
            '_customerid_value': 'CustomerId',
            
            # Date Fields
            'effectivefrom': 'EffectiveFrom',
            'effectiveto': 'EffectiveTo',
            'expireson': 'ExpiresOn',
            'requestdeliveryby': 'RequestDeliveryBy',
            'closedon': 'ClosedOn',
            
            # Billing Address
            'billto_name': 'BillTo_Name',
            'billto_line1': 'BillTo_Line1',
            'billto_city': 'BillTo_City',
            'billto_stateorprovince': 'BillTo_StateOrProvince',
            'billto_postalcode': 'BillTo_PostalCode',
            'billto_country': 'BillTo_Country',
            'billto_telephone': 'BillTo_Telephone',
            'billto_latitude': 'BillTo_Latitude',
            'billto_longitude': 'BillTo_Longitude',
            
            # Shipping Address
            'shipto_name': 'ShipTo_Name',
            'shipto_line1': 'ShipTo_Line1',
            'shipto_city': 'ShipTo_City',
            'shipto_stateorprovince': 'ShipTo_StateOrProvince',
            'shipto_postalcode': 'ShipTo_PostalCode',
            'shipto_country': 'ShipTo_Country',
            'shipto_telephone': 'ShipTo_Telephone',
            'shipto_latitude': 'ShipTo_Latitude',
            'shipto_longitude': 'ShipTo_Longitude',
            
            # Financial Fields
            'totalamount': 'TotalAmount',
            'totaldiscountamount': 'TotalDiscountAmount',
            'totallineitemamount': 'TotalLineItemAmount',
            'totalamountlessfreight': 'TotalAmountLessFreight',
            'totaltax': 'TotalTax',
            'freightamount': 'FreightAmount',
            'discountpercentage': 'DiscountPercentage',
            
            # Status Fields
            'statecode': 'StateCode',
            'statuscode': 'StatusCode',
            'description': 'Description',
            
            # Reference Fields (Lookups)
            '_ownerid_value': 'OwnerId',
            '_opportunityid_value': 'OpportunityId',
            '_pricelevelid_value': 'PriceLevelId',
            '_transactioncurrencyid_value': 'TransactionCurrencyId',
            
            # Contact Information
            'contactname': 'ContactName',
            'contacttelephone': 'ContactTelephone',
            'contactemail': 'ContactEmail',
            
            # Audit Fields
            'createdon': 'CreatedOn',
            'modifiedon': 'ModifiedOn',
            '_createdby_value': 'CreatedBy',
            '_modifiedby_value': 'ModifiedBy'
        },
        'quotedetail': {
            # Primary and Foreign Keys
            'quotedetailid': 'Id',
            '_quoteid_value': 'QuoteId',
            '_productid_value': 'ProductId',
            
            # Product Information
            'productdescription': 'ProductName',  # D365 standard field for product name in quote detail
            'description': 'Description',
            
            # Pricing and Quantity
            'quantity': 'Quantity',
            'priceperunit': 'PricePerUnit',
            'baseamount': 'BaseAmount',
            'manualdiscountamount': 'ManualDiscountAmount',
            'tax': 'Tax',
            'extendedamount': 'ExtendedAmount',
            
            # Line Information
            'lineitemnumber': 'LineItemNumber',
            
            # Audit Fields
            'createdon': 'CreatedOn',
            'modifiedon': 'ModifiedOn',
            '_createdby_value': 'CreatedBy',
            '_modifiedby_value': 'ModifiedBy'
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


def migrate_quotes(migrator: 'D365ToERPMigrator') -> int:
    """
    Migrate quotes from D365 to the new database
    
    Args:
        migrator: D365ToERPMigrator instance
        
    Returns:
        Number of quotes successfully migrated
    """
    return migrator.migrate_entity('quote')


def migrate_quote_details(migrator: 'D365ToERPMigrator') -> int:
    """
    Migrate quote details (line items) from D365 to the new database
    
    Args:
        migrator: D365ToERPMigrator instance
        
    Returns:
        Number of quote details successfully migrated
    """
    return migrator.migrate_entity('quotedetail')


def main():
    """Run the migration
    
    Usage:
        python migrate_data.py                          # Migrate all entities
        python migrate_data.py account                  # Migrate only accounts
        python migrate_data.py account contact          # Migrate multiple entities
        python migrate_data.py --entities quote quotedetail  # Using --entities flag
    """
    try:
        migrator = D365ToERPMigrator()
        
        # Parse command line arguments
        requested_entities = []
        
        if len(sys.argv) > 1:
            # Check if --entities flag is used
            if sys.argv[1] == '--entities':
                # Use entities after --entities flag
                requested_entities = sys.argv[2:]
            else:
                # Use positional arguments (backward compatible)
                requested_entities = sys.argv[1:]
        
        # Check if specific entities were requested
        if requested_entities:
            # Validate all requested entities exist
            invalid_entities = [e for e in requested_entities if e not in migrator.ENTITY_MAPPING]
            if invalid_entities:
                print(f"\n✗ Unknown entities: {', '.join(invalid_entities)}")
                print(f"\nAvailable entities: {', '.join(migrator.ENTITY_MAPPING.keys())}")
                return 1
            
            # Migrate requested entities
            print("\n" + "="*70)
            print("MILLENNIUM ROOFING DATA MIGRATION")
            print("Dynamics 365 → New ERP System")
            print(f"Entities: {', '.join(requested_entities)}")
            print("="*70)
            
            for entity in requested_entities:
                # Use convenience functions for quote entities if available
                if entity == 'quote':
                    migrate_quotes(migrator)
                elif entity == 'quotedetail':
                    migrate_quote_details(migrator)
                else:
                    migrator.migrate_entity(entity)
            
            # Print summary
            print("\n" + "="*70)
            print("MIGRATION COMPLETE")
            print("="*70)
            print(f"\nTotal Records Fetched: {migrator.stats['total_fetched']}")
            print(f"Successfully Migrated: {migrator.stats['total_migrated']}")
            print(f"Failed: {migrator.stats['total_failed']}")
        else:
            # No entities specified - migrate all
            migrator.migrate_all()
        
    except Exception as e:
        print(f"\n✗ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
