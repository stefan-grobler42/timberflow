# ExtractSpec Solution - Complete Analysis

**Solution:** ExtractSpec
**Version:** 1.0.0.1
**Total Components:** 388

## Component Breakdown

- **Attribute:** 177
- **Entity:** 115
- **Entity Relationship:** 67
- **Option Set:** 4
- **Plugin Assembly:** 1
- **System Form:** 3
- **Unknown (10042):** 2
- **Unknown (10060):** 6
- **Unknown (300):** 1
- **Unknown (61):** 5
- **Unknown (70):** 1
- **Web Resource:** 5
- **Workflow:** 1

---

## Millennium Roofing Custom Entities (11)

### Quote - MRoofing

- **Logical Name:** `cr694_quotemroofing`
- **Schema Name:** `cr694_QuoteMRoofing`
- **Primary ID:** `cr694_quotemroofingid`
- **Primary Name:** `cr694_name`
- **Total Fields:** 36
- **Forms:** 1
- **Relationships:** 19

**Key Fields:**

- `cr694_account` - Account (Lookup)
- `cr694_accountname` -  (String)
- `cr694_accountyominame` -  (String)
- `cr694_name` - Quote Number (String) *(Required)*
- `cr694_quotemroofingid` - Quote - MRoofing (Uniqueidentifier)
- `importsequencenumber` - Import Sequence Number (Integer)
- `overriddencreatedon` - Record Created On (DateTime)
- `owningbusinessunit` - Owning Business Unit (Lookup)
- `owningbusinessunitname` -  (String)
- `owningteam` - Owning Team (Lookup)
- `owninguser` - Owning User (Lookup)
- `timezoneruleversionnumber` - Time Zone Rule Version Number (Integer)
- `utcconversiontimezonecode` - UTC Conversion Time Zone Code (Integer)
- `versionnumber` - Version Number (BigInt)

### Delivery

- **Logical Name:** `cr694_dispatch`
- **Schema Name:** `cr694_Dispatch`
- **Primary ID:** `activityid`
- **Primary Name:** `subject`
- **Total Fields:** 138
- **Forms:** 1
- **Relationships:** 143

**Key Fields:**

- `activityadditionalparams` - Activity Additional Parameters (Memo)
- `activityid` - Activity (Uniqueidentifier)
- `activitytypecode` - Activity Type (EntityName)
- `activitytypecodename` -  (Virtual)
- `actualdurationminutes` - Actual Duration (Integer)
- `actualend` - Actual End (DateTime)
- `actualstart` - Actual Start (DateTime)
- `bcc` - BCC (PartyList)
- `cc` - CC (PartyList)
- `community` - Social Channel (Picklist)
- `communityname` -  (Virtual)
- `cr694_arrivaltime` - Arrival Time (Factory) (DateTime)
- `cr694_arrivaltimesite` - Arrival Time (Site) (DateTime)
- `cr694_closekms` - From Km's (String)
- `cr694_customer` - Customer (Customer)
- `cr694_customeridtype` -  (EntityName)
- `cr694_customername` -  (String)
- `cr694_customeryominame` -  (String)
- `cr694_deliveryno` - Trip No. (String)
- `cr694_departuretime` - Departure Time (Factory) (DateTime)

### Logistics

- **Logical Name:** `cr694_logistics`
- **Schema Name:** `cr694_Logistics`
- **Primary ID:** `cr694_logisticsid`
- **Primary Name:** `cr694_deliveryno`
- **Total Fields:** 65
- **Forms:** 1
- **Relationships:** 30

**Key Fields:**

- `cr694_deliveryno` - Delivery No. (String)
- `cr694_description` - Description (String)
- `cr694_dispatchmanager` - Dispatch Manager (Lookup)
- `cr694_dispatchmanagername` -  (String)
- `cr694_driver` - Driver (Lookup)
- `cr694_drivername` -  (String)
- `cr694_helper1` - Helper 1 (Lookup)
- `cr694_helper1name` -  (String)
- `cr694_helper2` - Helper 2 (Lookup)
- `cr694_helper2name` -  (String)
- `cr694_helper3` - Helper 3 (Lookup)
- `cr694_helper3name` -  (String)
- `cr694_helper4` - Helper 4 (Lookup)
- `cr694_helper4name` -  (String)
- `cr694_helper5` - Helper 5 (Lookup)
- `cr694_helper5name` -  (String)
- `cr694_loadmaster` - Load Master (Lookup)
- `cr694_loadmastername` -  (String)
- `cr694_logisticsid` - Logistics (Uniqueidentifier)
- `cr694_plannedloaddate` - Planned Load Date (DateTime)

