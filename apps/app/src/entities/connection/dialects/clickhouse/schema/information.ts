/**
 * @name information_schema
 * @type schema
 */
export interface InformationSchema {
  tables: Tables
  columns: Columns
  views: Views
}

/**
 * @name tables
 * @type table
 */
interface Tables {
  table_catalog: string
  table_schema: string
  table_name: string
  table_type: 'BASE TABLE' | 'VIEW' | 'SYSTEM VIEW'
  table_rows: number | null
  data_length: number
  index_length: number
  table_collation: string | null
  table_comment: string | null
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
  is_insertable_into: boolean
  is_trigger_updatable: boolean
  is_trigger_deletable: boolean
  is_trigger_insertable_into: boolean
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
  column_default: string
  is_nullable: 1 | 0
  data_type: string
  character_maximum_length: number | null
  character_octet_length: number | null
  numeric_precision: number | null
  numeric_precision_radix: number | null
  numeric_scale: number | null
  datetime_precision: number | null
  character_set_catalog: string | null
  character_set_schema: string | null
  character_set_name: string | null
  collation_catalog: string | null
  collation_schema: string | null
  collation_name: string | null
  domain_catalog: string | null
  domain_schema: string | null
  domain_name: string | null
  extra: string
  column_comment: string
  column_type: string
}
