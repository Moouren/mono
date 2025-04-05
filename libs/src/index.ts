// libs/shell/src/index.ts
// Auth exports
export * from './lib/services/auth';
export * from './lib/utils';

// Auth Guards
export { 
  withAuth, 
  withRequireAuth, 
  withPublicOnly, 
  withCrossAppAuth 
} from './lib/services/auth/guards/withAuth';

// CRUD List components
export { CrudListContainer } from './lib/components/crud-list/crudListContainer';
export type { 
  CrudListContainerProps, 
  CrudColumn, 
  QueryParams, 
  EntityService,
  SortField,
  CustomFiltersProps 
} from './lib/components/crud-list/types';

// Entity Resource
export { EntityResource } from './lib/services/resource/entity-resource';
export type { EntityResourceConfig } from './lib/services/resource/entity-resource';

// For functional approaches (currently commented out)
// export { DataTable, useDataTable } from './lib/components/data-table';
// export { createEntityService, useEntityService } from './lib/services/entity/entity.service';