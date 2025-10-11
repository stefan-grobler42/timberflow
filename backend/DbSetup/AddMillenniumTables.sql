-- Add Millennium Roofing custom entities to existing database

-- Designer Table
CREATE TABLE IF NOT EXISTS cr694_designer (
    cr694_designerid TEXT PRIMARY KEY,
    cr694_cellnumber TEXT,
    cr694_emailaddress TEXT,
    cr694_employeeno TEXT,
    cr694_name TEXT NOT NULL,
    new_displaynamecalculated TEXT,
    new_employeefile TEXT,
    CreatedOn TEXT,
    CreatedBy TEXT,
    ModifiedOn TEXT,
    ModifiedBy TEXT
);

-- Sale Representative Table
CREATE TABLE IF NOT EXISTS cr694_salerepresentative (
    cr694_salerepresentativeid TEXT PRIMARY KEY,
    cr694_cellnumber TEXT,
    cr694_emailaddress TEXT,
    cr694_employeeno TEXT,
    cr694_name TEXT,
    cr694_surname TEXT,
    new_displayname TEXT,
    new_employeefile TEXT,
    new_name TEXT,
    CreatedOn TEXT,
    CreatedBy TEXT,
    ModifiedOn TEXT,
    ModifiedBy TEXT
);

-- Vehicles Table
CREATE TABLE IF NOT EXISTS cr694_vehicles (
    cr694_vehiclesid TEXT PRIMARY KEY,
    cr694_approveddriver TEXT,
    cr694_cofinorder INTEGER,
    cr694_licenserenewaldate TEXT,
    cr694_make TEXT,
    cr694_model TEXT,
    cr694_name TEXT,
    cr694_registrationnumber TEXT,
    cr694_type INTEGER,
    cr694_vehiclesid TEXT,
    cr694_yearmodel TEXT,
    new_displayname TEXT,
    new_name TEXT,
    CreatedOn TEXT,
    CreatedBy TEXT,
    ModifiedOn TEXT,
    ModifiedBy TEXT
);

-- Employee (Drivers) Table
CREATE TABLE IF NOT EXISTS cr694_drivers (
    cr694_driversid TEXT PRIMARY KEY,
    cr694_allowdriving INTEGER,
    cr694_driverslicenseno TEXT,
    cr694_employeeno TEXT,
    cr694_hourlyrate REAL,
    cr694_hourlyrate_base REAL,
    cr694_idno TEXT,
    cr694_jobdescription TEXT,
    cr694_name TEXT,
    cr694_pdp INTEGER,
    cr694_pdpexpirydate TEXT,
    cr694_pdpno TEXT,
    cr694_surname TEXT,
    exchangerate REAL,
    new_activeemployee INTEGER,
    new_cellno TEXT,
    new_displayname TEXT,
    new_emailaddress TEXT,
    new_employeefile TEXT,
    new_incometaxnumber TEXT,
    new_name TEXT,
    new_personid TEXT,
    CreatedOn TEXT,
    CreatedBy TEXT,
    ModifiedOn TEXT,
    ModifiedBy TEXT
);

-- Quote - MRoofing Table
CREATE TABLE IF NOT EXISTS cr694_quotemroofing (
    cr694_quotemroofingid TEXT PRIMARY KEY,
    cr694_account TEXT,
    cr694_name TEXT NOT NULL,
    CreatedOn TEXT,
    CreatedBy TEXT,
    ModifiedOn TEXT,
    ModifiedBy TEXT
);

-- Tender Table
CREATE TABLE IF NOT EXISTS cr694_tender (
    cr694_tenderid TEXT PRIMARY KEY,
    cr694_addressname TEXT,
    cr694_closingdate TEXT,
    cr694_contact TEXT,
    cr694_customer TEXT,
    cr694_customeridtype TEXT,
    cr694_description TEXT,
    cr694_distancetosite REAL,
    cr694_filelink TEXT,
    cr694_name TEXT NOT NULL,
    cr694_quoteno TEXT,
    cr694_roofcoveringsheeting INTEGER,
    cr694_roofcoveringtiles INTEGER,
    cr694_streetaddress TEXT,
    new_estimatedcost REAL,
    new_notes TEXT,
    new_status TEXT,
    new_tendertype TEXT,
    CreatedOn TEXT,
    CreatedBy TEXT,
    ModifiedOn TEXT,
    ModifiedBy TEXT
);

-- Pricing Calculation Table
CREATE TABLE IF NOT EXISTS cr694_pricingcalculation (
    cr694_pricingcalculationid TEXT PRIMARY KEY,
    cr694_discount REAL,
    cr694_installedcost REAL,
    cr694_installedcost_base REAL,
    cr694_productname TEXT,
    cr694_quantity INTEGER,
    cr694_test TEXT,
    cr694_totalprice REAL,
    cr694_totalprice_base REAL,
    cr694_unitprice REAL,
    cr694_unitprice_base REAL,
    exchangerate REAL,
    transactioncurrencyid TEXT,
    CreatedOn TEXT,
    CreatedBy TEXT,
    ModifiedOn TEXT,
    ModifiedBy TEXT
);

-- Installation Progress Table
CREATE TABLE IF NOT EXISTS cr694_installationprogress (
    cr694_installationprogressid TEXT PRIMARY KEY,
    cr694_name TEXT NOT NULL,
    new_installationorderno TEXT,
    new_percentagecomplete REAL,
    CreatedOn TEXT,
    CreatedBy TEXT,
    ModifiedOn TEXT,
    ModifiedBy TEXT
);

