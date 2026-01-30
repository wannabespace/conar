import type { ActiveFilter } from '@conar/shared/filters'
import type { Column } from '../../components/table/utils'
import type { enumType } from '../../sql/enums'
import type { Index } from '../utils'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { formatSql } from '~/lib/formatter'
import { getColdKysely } from '../../dialects'
import { findEnum } from '../../sql/enums'
import { buildWhere } from '../../sql/rows'
import * as templates from '../templates'
import { formatValue, getColumnType, groupIndexes, quoteIdentifier } from '../utils'

function inlineParameters(sql: string, parameters: readonly unknown[]): string {
  let i = 0
  return sql.replace(/\$\d+|\?/g, () => formatValue(parameters[i++]))
}

export function generateQuerySQL({ table, filters, dialect = ConnectionType.Postgres }: { table: string, filters: ActiveFilter[], dialect?: ConnectionType }) {
  const db = getColdKysely(dialect)
  const base = db.withTables<{ [table]: Record<string, unknown> }>().selectFrom(table).selectAll()
  const query = filters.length > 0 ? base.where(eb => buildWhere(eb, filters)) : base
  const compiled = query.compile()
  return formatSql(inlineParameters(compiled.sql, compiled.parameters), dialect)
}

export function generateSchemaSQL({ table, columns, enums = [], dialect = ConnectionType.Postgres, indexes = [] }: { table: string, columns: Column[], enums?: typeof enumType.infer[], dialect?: ConnectionType, indexes?: Index[] }) {
  const foreignKeys: string[] = []
  const usedEnums = new Map<string, typeof enumType.infer>()
  const isMysql = dialect === 'mysql'
  const isMssql = dialect === 'mssql'
  const isClickhouse = dialect === 'clickhouse'
  const pkColumns: string[] = []

  const cols = columns.map((c) => {
    let typeDef = c.type ?? ''

    const lowerType = typeDef.toLowerCase()

    const match = findEnum(enums, c, table)

    if (match || lowerType === 'enum' || lowerType === 'set' || (isClickhouse && lowerType.startsWith('enum'))) {
      if (match && match.values.length > 0) {
        if (isClickhouse) {
          const prefix = match.values.length > 255 ? 'Enum16' : 'Enum8'
          const valuesList = match.values.map((v, i) => `'${v.replace(/'/g, '\'\'')}' = ${i + 1}`).join(', ')
          typeDef = `${prefix}(${valuesList})`
        }
        else if (isMysql) {
          const valuesList = match.values.map(v => `'${v.replace(/'/g, '\'\'')}'`).join(', ')
          typeDef = `${lowerType.toUpperCase()}(${valuesList})`
        }
        else {
          if (!isMssql) {
            usedEnums.set(match.name, match)
            typeDef = `"${match.name}"`
          }
          else {
            typeDef = match.name
          }
        }
      }
      else if (c.enum) {
        if (isMysql && c.enum.includes('\'')) {
          typeDef = `ENUM(${c.enum})`
        }
        else {
          typeDef = c.enum
        }
      }
    }
    else {
      typeDef = getColumnType(c.type, 'sql', dialect)

      if (c.maxLength) {
        const len = c.maxLength === -1 ? 'MAX' : c.maxLength
        if (/(?:var)?char|binary/i.test(typeDef) && !/text/i.test(typeDef))
          typeDef += `(${len})`
      }

      if (c.precision && /decimal|numeric/i.test(typeDef)) {
        typeDef += `(${c.precision}${c.scale ? `, ${c.scale}` : ''})`
      }

      if (!isClickhouse) {
        typeDef = typeDef.toUpperCase()
      }

      if (isClickhouse && c.isNullable) {
        typeDef = `Nullable(${typeDef})`
      }
    }
    const parts = [quoteIdentifier(c.id, dialect), typeDef]
    if (!c.isNullable)
      parts.push('NOT NULL')

    if (c.primaryKey) {
      pkColumns.push(quoteIdentifier(c.id, dialect))
      if (isMysql && /int|serial/i.test(c.type || ''))
        parts.push('AUTO_INCREMENT')
      if (isMssql && /int/i.test(c.type || ''))
        parts.push('IDENTITY(1,1)')
    }

    if (c.primaryKey && !isClickhouse)
      parts.push('PRIMARY KEY')
    else if (c.unique)
      parts.push('UNIQUE')

    if (c.foreign && !isClickhouse) {
      let fk = `FOREIGN KEY (${quoteIdentifier(c.id, dialect)}) REFERENCES ${quoteIdentifier(c.foreign.table, dialect)}(${quoteIdentifier(c.foreign.column, dialect)})`
      if (c.foreign.onDelete)
        fk += ` ON DELETE ${c.foreign.onDelete}`
      if (c.foreign.onUpdate)
        fk += ` ON UPDATE ${c.foreign.onUpdate}`
      foreignKeys.push(fk)
    }

    return `  ${parts.join(' ')}`
  })

  if (foreignKeys.length > 0) {
    cols.push(...foreignKeys.map(fk => `  ${fk}`))
  }

  const definitions: string[] = []

  if (usedEnums.size > 0 && !isMysql && !isMssql && !isClickhouse) {
    usedEnums.forEach((e) => {
      const vals = e.values.map(v => `'${v.replace(/'/g, '\'\'')}'`).join(', ')
      definitions.push(`CREATE TYPE "${e.name}" AS ENUM (${vals});`)
    })
  }

  const columnsString = cols.join(',\n')
  let schema = templates.sqlSchemaTemplate(quoteIdentifier(table, dialect), columnsString)

  if (isClickhouse) {
    const orderBy = pkColumns.length > 0 ? (pkColumns.length > 1 ? `(${pkColumns.join(', ')})` : pkColumns[0]) : 'tuple()'
    schema = schema.replace(/\);\s*$/, `) ENGINE = MergeTree() ORDER BY ${orderBy};`)
  }

  const explicitIndexes = groupIndexes(indexes, table).filter(idx => !idx.isPrimary && dialect !== 'clickhouse' && !(idx.isUnique && idx.columns.length === 1 && columns.find(c => c.id === idx.columns[0] && c.unique)))

  if (explicitIndexes.length > 0) {
    const indexStmts = explicitIndexes.map((idx) => {
      const cols = idx.columns.map(c => quoteIdentifier(c, dialect)).join(', ')
      const unique = idx.isUnique ? 'UNIQUE ' : ''
      return `CREATE ${unique}INDEX ${quoteIdentifier(idx.name, dialect)} ON ${quoteIdentifier(table, dialect)} (${cols});`
    })
    schema += `\n\n${indexStmts.join('\n')}`
  }

  return definitions.length > 0 ? `${definitions.join('\n')}\n\n${schema}` : schema
}