### Designer

- **Logical Name:** `cr694_designer`
- **Schema Name:** `cr694_Designer`
- **Primary ID:** `cr694_designerid`
- **Primary Name:** `cr694_name`
- **Total Fields:** 41
- **Forms:** 1
- **Relationships:** 21

**Key Fields:**

- `cr694_cellnumber` - Cell Number (String)
- `cr694_designerid` - Designer (Uniqueidentifier)
- `cr694_emailaddress` - E-Mail Address (String)
- `cr694_employeeno` - Employee No. (String)
- `cr694_name` - Display Name (String) *(Required)*
- `cr694_surname` - Surname (String)
- `importsequencenumber` - Import Sequence Number (Integer)
- `new_displaynamecalculated` - Display Name (Calculated) (String)
- `new_employeefile` - Employee File (Lookup)
- `new_employeefilename` -  (String)
- `new_name` - Name (String)
- `overriddencreatedon` - Record Created On (DateTime)
- `owningbusinessunit` - Owning Business Unit (Lookup)
- `owningbusinessunitname` -  (String)
- `owningteam` - Owning Team (Lookup)
- `owninguser` - Owning User (Lookup)
- `timezoneruleversionnumber` - Time Zone Rule Version Number (Integer)
- `utcconversiontimezonecode` - UTC Conversion Time Zone Code (Integer)
- `versionnumber` - Version Number (BigInt)

### Vehicles

- **Logical Name:** `cr694_vehicles`
- **Schema Name:** `cr694_Vehicles`
- **Primary ID:** `cr694_vehiclesid`
- **Primary Name:** `cr694_name`
- **Total Fields:** 46
- **Forms:** 1
- **Relationships:** 25

**Key Fields:**

- `cr694_approveddriver` - Primary Driver (Lookup)
- `cr694_approveddrivername` -  (String)
- `cr694_cofinorder` - COF In Order (Boolean)
- `cr694_cofinordername` -  (Virtual)
- `cr694_licenserenewaldate` - License Renewal Date (DateTime)
- `cr694_make` - Make (String)
- `cr694_model` - Model (String)
- `cr694_name` - Name (String)
- `cr694_registrationnumber` - Registration Number (String)
- `cr694_type` - Type (Picklist)
- `cr694_typename` -  (Virtual)
- `cr694_vehiclesid` - Vehicles (Uniqueidentifier)
- `cr694_yearmodel` - Year Model (String)
- `importsequencenumber` - Import Sequence Number (Integer)
- `new_displayname` - Display Name (String)
- `new_name` - Name (1) (String) *(Required)*
- `overriddencreatedon` - Record Created On (DateTime)
- `owningbusinessunit` - Owning Business Unit (Lookup)
- `owningbusinessunitname` -  (String)
- `owningteam` - Owning Team (Lookup)

### Sale Representative

- **Logical Name:** `cr694_salerepresentative`
- **Schema Name:** `cr694_SaleRepresentative`
- **Primary ID:** `cr694_salerepresentativeid`
- **Primary Name:** `cr694_name`
- **Total Fields:** 41
- **Forms:** 1
- **Relationships:** 21

**Key Fields:**

- `cr694_cellnumber` - Cell Number (String)
- `cr694_emailaddress` - E-Mail Address (String)
- `cr694_employeeno` - Employee No. (String)
- `cr694_name` - Display Name (String)
- `cr694_salerepresentativeid` - Sale Representative (Uniqueidentifier)
- `cr694_surname` - Surname (String)
- `importsequencenumber` - Import Sequence Number (Integer)
- `new_displayname` - Display Name (Calculated) (String)
- `new_employeefile` - Employee File (Lookup)
- `new_employeefilename` -  (String)
- `new_name` - Name (String)
- `overriddencreatedon` - Record Created On (DateTime)
- `owningbusinessunit` - Owning Business Unit (Lookup)
- `owningbusinessunitname` -  (String)
- `owningteam` - Owning Team (Lookup)
- `owninguser` - Owning User (Lookup)
- `timezoneruleversionnumber` - Time Zone Rule Version Number (Integer)
- `utcconversiontimezonecode` - UTC Conversion Time Zone Code (Integer)
- `versionnumber` - Version Number (BigInt)

