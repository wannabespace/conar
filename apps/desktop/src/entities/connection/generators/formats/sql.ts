import type { QueryParams, SchemaParams } from '..'
import type { Column } from '../../components/table/utils'
import type { enumType } from '../../sql/enums'
import type { Index } from '../utils'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { formatSql } from '~/lib/formatter'
import { getColdDialect } from '../../dialects'
import { findEnum } from '../../sql/enums'
import { buildWhere } from '../../sql/rows'
import * as templates from '../templates'
import { formatValue, getColumnType, groupIndexes, quoteIdentifier } from '../utils'

function inlineParameters(sql: string, parameters: readonly unknown[]): string {
  let i = 0
  return sql.replace(/\$\d+|\?/g, () => formatValue(parameters[i++]))
}

export function generateQuerySQL({
  table,
  filters,
  dialect = ConnectionType.Postgres,
}: QueryParams) {
  const db = getColdDialect(dialect)
  const base = db.withTables<{ [table]: Record<string, unknown> }>().selectFrom(table).selectAll()
  const query = filters.length > 0 ? base.where(eb => buildWhere(eb, filters)) : base
  const compiled = query.compile()
  return formatSql(inlineParameters(compiled.sql, compiled.parameters), dialect)
}

function escapeSqlString(s: string): string {
  return s.replace(/'/g, '\'\'')
}

function formatEnumType(
  match: typeof enumType.infer,
  dialect: ConnectionType,
): string {
  const valuesList = match.values.map(v => `'${escapeSqlString(v)}'`).join(', ')

  if (dialect === ConnectionType.ClickHouse) {
    const prefix = match.values.length > 255 ? 'Enum16' : 'Enum8'
    const pairs = match.values.map((v, i) => `'${escapeSqlString(v)}' = ${i + 1}`).join(', ')
    return `${prefix}(${pairs})`
  }

  if (dialect === ConnectionType.MySQL) {
    return `ENUM(${valuesList})`
  }

  if (dialect === ConnectionType.MSSQL) {
    return match.name
  }

  return `"${match.name}"`
}

function formatScalarType(c: Column, dialect: ConnectionType): string {
  let typeDef = getColumnType(c.type, 'sql', dialect) || 'any'

  if (c.maxLength !== undefined) {
    const len = c.maxLength === -1 ? 'MAX' : c.maxLength
    if (/(?:var)?char|binary/i.test(typeDef) && !/text/i.test(typeDef)) {
      typeDef += `(${len})`
    }
  }

  if (c.precision !== undefined && /decimal|numeric/i.test(typeDef)) {
    typeDef += `(${c.precision}${c.scale ? `, ${c.scale}` : ''})`
  }

  if (dialect !== ConnectionType.ClickHouse) {
    typeDef = typeDef.toUpperCase()
  }

  if (dialect === ConnectionType.ClickHouse && c.isNullable) {
    typeDef = `Nullable(${typeDef})`
  }

  return typeDef
}

function getTypeDef(
  c: Column,
  table: string,
  enums: typeof enumType.infer[],
  dialect: ConnectionType,
  usedEnums: Map<string, typeof enumType.infer>,
): string {
  const lowerType = (c.type ?? '').toLowerCase()
  const foundEnum = findEnum(enums, c, table)
  const isList = foundEnum
    || lowerType === 'enum'
    || lowerType === 'set'
    || (dialect === ConnectionType.ClickHouse && lowerType.startsWith('enum'))

  if (isList && foundEnum?.values.length) {
    if (dialect === ConnectionType.Postgres) {
      usedEnums.set(foundEnum.name, foundEnum)
    }
    return formatEnumType(foundEnum, dialect)
  }

  if (isList && c.enum) {
    if (dialect === ConnectionType.MySQL && c.enum.includes('\'')) {
      return `ENUM(${c.enum})`
    }
    return c.enum
  }

  return formatScalarType(c, dialect)
}

