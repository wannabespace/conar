export const DEFAULT_LIMIT = 100

export const DEFAULT_ROW_HEIGHT = 32
export const DEFAULT_COLUMN_WIDTH = 240

export const DANGEROUS_SQL_KEYWORDS = ['DELETE', 'UPDATE', 'INSERT', 'DROP', 'RENAME', 'TRUNCATE', 'ALTER']

export function hasDangerousSqlKeywords(query: string) {
  const uncommentedLines = query.split('\n').filter(line => !line.trim().startsWith('--')).join('\n')
  const dangerousKeywordsPattern = DANGEROUS_SQL_KEYWORDS.map(keyword => `\\b${keyword}\\b`).join('|')

  return new RegExp(dangerousKeywordsPattern, 'gi').test(uncommentedLines)
}

export function getSQLQueries(sql: string) {
  const lines = sql.split('\n')
  const queries: { lineNumber: number, endLineNumber: number, queries: string[] }[] = []
  let currentQuery = ''
  let queryStartLine = 1
  let inMultilineComment = false

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1
    let line = lines[i]!

    if (!inMultilineComment && line.includes('/*')) {
      inMultilineComment = true
    }
    if (inMultilineComment) {
      if (line.includes('*/')) {
        inMultilineComment = false
      }
      continue
    }

    const commentIndex = line.indexOf('--')
    if (commentIndex !== -1) {
      line = line.substring(0, commentIndex)
    }

    line = line.trim()
    if (!line)
      continue

    if (!currentQuery) {
      queryStartLine = lineNum
    }

    currentQuery += (currentQuery ? ' ' : '') + line

    if (line.endsWith(';')) {
      const query = currentQuery.slice(0, -1).trim()
      if (query) {
        queries.push({
          lineNumber: queryStartLine,
          endLineNumber: lineNum,
          queries: query.split(';').map(q => q.trim()).filter(q => q.length > 0),
        })
      }
      currentQuery = ''
    }
  }

  if (currentQuery.trim()) {
    const trimmedQuery = currentQuery.trim()
    queries.push({
      lineNumber: queryStartLine,
      endLineNumber: lines.length,
      queries: trimmedQuery.split(';').map(q => q.trim()).filter(q => q.length > 0),
    })
  }

  return queries
}
