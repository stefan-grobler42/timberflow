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
  orderNo?: string;
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
  productionComplete?: boolean;
  productionPlannedDate?: string;
  totalCuts?: number;
  totalTimberCubes?: number;
  trussCost?: number;
  trussSelling?: number;
  workUnitsEfinks?: number;
  newEstimateDefinks?: number;
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
