export interface InformationSchema {
  tables: Tables
  columns: Columns
  views: Views
}

interface Tables {
  table_catalog: string
  table_schema: string
  table_name: string
  table_type:
    | 'BASE TABLE'
    | 'VIEW'
    | 'SYSTEM VIEW'
    | 'LOCAL TEMPORARY'
    | 'FOREIGN TABLE'
  table_rows: string | null
  data_length: string | null
  index_length: string | null
  table_collation: string | null
  table_comment: string | null
}

interface Views {
  table_catalog: string
  table_schema: string
  table_name: string
  view_definition: string
  check_option: 'NONE'
  is_updatable: 'YES' | 'NO'
  is_insertable_into: 'YES' | 'NO'
  is_trigger_updatable: 'YES' | 'NO'
  is_trigger_deletable: 'YES' | 'NO'
  is_trigger_insertable_into: 'YES' | 'NO'
}

interface Columns {
  table_catalog: string
  table_schema: string
  table_name: string
  column_name: string
  ordinal_position: string
  column_default: string
  is_nullable: '1' | '0'
  data_type: string
  character_maximum_length: string | null
  character_octet_length: string | null
  numeric_precision: string | null
  numeric_precision_radix: string | null
  numeric_scale: string | null
  datetime_precision: string | null
  character_set_catalog: string | null
  character_set_schema: string | null
  character_set_name: string | null
  collation_catalog: string | null
  collation_schema: string | null
  collation_name: string | null
  domain_catalog: string | null
  domain_schema: string | null
  domain_name: string | null
  extra: string | null
  column_comment: string
  column_type: string
}
