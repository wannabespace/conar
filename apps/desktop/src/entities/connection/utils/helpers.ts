import { SafeURL } from '@conar/shared/utils/safe-url'

export const DEFAULT_PAGE_LIMIT = 100

export function getDisplayValue(value: unknown, size: number): string {
  let display: string

  if (value === null)
    display = 'null'
  else if (value === '')
    display = 'empty'
  else if (typeof value === 'string')
    display = value
  else if (typeof value === 'object')
    display = JSON.stringify(value)
  else
    display = String(value)

  return display.replaceAll('\n', ' ').slice(0, (size / 6) + 5 + 50)
}

export function getValueForEditor(value: unknown): string {
  if (value === null || value === undefined)
    return ''
  if (value instanceof Date)
    return value.toISOString()
  if (typeof value === 'string')
    return value
  return JSON.stringify(value, null, 2)
}

export function wrapExplainQuery(query: string) {
  const trimmedQuery = query.trim().toLowerCase()
  return trimmedQuery.startsWith('explain') ? query : `EXPLAIN ${query.trim()}`
}

export function getConnectionStringToShow(connectionString: string, { withPathname = false, withProtocol = false }: { withPathname?: boolean, withProtocol?: boolean } = {}) {
  const parsed = new SafeURL(connectionString)
  return `${withProtocol ? `${parsed.protocol}//` : ''}${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}${withPathname && parsed.pathname !== '/' ? parsed.pathname : ''}`
}

export const DANGEROUS_SQL_KEYWORDS = ['DELETE', 'UPDATE', 'DROP', 'RENAME', 'TRUNCATE', 'ALTER'] as const

export function hasDangerousSqlKeywords(sql: string) {
  const uncommentedLines = sql.split('\n').filter(line => !line.trim().startsWith('--')).join('\n')
  const dangerousKeywordsPattern = DANGEROUS_SQL_KEYWORDS.map(keyword => `\\b${keyword}\\b`).join('|')
  return new RegExp(dangerousKeywordsPattern, 'gi').test(uncommentedLines)
}
