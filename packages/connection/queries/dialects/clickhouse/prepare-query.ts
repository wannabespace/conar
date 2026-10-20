import type { CompiledQuery } from 'kysely'

const escapeSqlStringRegex = /[\\']/gu

const escapeSqlString = (v: string) => v.replace(escapeSqlStringRegex, '\\$&')

// Quoted text is matched first so a `?` inside a literal or an identifier is not taken for a placeholder.
const compiledSqlRegex =
  /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`]|``)*`|\?/gu
const TABLE = '(?<table>(?:`(?:[^`]|``)+`\\.)*`(?:[^`]|``)+`)'
const UPDATE = new RegExp(`^update ${TABLE} set`, 'iu')
// ClickHouse before 22.8 has no `DELETE FROM`; the mutation form runs on every version.
const DELETE = new RegExp(`^delete from ${TABLE} where`, 'iu')

const formatArrayValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return 'NULL'
  }
  if (typeof value === 'number') {
    return `${value}`
  }
  return `'${escapeSqlString(String(value))}'`
}

export const prepareQuery = (compiledQuery: CompiledQuery) => {
  let i = 0
  const compiledSql = compiledQuery.sql.replace(compiledSqlRegex, (token) => {
    if (token !== '?') {
      return token
    }
    const param = compiledQuery.parameters[i]
    i += 1

    if (param === null || param === undefined) {
      return 'NULL'
    }

    if (Array.isArray(param)) {
      return `[${param.map(formatArrayValue).join(', ')}]`
    }

    if (typeof param === 'number') {
      return `${param}`
    }

    if (param instanceof Date) {
      return `parseDateTime64BestEffort('${escapeSqlString(param.toISOString())}')`
    }

    return `'${escapeSqlString(typeof param === 'string' ? param : JSON.stringify(param))}'`
  })

  const mutation = compiledSql
    .replace(UPDATE, 'alter table $<table> update')
    .replace(DELETE, 'alter table $<table> delete where')
  return mutation === compiledSql
    ? compiledSql
    : `${mutation} settings mutations_sync = 1`
}
