export interface GridFilter {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'beginsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual' | 'isEmpty' | 'isNotEmpty';
  value: string;
  logicOperator?: 'AND' | 'OR';
}

export interface GridView {
  id: string;
  name: string;
  isDefault: boolean;
  entityType: string;
  columnVisibility: { [key: string]: boolean };
  columnOrder: string[];
  filters: GridFilter[];
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}
