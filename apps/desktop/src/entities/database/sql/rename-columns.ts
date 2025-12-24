import { sql } from 'kysely'
import { createQuery } from '../query'

/**
 * Renames a column in a table across different database systems.
 * 
 * **Constraint Behavior During Column Renaming:**
 * 
 * - **PostgreSQL**: Allows renaming without issues. Constraints (foreign keys, unique, check, etc.)
 *   remain functional and linked to the column after renaming. However, internally generated
 *   constraint names may not update to reflect the new column name.
 * 
 * - **MySQL**: Allows renaming columns with constraints. All constraints (foreign keys, unique, 
 *   check) are automatically updated and remain fully functional after the rename operation.
 * 
 * - **MSSQL**: Allows renaming via `sp_rename` stored procedure. Constraints remain functional
 *   after renaming, but system-generated constraint names retain the old column name reference
 *   (e.g., a constraint named `DF__table__oldcol__123` will keep this name even after renaming).
 * 
 * - **ClickHouse**: Allows column renaming without issues. Note that ClickHouse has limited
 *   constraint support (no foreign keys, basic CHECK constraints only), but the renaming
 *   operation itself works correctly.
 * 
 * @summary All four databases support renaming columns even when constraints exist. Constraints
 * remain functional after renaming, though some databases may retain old references in internal
 * constraint naming.
 */
export const renameColumnQuery = createQuery({
  query: ({ schema, table, oldColumn, newColumn }: { schema: string, table: string, oldColumn: string, newColumn: string }) => ({
    postgres: db => db
      .withSchema(schema)
      .withTables<{ [table]: Record<string, unknown> }>()
      .schema
      .alterTable(table)
      .renameColumn(oldColumn, newColumn)
      .execute(),
    mysql: db => db
      .withSchema(schema)
      .withTables<{ [table]: Record<string, unknown> }>()
      .schema
      .alterTable(table)
      .renameColumn(oldColumn, newColumn)
      .execute(),
    mssql: async (db) => {
      await sql`EXEC sp_rename ${sql.val(`${schema}.${table}.${oldColumn}`)}, ${sql.val(newColumn)}, 'COLUMN'`.execute(db)
    },
    clickhouse: db => db
      .withSchema(schema)
      .withTables<{ [table]: Record<string, unknown> }>()
      .schema
      .alterTable(table)
      .renameColumn(oldColumn, newColumn)
      .execute(),
  }),
})
