'use client'
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

