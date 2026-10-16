export interface Database {
  sqlite_schema: SqliteSchema
}

interface SqliteSchema {
  type: 'index' | 'table' | 'trigger' | 'view'
  name: string
  tbl_name: string
  rootpage: number
  sql: string | null
}

/** Rows of the `pragma_*` table-valued functions, which a read selects from through `sql<Row>`. */
export interface Pragmas {
  foreign_key_list: {
    id: number
    seq: number
    table: string
    from: string
    to: string | null
    on_update: string
    on_delete: string
  }
  index_list: {
    seq: number
    name: string
    unique: 0 | 1
    origin: 'c' | 'pk' | 'u'
    partial: 0 | 1
  }
  index_xinfo: {
    seqno: number
    cid: number
    name: string | null
    desc: 0 | 1
    coll: string | null
    key: 0 | 1
  }
  table_list: {
    schema: string
    name: string
    type: 'shadow' | 'table' | 'view' | 'virtual'
    ncol: number
    wr: 0 | 1
    strict: 0 | 1
  }
  table_xinfo: {
    cid: number
    name: string
    type: string
    notnull: 0 | 1
    dflt_value: string | null
    pk: number
    /** 1 a virtual table's hidden column, 2 a virtual generated column, 3 a stored one. */
    hidden: 0 | 1 | 2 | 3
  }
}
