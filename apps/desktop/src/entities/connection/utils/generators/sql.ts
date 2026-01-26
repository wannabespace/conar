import type { ActiveFilter } from '@conar/shared/filters'
import type { Column } from '../../components/table/utils'
import type { enumType } from '../../sql/enums'
import type { ConnectionDialect, Index } from '../types'
import { findEnum, formatValue, getColumnType, groupIndexes, quoteIdentifier } from '../helpers'
import * as templates from '../templates'

export function generateQuerySQL(table: string, filters: ActiveFilter[]) {
  // TODO: use kysely to generate the query
  const whereClauses = filters.map((f) => {
    const col = `"${f.column}"`
    const op = f.ref.operator

    if (f.ref.hasValue === false)
      return `${col} ${op}`

    const val = f.ref.isArray
      ? `(${f.values.map(formatValue).join(', ')})`
      : formatValue(f.values[0])

    return `${col} ${op} ${val}`
  }).join('\n  AND ')

  return templates.sqlQueryTemplate(table, whereClauses)
}

export function generateSchemaSQL(table: string, columns: Column[], enums: typeof enumType.infer[] = [], dialect: ConnectionDialect = 'postgres', indexes: Index[] = []) {
  const foreignKeys: string[] = []
  const usedEnums = new Map<string, typeof enumType.infer>()
  const isMysql = dialect === 'mysql'
  const isMssql = dialect === 'mssql'
  const isClickhouse = dialect === 'clickhouse'
  const pkColumns: string[] = []

  const cols = columns.map((c) => {
    let typeDef = c.type ?? ''

    const lowerType = typeDef.toLowerCase()

    const match = findEnum(c, table, enums)

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
      foreignKeys.push(`FOREIGN KEY (${quoteIdentifier(c.id, dialect)}) REFERENCES ${quoteIdentifier(c.foreign.table, dialect)}(${quoteIdentifier(c.foreign.column, dialect)})`)
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
