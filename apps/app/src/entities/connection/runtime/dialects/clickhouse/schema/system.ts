export interface System {
  databases: Databases
  columns: Columns
  parts: Parts
  one: One
  tables: Tables
  row_policies: RowPolicies
  data_skipping_indices: DataSkippingIndices
}

interface DataSkippingIndices {
  database: string
  table: string
  name: string
  type_full: string
  expr: string
  granularity: number
}

interface RowPolicies {
  name: string
  short_name: string
  database: string
  table: string
  id: string
  is_restrictive: number
  select_filter: string
  apply_to_all: number
  apply_to_list: string[]
  apply_to_except: string[]
}

interface Tables {
  database: string
  name: string
  create_table_query: string
  engine: string
  is_temporary: number
}

interface One {
  dummy: number
}

interface Databases {
  name: string
  engine: string
  data_path: string
  metadata_path: string
  uuid: string
  comment: string
}

interface Columns {
  database: string
  table: string
  name: string
  type: string
  position: number
  default_kind: string
  default_expression: string
  is_in_primary_key: number
}

interface Parts {
  database: string
  table: string
  rows: number
  active: number
}
