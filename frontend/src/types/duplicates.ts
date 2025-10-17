export interface DuplicateMatchRule {
  fieldName: string;
  matchType: 'Exact' | 'CaseInsensitive' | 'Fuzzy' | 'Phone' | 'Email';
  weight: number;
}

export interface DuplicateDetectionRequest {
  entityType: string;
  matchRules: DuplicateMatchRule[];
  minimumScore: number;
}

export interface DuplicateRecordInfo {
  id: string;
  fields: Record<string, any>;
  matchScore: number;
}

export interface DuplicateGroup {
  masterRecord: DuplicateRecordInfo;
  duplicateRecords: DuplicateRecordInfo[];
  totalRecords?: number;
}

export interface DuplicateDetectionResponse {
  duplicateGroups: DuplicateGroup[];
  totalDuplicates: number;
}

export interface DuplicateMergeRequest {
  entityType: string;
  masterRecordId: string;
  duplicateRecordIds: string[];
  fieldSelections: Record<string, string>;
}

export interface DuplicateMergeResponse {
  mergedRecordId: string;
  deletedRecordCount: number;
  relinkedRecordCount: number;
  messages: string[];
}

export interface EntityFieldConfig {
  key: string;
  name: string;
}

export const ENTITY_TYPES = [
  { key: 'Accounts', text: 'Accounts' },
  { key: 'Contacts', text: 'Contacts' },
  { key: 'D365Contacts', text: 'D365 Contacts' },
  { key: 'Customers', text: 'Customers' },
  { key: 'Employees', text: 'Employees' },
];

export const ENTITY_FIELDS: Record<string, EntityFieldConfig[]> = {
  Accounts: [
    { key: 'Name', name: 'Name' },
    { key: 'Email', name: 'Email' },
    { key: 'Phone', name: 'Phone' },
  ],
  Contacts: [
    { key: 'FirstName', name: 'First Name' },
    { key: 'LastName', name: 'Last Name' },
    { key: 'Email', name: 'Email' },
    { key: 'Phone', name: 'Phone' },
  ],
  D365Contacts: [
    { key: 'FirstName', name: 'First Name' },
    { key: 'LastName', name: 'Last Name' },
    { key: 'EmailAddress1', name: 'Email' },
    { key: 'Telephone1', name: 'Phone' },
  ],
  Customers: [
    { key: 'AccountName', name: 'Account Name' },
    { key: 'Email', name: 'Email' },
    { key: 'Phone', name: 'Phone' },
  ],
  Employees: [
    { key: 'Name', name: 'Name' },
    { key: 'Email', name: 'Email' },
    { key: 'Phone', name: 'Phone' },
  ],
};

export const MATCH_TYPES = [
  { key: 'Exact', text: 'Exact Match' },
  { key: 'CaseInsensitive', text: 'Case Insensitive' },
  { key: 'Fuzzy', text: 'Fuzzy Match' },
  { key: 'Phone', text: 'Phone Match' },
  { key: 'Email', text: 'Email Match' },
];