### Production

- **Logical Name:** `cr694_production`
- **Schema Name:** `cr694_Production`
- **Primary ID:** `cr694_productionid`
- **Primary Name:** `cr694_name`
- **Total Fields:** 78
- **Forms:** 1
- **Relationships:** 34

**Key Fields:**

- `cr694_customer` - Customer (Customer)
- `cr694_customeridtype` -  (EntityName)
- `cr694_customername` -  (String)
- `cr694_customeryominame` -  (String)
- `cr694_jigend` - Jig End (DateTime)
- `cr694_jighelper1` - Jig - Helper 1 (Lookup)
- `cr694_jighelper1name` -  (String)
- `cr694_jighelper2` - Jig - Helper 2 (Lookup)
- `cr694_jighelper2name` -  (String)
- `cr694_jighelper3` - Jig - Helper 3 (Lookup)
- `cr694_jighelper3name` -  (String)
- `cr694_jighelper4` - Jig - Helper 4 (Lookup)
- `cr694_jighelper4name` -  (String)
- `cr694_jigleader` - Jig - Leader (Lookup)
- `cr694_jigleadername` -  (String)
- `cr694_jigstart` - Jig Start (DateTime)
- `cr694_name` - Name (String) *(Required)*
- `cr694_orderno` - Order No. (Lookup)
- `cr694_ordernoname` -  (String)
- `cr694_pickend` - Pick End (DateTime)

### Tender

- **Logical Name:** `cr694_tender`
- **Schema Name:** `cr694_Tender`
- **Primary ID:** `cr694_tenderid`
- **Primary Name:** `cr694_name`
- **Description:** Tenders
- **Total Fields:** 67
- **Forms:** 1
- **Relationships:** 26

**Key Fields:**

- `cr694_addressname` - Address Name (String)
- `cr694_closingdate` - Closing Date (DateTime)
- `cr694_contact` - Contact (Lookup)
- `cr694_contactname` -  (String)
- `cr694_contactyominame` -  (String)
- `cr694_customer` - Customer (Customer)
- `cr694_customeridtype` -  (EntityName)
- `cr694_customername` -  (String)
- `cr694_customeryominame` -  (String)
- `cr694_description` - Description (String)
- `cr694_distancetosite` - Distance to site (Decimal)
- `cr694_filelink` - File Link (String)
- `cr694_name` - Name (String) *(Required)*
- `cr694_quoteno` - Quote No. (Lookup)
- `cr694_quotenoname` -  (String)
- `cr694_roofcoveringsheeting` - Roof Covering - Sheeting (Boolean)
- `cr694_roofcoveringsheetingname` -  (Virtual)
- `cr694_roofcoveringtiles` - Roof Covering - Tiles (Boolean)
- `cr694_roofcoveringtilesname` -  (Virtual)
- `cr694_streetaddress` - Street Address (String)

### Employee

- **Logical Name:** `cr694_drivers`
- **Schema Name:** `cr694_Drivers`
- **Primary ID:** `cr694_driversid`
- **Primary Name:** `cr694_name`
- **Total Fields:** 65
- **Forms:** 1
- **Relationships:** 55

**Key Fields:**

