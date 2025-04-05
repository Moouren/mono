// libs/shell/src/lib/components/crud-list/types.ts
import { ColumnType } from 'antd/lib/table';

// Entity service interface
export interface EntityService<T> {
  getEntries: (params: Partial<QueryParams>) => Promise<{ items: T[]; total: number }>;
  getDetailLink?: (record: T) => string;
  getCreateLink?: () => string;
  entityName?: string;
}

// Query parameters for fetching data
export interface QueryParams {
  limit: number;
  offset: number;
  sortField?: string;
  sortDirection?: string;
  query?: string;
  filters?: Record<string, any>;
  state?: string;
  [key: string]: any;
}

// Column configuration
export interface CrudColumn<T> extends ColumnType<T> {
  searchKey?: string;
  filterParameter?: string;
  sortParameter?: string;
}

// Custom filters props
export interface CustomFiltersProps {
  onFilter: (value: any) => void;
}

// Sort field configuration
export interface SortField {
  label: string;
  value: string;
}

// Props for the CrudListContainer
export interface CrudListContainerProps<T> {
  // Required props
  entityName: string;
  columns: CrudColumn<T>[];
  resource: EntityService<T>;
  
  // Optional configuration
  disableSearch?: boolean;
  withSorting?: boolean;
  defaultPayload?: Partial<QueryParams>;
  statesForFiltering?: string[];
  additionalPayload?: Record<string, any>;
  sortFields?: SortField[];
  customFilters?: React.ComponentType<CustomFiltersProps>;
  additionalPathname?: string;
  rowKey?: string;
}

// Default values for query parameters
export const DEFAULT_LIMIT = 20;
export const DEFAULT_OFFSET = 0;
export const DEFAULT_PAGE = 1;
export const DEFAULT_SORT_FIELD = 'id';
export const DEFAULT_SORT_DIRECTION = 'desc';
export const DEFAULT_FILTERS = {};
export const DEFAULT_QUERY = '';

// libs/shell/src/lib/components/crud-list/index.ts
export * from './types';
export { CrudListContainer } from './crudListContainer';