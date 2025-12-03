export interface Activity {
  id: number;
  activityType: string;
  subject: string;
  description?: string;
  activityDate?: string;
  dueDate?: string;
  status: string;
  priority: string;
  customerId?: number;
  assignedToUserId?: number;
  createdByUserId?: number;
  isCompleted: boolean;
  completedDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Designer {
  id: string;
  name: string;
  cellNumber?: string;
  emailAddress?: string;
  employeeNo?: string;
  newDisplayNameCalculated?: string;
  newEmployeeFile?: string;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
}

export interface SaleRepresentative {
  id: string;
  name: string;
  cellNumber?: string;
  emailAddress?: string;
  employeeNo?: string;
  newEmployeeFile?: string;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  registrationNumber: string;
  yearModel: string;
  approvedDriver?: string;
  cofInOrder?: boolean;
  licenseRenewalDate?: string;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
}

export interface Employee {
  id: string;
  name: string;
  employeeNo?: string;
  idNo?: string;
  jobDescription?: string;
  driversLicenseNo?: string;
  pdpNo?: string;
  pdpExpiryDate?: string;
  pdp?: boolean;
  allowDriving?: boolean;
  hourlyRate?: number;
  newCellNo?: string;
  newEmailAddress?: string;
  newIncomeTaxNumber?: string;
  newActiveEmployee?: boolean;
  newCommissionPayable?: boolean;
  newContractOnFile?: boolean;
  newStartDate?: string;
  newUnionMember?: boolean;
  newDisplayNameCalculated?: string;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
}

export interface PickingTeam {
  id: string;
  name: string;
  description?: string;
  teamLeaderId?: string;
  teamLeader?: string;
  averageTimePerM3?: number;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
}

export interface Saw {
  id: string;
  name: string;
  description?: string;
  operatorId?: string;
  operator?: string;
  averageTimePerCut?: number;
  lastServiceDate?: string;
  serialNumber?: string;
  assetNumber?: string;
  lastBladeChange?: string;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
}

export interface Jig {
  id: string;
  name: string;
  description?: string;
  leaderId?: string;
  leader?: string;
  proficiency?: string;
  reliabilityScore?: number;
  strengths?: string;
  averageEfinks?: number;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
}

export interface QuoteMRoofing {
  id: string;
  name: string;
  account?: string;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
}

export interface Tender {
  id: string;
  name: string;
  description?: string;
  fileLink?: string;
  streetAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
  closingDate?: string;
  distanceToSite?: number;
  contact?: string;
  customer?: string;
  quoteNo?: string;
  roofCoveringSheeting?: boolean;
  roofCoveringTiles?: boolean;
  timberStructure?: boolean;
  totalValueExcl?: number;
  totalValueExclBase?: number;
  exchangeRate?: number;
  newDesigner?: string;
  newNotes?: string;
  newPricingSubmitted?: boolean;
  newSubmissionDate?: string;
  newTenderStatus?: number;
  transactionCurrencyId?: string;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
}

export interface PricingCalculation {
  id: string;
  productName?: string;
  test?: string;
  discount?: number;
  installedCost?: number;
  installedCostBase?: number;
  quantity?: number;
  totalPrice?: number;
  totalPriceBase?: number;
  unitPrice?: number;
  unitPriceBase?: number;
  exchangeRate?: number;
  transactionCurrencyId?: string;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
}

export interface InstallationProgress {
  id: string;
  name: string;
  newInstallationOrderNo?: string;
  newPercentageComplete?: number;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
}

export interface Production {
  id: string;
  name: string;
  customer?: string;
  customerName?: string;
  orderNo?: string;
  orderNumber?: string;
  productionPlannedDate?: string;
  productionComplete?: boolean;
  jigStart?: string;
  jigEnd?: string;
  jigLeader?: string;
  jigHelper1?: string;
  jigHelper2?: string;
  jigHelper3?: string;
  jigHelper4?: string;
  pickStart?: string;
  pickEnd?: string;
  pickingMaster?: string;
  pickingHelper1?: string;
  pickingHelper2?: string;
  pickingHelper3?: string;
  sawStart?: string;
  sawEnd?: string;
  sawOperator?: string;
  sawHelper1?: string;
  sawHelper2?: string;
  totalCuts?: number;
  totalTimberCubes?: number;
  trussCost?: number;
  trussSelling?: number;
  workUnitsEfinks?: number;
  newEstimateDefinks?: number;
  customDurationMinutes?: number;
  parentProductionId?: string;
  rolloverSequence?: number;
  pickingTeamId?: string;
  sawId?: string;
  jigId?: string;
  plannedStartDate?: string;
  plannedStartTime?: number;
  plannedEndTime?: number;
  plannedDurationMinutes?: number;
  breakAdjustmentMinutes?: number;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
}

export interface Logistics {
  id: string;
  deliveryNo?: string;
  description?: string;
  dispatchManager?: string;
  driver?: string;
  helper1?: string;
  helper2?: string;
  helper3?: string;
  helper4?: string;
  helper5?: string;
  loadMaster?: string;
  security?: string;
  trailer?: string;
  vehicle?: string;
  plannedLoadDate?: string;
  newKmsTravelled?: number;
  newKmsTravelledDate?: string;
  newKmsTravelledState?: number;
  newLoadCompleted?: boolean;
  newLoadDuration?: number;
  newLoadDurationDate?: string;
  newLoadDurationState?: number;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
}

export interface Delivery {
  id: string;
  deliveryNo?: string;
  customer?: string;
  orderNo?: string;
  loadingDate?: string;
  driver?: string;
  helper1?: string;
  helper2?: string;
  helper3?: string;
  helper4?: string;
  helper5?: string;
  loadMaster?: string;
  dispatchManager?: string;
  openKms?: string;
  closeKms?: string;
  arrivalTime?: string;
  arrivalTimeSite?: string;
  departureTime?: string;
  departureTimeSite?: string;
  partLoad?: boolean;
  actualStart?: string;
  actualEnd?: string;
  actualDurationMinutes?: number;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
}

export interface Account {
  id: string;
  
  // Basic Information
  name?: string;
  accountNumber?: string;
  
  // Contact Information
  telephone1?: string;
  telephone2?: string;
  telephone3?: string;
  fax?: string;
  emailAddress1?: string;
  emailAddress2?: string;
  emailAddress3?: string;
  websiteUrl?: string;
  ftpSiteUrl?: string;
  
  // Primary Address (Address 1)
  address1AddressId?: string;
  address1AddressTypeCode?: number;
  address1Name?: string;
  address1PrimaryContactName?: string;
  address1Line1?: string;
  address1Line2?: string;
  address1Line3?: string;
  address1City?: string;
  address1StateOrProvince?: string;
  address1County?: string;
  address1Country?: string;
  address1PostalCode?: string;
  address1PostOfficeBox?: string;
  address1Latitude?: number;
  address1Longitude?: number;
  address1ShippingMethodCode?: number;
  address1Telephone1?: string;
  address1Telephone2?: string;
  address1Telephone3?: string;
  address1Fax?: string;
  address1Composite?: string;
  address1UpsZone?: string;
  address1UtcOffset?: number;
  address1FreightTermsCode?: number;
  
  // Secondary Address (Address 2)
  address2AddressId?: string;
  address2AddressTypeCode?: number;
  address2Name?: string;
  address2PrimaryContactName?: string;
  address2Line1?: string;
  address2Line2?: string;
  address2Line3?: string;
  address2City?: string;
  address2StateOrProvince?: string;
  address2County?: string;
  address2Country?: string;
  address2PostalCode?: string;
  address2PostOfficeBox?: string;
  address2Latitude?: number;
  address2Longitude?: number;
  address2ShippingMethodCode?: number;
  address2Telephone1?: string;
  address2Telephone2?: string;
  address2Telephone3?: string;
  address2Fax?: string;
  address2Composite?: string;
  address2UpsZone?: string;
  address2UtcOffset?: number;
  address2FreightTermsCode?: number;
  
  // Business Information
  description?: string;
  revenue?: number;
  revenueBase?: number;
  numberOfEmployees?: number;
  industryCode?: number;
  sic?: string;
  tickerSymbol?: string;
  stockExchange?: string;
  sharesOutstanding?: number;
  marketCap?: number;
  marketCapBase?: number;
  
  // Custom Fields (Millennium-specific)
  cr694AccountType?: number;
  cr694CompanyRegistrationNumber?: string;
  cr694CompanyType?: number;
  cr694VatRegistrationNo?: string;
  cr694BusinessTypeValue?: string;
  cr694SalesRepresentative?: string; // Sales Representative lookup GUID
  
  // Relationships
  parentAccountId?: string;
  primaryContactId?: string;
  relationshipTypeCode?: number;
  
  // Account Classification
  accountCategoryCode?: number;
  accountClassificationCode?: number;
  accountRatingCode?: number;
  businessTypeCode?: number;
  customerSizeCode?: number;
  customerTypeCode?: number;
  ownershipCode?: number;
  territoryCode?: number;
  
  // Credit & Financial
  creditLimit?: number;
  creditLimitBase?: number;
  creditOnHold?: boolean;
  paymentTermsCode?: number;
  aging30?: number;
  aging30Base?: number;
  aging60?: number;
  aging60Base?: number;
  aging90?: number;
  aging90Base?: number;
  
  // Communication Preferences
  doNotBulkEmail?: boolean;
  doNotBulkPostalMail?: boolean;
  doNotEmail?: boolean;
  doNotFax?: boolean;
  doNotPhone?: boolean;
  doNotPostalMail?: boolean;
  doNotSendMM?: boolean;
  followEmail?: boolean;
  preferredContactMethodCode?: number;
  preferredAppointmentDayCode?: number;
  preferredAppointmentTimeCode?: number;
  
  // Marketing
  marketingOnly?: boolean;
  lastUsedInCampaign?: string;
  
  // Status & Workflow
  stateCode?: number;
  statusCode?: number;
  participatesInWorkflow?: boolean;
  merged?: boolean;
  onHoldTime?: number;
  lastOnHoldTime?: string;
  
  // Relationships (Lookup GUIDs)
  ownerId?: string;
  owningBusinessUnitValue?: string;
  owningUserValue?: string;
  owningTeamValue?: string;
  primaryContactIdValue?: string;
  parentAccountIdValue?: string;
  preferredSystemUserIdValue?: string;
  preferredServiceIdValue?: string;
  preferredEquipmentIdValue?: string;
  defaultPriceLevelIdValue?: string;
  masterIdValue?: string;
  originatingLeadIdValue?: string;
  territoryIdValue?: string;
  transactionCurrencyIdValue?: string;
  slaIdValue?: string;
  slaInvokedIdValue?: string;
  
  // Exchange & Currency
  exchangeRate?: number;
  
  // Performance Metrics
  openDeals?: number;
  openDealsDate?: string;
  openDealsState?: number;
  openRevenue?: number;
  openRevenueBase?: number;
  openRevenueDate?: string;
  openRevenueState?: number;
  
  // Social
  primarySatoriId?: string;
  primaryTwitterId?: string;
  yomiName?: string;
  
  // Dynamics 365-specific
  msdynExternalAccountId?: string;
  msdynGdprOptOut?: boolean;
  msdynTaxExempt?: boolean;
  msdynTaxExemptNumber?: string;
  msdynTravelCharge?: number;
  msdynTravelChargeBase?: number;
  msdynTravelChargeType?: number;
  msdynWorkOrderInstructions?: string;
  msdynPrimaryTimezone?: number;
  msdynSalesTaxCodeValue?: string;
  msdynServiceTerritoryValue?: string;
  msdynBillingAccountValue?: string;
  msdynWorkHourTemplateValue?: string;
  msdynPreferredResourceValue?: string;
  msdynAccountKpiIdValue?: string;
  msdynSalesAccelerationInsightIdValue?: string;
  msdynSegmentIdValue?: string;
  msaManagingPartnerIdValue?: string;
  
  // Workflow & Process
  processId?: string;
  stageId?: string;
  traversedPath?: string;
  
  // System Fields
  createdOn?: string;
  modifiedOn?: string;
  createdByValue?: string;
  modifiedByValue?: string;
  createdOnBehalfByValue?: string;
  modifiedOnBehalfByValue?: string;
  createdBy?: string;
  modifiedBy?: string;
  overriddenCreatedOn?: string;
  importSequenceNumber?: number;
  timeZoneRuleVersionNumber?: number;
  utcConversionTimeZoneCode?: number;
  versionNumber?: number;
  teamsFollowed?: number;
  timeSpentByMeOnEmailAndMeetings?: string;
  
  // Image
  entityImageId?: string;
  entityImageTimestamp?: number;
  entityImageUrl?: string;
  
  // Portal/ADX fields
  adxCreatedByIpAddress?: string;
  adxCreatedByUsername?: string;
  adxModifiedByIpAddress?: string;
  adxModifiedByUsername?: string;
  
  // External Party
  createdByExternalPartyValue?: string;
  modifiedByExternalPartyValue?: string;
  
  shippingMethodCode?: number;
  
  // Legacy compatibility fields
  latitude?: number | null;
  longitude?: number | null;
}

export interface D365Contact {
  id: string;
  salutation?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
  emailAddress1?: string;
  telephone1?: string;
  telephone2?: string;
  telephone3?: string;
  mobilePhone?: string;
  fax?: string;
  jobTitle?: string;
  parentCustomerId?: string;
  
  // Address Information
  address1AddressTypeCode?: number;
  address1Name?: string;
  address1Line1?: string;
  address1Line2?: string;
  address1Line3?: string;
  address1City?: string;
  address1StateOrProvince?: string;
  address1PostalCode?: string;
  address1Country?: string;
  address1Telephone1?: string;
  address1Latitude?: number | null;
  address1Longitude?: number | null;
  description?: string;
  
  // Professional Information
  department?: string;
  managerName?: string;
  managerPhone?: string;
  role?: string;
  assistantName?: string;
  assistantPhone?: string;
  
  // Personal Information
  genderCode?: number;
  familyStatusCode?: number;
  spousesPartner?: string;
  birthDate?: string;
  anniversary?: string;
  
  latitude?: number | null;
  longitude?: number | null;
  createdOn?: string;
  modifiedOn?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface D365Product {
  id: string;
  productNumber?: string;
  name?: string;
  description?: string;
  productStructure?: number;
  productTypeCode?: number;
  quantityOnHand?: number;
  quantityDecimal?: number;
  stockWeight?: number;
  stockVolume?: number;
  price?: number;
  currentCost?: number;
  standardCost?: number;
  vendorId?: string;
  vendorName?: string;
  createdOn?: string;
  modifiedOn?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface D365Quote {
  id: string;
  quoteNumber?: string;
  name?: string;
  customerId?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  totalAmount?: number;
  totalDiscountAmount?: number;
  totalLineItemAmount?: number;
  stateCode?: number;
  statusCode?: number;
  description?: string;
  ownerId?: string;
  
  // Billing Address
  billTo_Name?: string;
  billTo_Line1?: string;
  billTo_City?: string;
  billTo_StateOrProvince?: string;
  billTo_PostalCode?: string;
  billTo_Country?: string;
  billTo_Telephone?: string;
  billTo_Latitude?: number;
  billTo_Longitude?: number;
  
  // Shipping Address
  shipTo_Name?: string;
  shipTo_Line1?: string;
  shipTo_City?: string;
  shipTo_StateOrProvince?: string;
  shipTo_PostalCode?: string;
  shipTo_Country?: string;
  shipTo_Telephone?: string;
  shipTo_Latitude?: number;
  shipTo_Longitude?: number;
  
  // Financial Fields
  totalTax?: number;
  totalAmountLessFreight?: number;
  freightAmount?: number;
  discountPercentage?: number;
  
  // Date Fields
  expiresOn?: string;
  closedOn?: string;
  requestDeliveryBy?: string;
  
  // Reference Fields
  opportunityId?: string;
  priceLevelId?: string;
  transactionCurrencyId?: string;
  
  // Contact Information
  contactName?: string;
  contactTelephone?: string;
  contactEmail?: string;
  
  // Line Items
  quoteDetails?: D365QuoteDetail[];
  
  // System Fields
  createdOn?: string;
  modifiedOn?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface D365QuoteDetail {
  id: string;
  quoteId: string;
  productId?: string;
  productName?: string;
  description?: string;
  quantity?: number;
  pricePerUnit?: number;
  manualDiscountAmount?: number;
  tax?: number;
  baseAmount?: number;
  extendedAmount?: number;
  lineItemNumber?: number;
  createdOn?: string;
  modifiedOn?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface D365Order {
  id: string;
  orderNumber?: string;
  name?: string;
  customerId?: string;
  customerName?: string;
  quoteId?: string;
  dateFulfilled?: string;
  requestDeliveryBy?: string;
  totalAmount?: number;
  totalDiscountAmount?: number;
  totalLineItemAmount?: number;
  stateCode?: number;
  statusCode?: number;
  description?: string;
  productionRequired?: boolean;
  estimatedEFinks?: number;
  ownerId?: string;
  createdOn?: string;
  modifiedOn?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface D365Appointment {
  id: string;
  subject?: string;
  location?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  actualDurationMinutes?: number;
  scheduledDurationMinutes?: number;
  description?: string;
  regardingObjectId?: string;
  ownerId?: string;
  stateCode?: number;
  statusCode?: number;
  createdOn?: string;
  modifiedOn?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface D365Email {
  id: string;
  subject?: string;
  from?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  description?: string;
  directionCode?: boolean;
  regardingObjectId?: string;
  ownerId?: string;
  stateCode?: number;
  statusCode?: number;
  createdOn?: string;
  modifiedOn?: string;
  createdBy?: string;
  modifiedBy?: string;
}
