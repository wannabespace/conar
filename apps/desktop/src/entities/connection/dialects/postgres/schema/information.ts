/**
 * @name information_schema
 * @type schema
 */
export interface InformationSchema {
  tables: Tables
  columns: Columns
  table_constraints: TableConstraints
  constraint_column_usage: ConstraintColumnUsage
  key_column_usage: KeyColumnUsage
  referential_constraints: ReferentialConstraints
}

/**
 * @name tables
 * @type table
 */
interface Tables {
  table_catalog: string
  table_schema: string
  table_name: string
  table_type: 'BASE TABLE' | 'VIEW'
  self_referencing_column_name: string | null
  reference_generation: string
  user_defined_type_catalog: string | null
  user_defined_type_schema: string | null
  user_defined_type_name: string | null
  is_insertable_into: boolean
  is_typed: boolean
  commit_action: string
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
  ordinal_position: number | null
  column_default: string | null
  is_nullable: 'YES' | 'NO'
  data_type: string
  character_maximum_length: number | null
  character_octet_length: number | null
  numeric_precision: number | null
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
  udt_catalog: string
  udt_schema: string
  udt_name: string
  scope_catalog: string | null
  scope_schema: string | null
  scope_name: string | null
  maximum_cardinality: number | null
  dtd_identifier: string
  is_self_referencing: 'YES' | 'NO'
  is_identity: 'YES' | 'NO'
  identity_generation: string | null
  identity_start: number | null
  identity_increment: number | null
  identity_maximum: number | null
  identity_minimum: number | null
  identity_cycle: 'YES' | 'NO'
  is_generated: string | null
  generation_expression: string | null
  is_updatable: 'YES' | 'NO'
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
  constraint_type: 'PRIMARY KEY' | 'UNIQUE' | 'FOREIGN KEY' | 'CHECK' | 'EXCLUSION'
  is_deferrable: 'YES' | 'NO'
  initially_deferred: 'YES' | 'NO'
  enforced: 'YES' | 'NO'
  nulls_distinct: 'YES' | 'NO' | null
}

/**
 * @name constraint_column_usage
 * @type table
 */
interface ConstraintColumnUsage {
  table_catalog: string
  table_schema: string
  table_name: string
  column_name: string
  constraint_catalog: string
  constraint_schema: string
  constraint_name: string
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