- `cr694_allowdriving` - Allow Driving (Boolean)
- `cr694_allowdrivingname` -  (Virtual)
- `cr694_driversid` - Drivers (Uniqueidentifier)
- `cr694_driverslicenseno` - Drivers License No. (String)
- `cr694_employeeno` - Employee No. (String)
- `cr694_hourlyrate` - Hourly Rate (Money)
- `cr694_hourlyrate_base` - Hourly Rate (Base) (Money)
- `cr694_idno` - ID No. (String)
- `cr694_jobdescription` - Job Description (String)
- `cr694_name` - Display Name (String)
- `cr694_pdp` - PDP (Boolean)
- `cr694_pdpexpirydate` - PDP Expiry Date (DateTime)
- `cr694_pdpname` -  (Virtual)
- `cr694_pdpno` - PDP No. (String)
- `cr694_surname` - Surname  (String)
- `exchangerate` - Exchange Rate (Decimal)
- `importsequencenumber` - Import Sequence Number (Integer)
- `new_activeemployee` - Active Employee (Boolean)
- `new_activeemployeename` -  (Virtual)
- `new_cellno` - Cell No. (Integer)

### Installation Progress

- **Logical Name:** `cr694_installationprogress`
- **Schema Name:** `cr694_InstallationProgress`
- **Primary ID:** `cr694_installationprogressid`
- **Primary Name:** `cr694_name`
- **Total Fields:** 35
- **Forms:** 1
- **Relationships:** 17

**Key Fields:**

- `cr694_installationprogressid` - Installation Progress (Uniqueidentifier)
- `cr694_name` - Name (String) *(Required)*
- `importsequencenumber` - Import Sequence Number (Integer)
- `new_installationorderno` - Installation Order No. (String)
- `new_percentagecomplete` - Percentage Complete (Decimal)
- `overriddencreatedon` - Record Created On (DateTime)
- `owningbusinessunit` - Owning Business Unit (Lookup)
- `owningbusinessunitname` -  (String)
- `owningteam` - Owning Team (Lookup)
- `owninguser` - Owning User (Lookup)
- `timezoneruleversionnumber` - Time Zone Rule Version Number (Integer)
- `utcconversiontimezonecode` - UTC Conversion Time Zone Code (Integer)
- `versionnumber` - Version Number (BigInt)

### Pricing Calculation

- **Logical Name:** `cr694_pricingcalculation`
- **Schema Name:** `cr694_pricingcalculation`
- **Primary ID:** `cr694_pricingcalculationid`
- **Primary Name:** `cr694_productname`
- **Description:** This table contains pricing information for tender calculations
- **Total Fields:** 45
- **Forms:** 1
- **Relationships:** 16

**Key Fields:**

- `cr694_discount` - Discount (Decimal)
- `cr694_installedcost` - Installed Cost (Money)
- `cr694_installedcost_base` - Installed Cost (Base) (Money)
- `cr694_pricingcalculationid` - Pricing Calculation (Uniqueidentifier)
- `cr694_productname` - Product Name (String)
- `cr694_quantity` - Quantity (Integer)
- `cr694_test` - Test (String)
- `cr694_totalprice` - Total Price (Money)
- `cr694_totalprice_base` - Total Price (Base) (Money)
- `cr694_unitprice` - Unit Price (Money)
- `cr694_unitprice_base` - Unit Price (Base) (Money)
- `exchangerate` - Exchange Rate (Decimal)
- `importsequencenumber` - Import Sequence Number (Integer)
- `overriddencreatedon` - Record Created On (DateTime)
- `owningbusinessunit` - Owning Business Unit (Lookup)
- `owningbusinessunitname` -  (String)
- `owningteam` - Owning Team (Lookup)
- `owninguser` - Owning User (Lookup)
- `timezoneruleversionnumber` - Time Zone Rule Version Number (Integer)
- `transactioncurrencyid` - Currency (Lookup)


---

## Key Standard Entities Included

### Product

- **Logical Name:** `product`
- **Forms:** 3
- **Relationships:** 75

### Order

- **Logical Name:** `salesorder`
- **Forms:** 3
- **Relationships:** 92

### Account

- **Logical Name:** `account`
- **Forms:** 9
- **Relationships:** 199

### Quote

- **Logical Name:** `quote`
- **Forms:** 3
- **Relationships:** 88

### Appointment

- **Logical Name:** `appointment`
- **Forms:** 3
- **Relationships:** 140

### Email

- **Logical Name:** `email`
- **Forms:** 5
- **Relationships:** 155

### Contact

- **Logical Name:** `contact`
- **Forms:** 14
- **Relationships:** 168

