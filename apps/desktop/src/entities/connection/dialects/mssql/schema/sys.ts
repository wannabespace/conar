/**
 * @name sys
 * @type schema
 */
export interface Sys {
  indexes: Indexes
  tables: Tables
  schemas: Schemas
  index_columns: IndexColumns
  columns: Columns
  databases: Databases
  security_policies: SecurityPolicies
  security_predicates: SecurityPredicates
}

/**
 * @name security_policies
 * @type table
 */
interface SecurityPolicies {
  object_id: number
  schema_id: number
  name: string
  is_enabled: boolean
  is_not_for_replication: boolean
}

/**
 * @name security_predicates
 * @type table
 */
interface SecurityPredicates {
  object_id: number
  predicate_definition: string
  operation: 0 | 1 | 2 | 3 | 4
  target_object_id: number
}

/**
 * @name databases
 * @type table
 */
interface Databases {
  database_id: number
  name: string
}

/**
 * @name indexes
 * @type table
 */
interface Indexes {
  object_id: number
  index_id: number
  name: string
  is_unique: boolean
  is_primary_key: boolean
}

/**
 * @name tables
 * @type table
 */
interface Tables {
  object_id: number
  schema_id: number
  name: string
}

/**
 * @name schemas
 * @type table
 */
interface Schemas {
  schema_id: number
  name: string
}

/**
 * @name index_columns
 * @type table
 */
interface IndexColumns {
  object_id: number
  index_id: number
  column_id: number
}

/**
 * @name columns
 * @type table
 */
interface Columns {
  object_id: number
  column_id: number
  name: string
}
