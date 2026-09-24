export interface SqlColumn {
  name: string
  type: string
  nullable: boolean
}

export interface SqlTable {
  name: string
  kind: string
  /** `null` while the columns have not been loaded — column checks and suggestions skip the table. */
  columns: SqlColumn[] | null
}

interface SqlSchema {
  name: string
  tables: SqlTable[]
}

interface SqlEnum {
  name: string
  values: string[]
  /** Set for engines whose enum lives on one column (MySQL, ClickHouse) rather than as a named type. */
  table?: string
  column?: string
}

export interface SqlCatalog {
  defaultSchema: string | null
  schemas: SqlSchema[]
  enums: SqlEnum[]
}

const collator = new Intl.Collator(undefined, { sensitivity: 'accent' })

const same = (a: string, b: string) => collator.compare(a, b) === 0

export const findSchema = (catalog: SqlCatalog, name: string) =>
  catalog.schemas.find((schema) => same(schema.name, name))

/** Unqualified names resolve through the default schema first, then anywhere. */
export const locateTable = (
  catalog: SqlCatalog,
  name: string,
  schema: string | null
) => {
  const schemas = schema
    ? [findSchema(catalog, schema)]
    : [
        ...(catalog.defaultSchema
          ? [findSchema(catalog, catalog.defaultSchema)]
          : []),
        ...catalog.schemas,
      ]
  for (const candidate of schemas) {
    const table = candidate?.tables.find((item) => same(item.name, name))
    if (candidate && table) {
      return { schema: candidate.name, table }
    }
  }
}

export const findTable = (
  catalog: SqlCatalog,
  name: string,
  schema: string | null
) => locateTable(catalog, name, schema)?.table

export const findColumn = (table: SqlTable, name: string) =>
  table.columns?.find((column) => same(column.name, name))

export const findEnum = (
  catalog: SqlCatalog,
  table: string,
  column: SqlColumn
) =>
  catalog.enums.find(
    (item) => item.table === table && item.column === column.name
  ) ??
  catalog.enums.find(
    (item) =>
      same(item.name, column.type) ||
      column.type.toLowerCase().endsWith(`.${item.name.toLowerCase()}`)
  )
