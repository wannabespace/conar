// DuckDB implements a PostgreSQL-compatible information_schema, so these
// types mirror the PostgreSQL information_schema structure directly.

/**
 * @name information_schema
 * @type schema
 */
export interface InformationSchema {
  tables: Tables
  columns: Columns
  views: Views
  table_constraints: TableConstraints
  key_column_usage: KeyColumnUsage
  referential_constraints: ReferentialConstraints
  schemata: Schemata
}

/**
 * @name tables
 * @type table
 */
interface Tables {
  table_catalog: string
  table_schema: string
  table_name: string
  table_type: 'BASE TABLE' | 'VIEW' | 'LOCAL TEMPORARY'
  self_referencing_column_name: string | null
  reference_generation: string | null
  user_defined_type_catalog: string | null
  user_defined_type_schema: string | null
  user_defined_type_name: string | null
  is_insertable_into: 'YES' | 'NO'
  is_typed: 'YES' | 'NO'
  commit_action: string | null
}

/**
 * @name views
 * @type table
 */
interface Views {
  table_catalog: string
  table_schema: string
  table_name: string
  view_definition: string
  check_option: 'NONE' | 'CASCADE' | 'LOCAL'
  is_updatable: 'YES' | 'NO'
  is_insertable_into: 'YES' | 'NO'
  is_trigger_updatable: 'YES' | 'NO'
  is_trigger_deletable: 'YES' | 'NO'
  is_trigger_insertable_into: 'YES' | 'NO'
}

/**
 * @name columns
 * @type table
 */
interface Columns {
  table_catalog: string
  table_schema: string
  table_name: string
  column_name: string
  ordinal_position: number
  column_default: string | null
  is_nullable: 'YES' | 'NO'
  data_type: string
  character_maximum_length: number | null
  character_octet_length: number | null
  numeric_precision: number | null
  numeric_precision_radix: number | null
  numeric_scale: number | null
  datetime_precision: number | null
  interval_type: string | null
  interval_precision: number | null
  character_set_catalog: string | null
  character_set_schema: string | null
  character_set_name: string | null
  collation_catalog: string | null
  collation_schema: string | null
  collation_name: string | null
  domain_catalog: string | null
  domain_schema: string | null
  domain_name: string | null
}

/**
 * @name table_constraints
 * @type table
 */
interface TableConstraints {
  constraint_catalog: string
  constraint_schema: string
  constraint_name: string
  table_catalog: string
  table_schema: string
  table_name: string
  constraint_type: 'PRIMARY KEY' | 'UNIQUE' | 'FOREIGN KEY' | 'CHECK'
  is_deferrable: 'YES' | 'NO'
  initially_deferred: 'YES' | 'NO'
  enforced: 'YES' | 'NO'
}

/**
 * @name key_column_usage
 * @type table
 */
interface KeyColumnUsage {
  constraint_catalog: string
  constraint_schema: string
  constraint_name: string
  table_catalog: string
  table_schema: string
  table_name: string
  column_name: string
  ordinal_position: number
  position_in_unique_constraint: number | null
}

/**
 * @name referential_constraints
 * @type table
 */
interface ReferentialConstraints {
  constraint_catalog: string
  constraint_schema: string
  constraint_name: string
  unique_constraint_catalog: string
  unique_constraint_schema: string
  unique_constraint_name: string
  match_option: 'NONE' | 'PARTIAL' | 'FULL'
  update_rule: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION'
  delete_rule: 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION'
}

/**
 * @name schemata
 * @type table
 */
interface Schemata {
  catalog_name: string
  schema_name: string
  schema_owner: string | null
  default_character_set_catalog: string | null
  default_character_set_schema: string | null
  default_character_set_name: string | null
  sql_path: string | null
}
