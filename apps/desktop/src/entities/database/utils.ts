export const DANGEROUS_SQL_KEYWORDS = ['DELETE', 'UPDATE', 'INSERT', 'DROP']

export function hasDangerousSqlKeywords(query: string) {
  return DANGEROUS_SQL_KEYWORDS.some(dangerousSqlKeyword => query.toLowerCase().includes(`${dangerousSqlKeyword.toLowerCase()} `))
}