-- Production Table
CREATE TABLE IF NOT EXISTS cr694_production (
    cr694_productionid TEXT PRIMARY KEY,
    cr694_customer TEXT,
    cr694_customeridtype TEXT,
    cr694_jigend TEXT,
    cr694_jighelper1 TEXT,
    cr694_jighelper2 TEXT,
    cr694_jighelper3 TEXT,
    cr694_jighelper4 TEXT,
    cr694_jigleader TEXT,
    cr694_jigstart TEXT,
    cr694_name TEXT NOT NULL,
    cr694_orderno TEXT,
    cr694_pickend TEXT,
    cr694_pickhelper1 TEXT,
    cr694_pickhelper2 TEXT,
    cr694_pickhelper3 TEXT,
    cr694_pickhelper4 TEXT,
    cr694_pickleader TEXT,
    cr694_pickstart TEXT,
    new_actualenddate TEXT,
    new_actualstartdate TEXT,
    new_cuttingend TEXT,
    new_cuttinghelper1 TEXT,
    new_cuttinghelper2 TEXT,
    new_cuttingleader TEXT,
    new_cuttingstart TEXT,
    new_estimatedcost REAL,
    new_status TEXT,
    CreatedOn TEXT,
    CreatedBy TEXT,
    ModifiedOn TEXT,
    ModifiedBy TEXT
);

-- Logistics Table
CREATE TABLE IF NOT EXISTS cr694_logistics (
    cr694_logisticsid TEXT PRIMARY KEY,
    cr694_deliveryno TEXT,
    cr694_description TEXT,
    cr694_dispatchmanager TEXT,
    cr694_driver TEXT,
    cr694_helper1 TEXT,
    cr694_helper2 TEXT,
    cr694_helper3 TEXT,
    cr694_helper4 TEXT,
    cr694_helper5 TEXT,
    cr694_loadmaster TEXT,
    cr694_plannedloaddate TEXT,
    new_actualarrivaltime TEXT,
    new_actualdeparturetime TEXT,
    new_customer TEXT,
    new_notes TEXT,
    new_status TEXT,
    new_vehicle TEXT,
    CreatedOn TEXT,
    CreatedBy TEXT,
    ModifiedOn TEXT,
    ModifiedBy TEXT
);

-- Delivery Table  
CREATE TABLE IF NOT EXISTS cr694_dispatch (
    activityid TEXT PRIMARY KEY,
    activityadditionalparams TEXT,
    activitytypecode TEXT,
    actualdurationminutes INTEGER,
    actualend TEXT,
    actualstart TEXT,
    bcc TEXT,
    cc TEXT,
    community INTEGER,
    cr694_arrivaltime TEXT,
    cr694_arrivaltimesite TEXT,
    cr694_closekms TEXT,
    cr694_customer TEXT,
    cr694_customeridtype TEXT,
    cr694_deliveryno TEXT,
    cr694_departuretime TEXT,
    cr694_driver TEXT,
    cr694_openkms TEXT,
    cr694_product TEXT,
    cr694_quantity INTEGER,
    cr694_site TEXT,
    cr694_vehicle TEXT,
    subject TEXT,
    new_actualdeliverydate TEXT,
    new_estimateddeliverydate TEXT,
    new_notes TEXT,
    new_orderno TEXT,
    new_status TEXT,
    CreatedOn TEXT,
    CreatedBy TEXT,
    ModifiedOn TEXT,
    ModifiedBy TEXT
);

-- Create indexes for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_approveddriver ON cr694_vehicles(cr694_approveddriver);
CREATE INDEX IF NOT EXISTS idx_quotemroofing_account ON cr694_quotemroofing(cr694_account);
CREATE INDEX IF NOT EXISTS idx_tender_customer ON cr694_tender(cr694_customer);
CREATE INDEX IF NOT EXISTS idx_tender_quoteno ON cr694_tender(cr694_quoteno);
CREATE INDEX IF NOT EXISTS idx_production_customer ON cr694_production(cr694_customer);
CREATE INDEX IF NOT EXISTS idx_production_orderno ON cr694_production(cr694_orderno);
CREATE INDEX IF NOT EXISTS idx_logistics_driver ON cr694_logistics(cr694_driver);
CREATE INDEX IF NOT EXISTS idx_logistics_vehicle ON cr694_logistics(new_vehicle);
CREATE INDEX IF NOT EXISTS idx_delivery_customer ON cr694_dispatch(cr694_customer);
CREATE INDEX IF NOT EXISTS idx_delivery_driver ON cr694_dispatch(cr694_driver);
CREATE INDEX IF NOT EXISTS idx_delivery_vehicle ON cr694_dispatch(cr694_vehicle);

-- Insert test data for verification
INSERT OR IGNORE INTO cr694_designer (cr694_designerid, cr694_name, cr694_employeeno) 
VALUES ('designer-001', 'John Designer', 'EMP001');

INSERT OR IGNORE INTO cr694_salerepresentative (cr694_salerepresentativeid, cr694_name, cr694_employeeno) 
VALUES ('salesrep-001', 'Jane Sales', 'EMP002');

INSERT OR IGNORE INTO cr694_vehicles (cr694_vehiclesid, cr694_name, cr694_registrationnumber, cr694_make, cr694_model) 
VALUES ('vehicle-001', 'Truck 1', 'ABC123GP', 'Isuzu', 'FTR800');
