import type { SqlLanguage } from 'sql-formatter'
import { format } from 'sql-formatter'

export function formatSql(
  query: string,
  language: SqlLanguage = 'postgresql',
) {
  return format(query, {
    language,
    keywordCase: 'upper',
  })
}