function buildColumnParts(
  c: Column,
  typeDef: string,
  dialect: ConnectionType,
  pkColumns: string[],
  defaultValue?: string | null,
): { parts: string[], foreignKey: string | null } {
  const quoted = quoteIdentifier(c.id, dialect)
  const parts = [quoted, typeDef]

  if (c.primaryKey) {
    pkColumns.push(quoted)
    if (dialect === ConnectionType.MySQL && /int|serial/i.test(c.type ?? '')) {
      parts.push('AUTO_INCREMENT')
    }
    if (dialect === ConnectionType.MSSQL && /int/i.test(c.type ?? '')) {
      parts.push('IDENTITY(1,1)')
    }
  }

  if (defaultValue !== undefined && defaultValue !== null) {
    parts.push(`DEFAULT ${defaultValue}`)
  }

  if (!c.isNullable) {
    parts.push('NOT NULL')
  }

  if (c.primaryKey && dialect !== ConnectionType.ClickHouse) {
    parts.push('PRIMARY KEY')
  }
  else if (c.unique) {
    parts.push('UNIQUE')
  }

  let foreignKey: string | null = null
  if (c.foreign && dialect !== ConnectionType.ClickHouse) {
    const ref = quoteIdentifier(c.foreign.table, dialect)
    const col = quoteIdentifier(c.foreign.column, dialect)
    let fk = `FOREIGN KEY (${quoted}) REFERENCES ${ref}(${col})`

    if (c.foreign.onDelete)
      fk += ` ON DELETE ${c.foreign.onDelete}`
    if (c.foreign.onUpdate)
      fk += ` ON UPDATE ${c.foreign.onUpdate}`

    foreignKey = fk
  }

  return { parts, foreignKey }
}

function buildPostgresEnumStatements(
  usedEnums: Map<string, typeof enumType.infer>,
): string[] {
  const statements: string[] = []
  usedEnums.forEach((e) => {
    const vals = e.values.map(v => `'${escapeSqlString(v)}'`).join(', ')
    statements.push(`CREATE TYPE "${e.name}" AS ENUM (${vals});`)
  })
  return statements
}

function appendIndexStatements(
  schema: string,
  table: string,
  columns: Column[],
  indexes: Index[],
  dialect: ConnectionType,
): string {
  const grouped = groupIndexes(indexes, table)
  const filtered = grouped.filter(
    idx =>
      !idx.isPrimary
      && dialect !== ConnectionType.ClickHouse
      && !(
        idx.isUnique
        && idx.columns.length === 1
        && columns.some(c => c.id === idx.columns[0] && c.unique)
      ),
  )

  if (filtered.length === 0)
    return schema

  const lines = filtered.map((idx) => {
    const cols = idx.columns.map(c => quoteIdentifier(c, dialect)).join(', ')
    const unique = idx.isUnique ? 'UNIQUE ' : ''
    return `CREATE ${unique}INDEX ${quoteIdentifier(idx.name, dialect)} ON ${quoteIdentifier(table, dialect)} (${cols});`
  })

  return `${schema}\n\n${lines.join('\n')}`
}

export function generateSchemaSQL({
  table,
  columns,
  dialect,
  enums = [],
  indexes = [],
}: SchemaParams) {
  const usedEnums = new Map<string, typeof enumType.infer>()
  const pkColumns: string[] = []
  const foreignKeys: string[] = []
  const columnLines: string[] = []

  for (const c of columns) {
    let typeDef = getTypeDef(c, table, enums, dialect, usedEnums)
    let defaultValue = c.defaultValue

    if (dialect === ConnectionType.Postgres && defaultValue?.toLowerCase().startsWith('nextval')) {
      if (typeDef === 'INTEGER') {
        typeDef = 'SERIAL'
        defaultValue = null
      }
      else if (typeDef === 'BIGINT') {
        typeDef = 'BIGSERIAL'
        defaultValue = null
      }
    }

    const { parts, foreignKey } = buildColumnParts(c, typeDef, dialect, pkColumns, defaultValue)
    columnLines.push(`  ${parts.join(' ')}`)
    if (foreignKey)
      foreignKeys.push(`  ${foreignKey}`)
  }

  let columnBlock = columnLines.join(',\n')
  if (foreignKeys.length > 0) {
    columnBlock += `,\n${foreignKeys.join(',\n')}`
  }

  let schema = templates.sqlSchemaTemplate(quoteIdentifier(table, dialect), columnBlock)

  if (dialect === ConnectionType.ClickHouse) {
    const orderBy
      = pkColumns.length > 0
        ? pkColumns.length > 1
          ? `(${pkColumns.join(', ')})`
          : pkColumns[0]
        : 'tuple()'
    schema = schema.replace(/\);\s*$/, `) ENGINE = MergeTree() ORDER BY ${orderBy};`)
  }

  schema = appendIndexStatements(schema, table, columns, indexes, dialect)

  const enumStatements = usedEnums.size > 0
    && dialect !== ConnectionType.MySQL
    && dialect !== ConnectionType.MSSQL
    && dialect !== ConnectionType.ClickHouse
    ? `${buildPostgresEnumStatements(usedEnums).join('\n')}\n\n`
    : ''

  return `${enumStatements}${schema}`
}
