/* eslint-disable e18e/prefer-static-regex */
import type { QueryParams, SchemaParams } from '..'
import type { Column } from '../../components/table/cell'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { formatSql } from '~/lib/formatter'
import { coldDialects } from '../../dialects'
import { buildWhere } from '../../queries/rows'
import * as templates from '../templates'
import { filterExplicitIndexes, formatValue, getColumnType, groupIndexes, quoteIdentifier } from '../utils'

function inlineParameters(sql: string, parameters: readonly unknown[]): string {
  let i = 0
  return sql.replace(/\$\d+|\?/g, () => formatValue(parameters[i++]))
}

export function generateQuerySQL({
  table,
  filters,
  dialect = ConnectionType.Postgres,
}: QueryParams) {
  const db = coldDialects[dialect]()
  const base = db.withTables<{ [table]: Record<string, unknown> }>().selectFrom(table).selectAll()
  const query = filters.length > 0 ? base.where(eb => buildWhere(eb, filters)) : base
  const compiled = query.compile()
  return formatSql(inlineParameters(compiled.sql, compiled.parameters), dialect)
}

function escapeSqlString(s: string): string {
  return s.replace(/'/g, '\'\'')
}

function formatEnumType(values: string[], name: string, dialect: ConnectionType): string {
  if (dialect === ConnectionType.ClickHouse) {
    const prefix = values.length > 255 ? 'Enum16' : 'Enum8'
    const pairs = values
      .map((v, i) => `'${escapeSqlString(v)}' = ${i + 1}`)
      .join(', ')
    return `${prefix}(${pairs})`
  }
  if (dialect === ConnectionType.MySQL) {
    const valuesList = values.map(v => `'${escapeSqlString(v)}'`).join(', ')
    return `ENUM(${valuesList})`
  }
  if (dialect === ConnectionType.MSSQL) {
    return name
  }
  return `"${name}"`
}

function formatScalarType(c: Column, dialect: ConnectionType) {
  let typeDef = getColumnType(c.type!, 'sql', dialect)

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
  dialect: ConnectionType,
  usedEnums: Map<string, string[]>,
): string {
  if (c.enumName && c.availableValues?.length) {
    const enumName = c.enumName
    if (dialect === ConnectionType.Postgres) {
      usedEnums.set(enumName, c.availableValues)
    }
    return formatEnumType(c.availableValues, enumName, dialect)
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
    if (dialect === ConnectionType.MySQL && /int|serial/i.test(c.type!)) {
      parts.push('AUTO_INCREMENT')
    }
    if (dialect === ConnectionType.MSSQL && /int/i.test(c.type!)) {
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
    let fk = `  FOREIGN KEY (${quoted}) REFERENCES ${ref}(${col})`

    if (c.foreign.onDelete)
      fk += ` ON DELETE ${c.foreign.onDelete}`
    if (c.foreign.onUpdate)
      fk += ` ON UPDATE ${c.foreign.onUpdate}`

    foreignKey = fk
  }

  return { parts, foreignKey }
}

function buildPostgresEnumStatements(usedEnums: Map<string, string[]>): string[] {
  return Array.from(usedEnums.entries(), ([name, values]) => {
    const vals = values.map(v => `'${escapeSqlString(v)}'`).join(', ')
    return `CREATE TYPE "${name}" AS ENUM (${vals});`
  })
}

function appendIndexStatements(
  schema: string,
  table: string,
  columns: Column[],
  groupedIndexes: ReturnType<typeof groupIndexes>,
  dialect: ConnectionType,
): string {
  const explicit = filterExplicitIndexes(groupedIndexes, columns, dialect)
  if (explicit.length === 0)
    return schema

  const lines = explicit.map((idx) => {
    return [
      'CREATE',
      idx.isUnique ? 'UNIQUE' : '',
      'INDEX',
      `${quoteIdentifier(idx.name, dialect)}`,
      'ON',
      quoteIdentifier(table, dialect),
      dialect === ConnectionType.Postgres && idx.type ? `USING ${idx.type}` : '',
      `(${[
        ...idx.columns.map(c => quoteIdentifier(c, dialect)),
        ...idx.customExpressions,
      ].join(', ')})`,
    ].filter(Boolean).join(' ')
  })
  return `${schema}\n\n${lines.join('\n')}`
}

export function generateSchemaSQL({
  table,
  columns,
  dialect,
  indexes = [],
}: SchemaParams) {
  const usedEnums = new Map<string, string[]>()
  const pkColumns: string[] = []
  const { columnLines, foreignKeys } = columns.reduce<{
    columnLines: string[]
    foreignKeys: string[]
  }>(
    (acc, c) => {
      let typeDef = getTypeDef(c, dialect, usedEnums)
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
      acc.columnLines.push(`  ${parts.join(' ')}`)
      if (foreignKey)
        acc.foreignKeys.push(foreignKey)
      return acc
    },
    { columnLines: [], foreignKeys: [] },
  )

  let columnBlock = columnLines.join(',\n')
  if (foreignKeys.length > 0) {
    columnBlock += `,\n${foreignKeys.join(',\n')}`
  }

  let schema = templates.sqlSchemaTemplate(quoteIdentifier(table, dialect), columnBlock)

  if (dialect === ConnectionType.ClickHouse) {
    const orderBy = pkColumns.length === 0
      ? 'tuple()'
      : pkColumns.length === 1
        ? pkColumns[0]
        : `(${pkColumns.join(', ')})`
    schema = schema.replace(/\);\s*$/, `) ENGINE = MergeTree() ORDER BY ${orderBy};`)
  }

  const groupedIndexes = groupIndexes(indexes, table)
  schema = appendIndexStatements(schema, table, columns, groupedIndexes, dialect)

  const needsPostgresEnums = usedEnums.size > 0
    && dialect !== ConnectionType.MySQL
    && dialect !== ConnectionType.MSSQL
    && dialect !== ConnectionType.ClickHouse
  const enumStatements = needsPostgresEnums
    ? `${buildPostgresEnumStatements(usedEnums).join('\n')}\n\n`
    : ''

  return `${enumStatements}${schema}`
}
