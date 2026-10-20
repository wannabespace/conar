/**
 * DuckDB's `duckdb_*` catalog functions, named without their parentheses: so named, each is a view that leaves out
 * internal entries, the `main` schema among them.
 */
export interface Database {
  duckdb_columns: {
    column_default: string | null
    column_index: number
    column_name: string
    comment: string | null
    data_type: string
    database_name: string
    is_nullable: boolean
    numeric_precision: number | null
    numeric_scale: number | null
    character_maximum_length: number | null
    schema_name: string
    table_name: string
    internal: boolean
  }
  duckdb_constraints: {
    constraint_column_names: string[]
    constraint_index: number
    constraint_name: string
    constraint_text: string
    constraint_type:
      | 'CHECK'
      | 'FOREIGN KEY'
      | 'NOT NULL'
      | 'PRIMARY KEY'
      | 'UNIQUE'
    database_name: string
    expression: string | null
    referenced_column_names: string[]
    referenced_table: string | null
    schema_name: string
    table_name: string
  }
  duckdb_databases: {
    database_name: string
    internal: boolean
    path: string | null
    readonly: boolean
    type: string
  }
  duckdb_indexes: {
    comment: string | null
    database_name: string
    expressions: string | null
    index_name: string
    is_primary: boolean
    is_unique: boolean
    schema_name: string
    sql: string | null
    table_name: string
  }
  duckdb_schemas: {
    comment: string | null
    database_name: string
    internal: boolean
    schema_name: string
    sql: string | null
  }
  duckdb_tables: {
    column_count: number
    comment: string | null
    database_name: string
    estimated_size: number
    has_primary_key: boolean
    internal: boolean
    schema_name: string
    sql: string
    table_name: string
    temporary: boolean
  }
  duckdb_types: {
    comment: string | null
    database_name: string
    internal: boolean
    labels: string[] | null
    logical_type: string
    schema_name: string
    type_name: string
  }
  duckdb_views: {
    column_count: number
    comment: string | null
    database_name: string
    internal: boolean
    schema_name: string
    sql: string
    temporary: boolean
    view_name: string
  }
  'information_schema.schemata': {
    catalog_name: string
    schema_name: string
  }
}
