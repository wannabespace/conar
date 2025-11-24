export const DEFAULT_PAGE_LIMIT = 100

export const DEFAULT_ROW_HEIGHT = 32
export const DEFAULT_COLUMN_WIDTH = 240

export const DANGEROUS_SQL_KEYWORDS = ['DELETE', 'UPDATE', 'INSERT', 'DROP', 'RENAME', 'TRUNCATE', 'ALTER'] as const

export function hasDangerousSqlKeywords(query: string) {
  const uncommentedLines = query.split('\n').filter(line => !line.trim().startsWith('--')).join('\n')
  const dangerousKeywordsPattern = DANGEROUS_SQL_KEYWORDS.map(keyword => `\\b${keyword}\\b`).join('|')
  return new RegExp(dangerousKeywordsPattern, 'gi').test(uncommentedLines)
}

export function getEditorQueries(sql: string) {
  const lines = sql.split('\n')
  const queries: {
    startLineNumber: number
    endLineNumber: number
    queries: string[]
  }[] = []
  let currentQuery = ''
  let queryStartLine = 1
  let inMultilineComment = false
  let dollarQuoteTag: string | null = null

  function splitQueryBySemicolons(query: string): string[] {
    const parts: string[] = []
    let currentPart = ''
    let currentTag: string | null = null
    let i = 0

    while (i < query.length) {
      if (currentTag === null) {
        const dollarMatch = query.substring(i).match(/^\$\$|\$[a-z_]\w*\$/i)
        if (dollarMatch) {
          currentTag = dollarMatch[0]
          currentPart += currentTag
          i += currentTag.length
          continue
        }
        if (query[i] === ';') {
          const trimmed = currentPart.trim()
          if (trimmed) {
            parts.push(trimmed)
          }
          currentPart = ''
          i++
          continue
        }
      }
      else {
        const tagIndex = query.indexOf(currentTag, i)
        if (tagIndex !== -1) {
          const tagLength = currentTag.length
          currentPart += query.substring(i, tagIndex + tagLength)
          currentTag = null
          i = tagIndex + tagLength
          continue
        }
      }
      currentPart += query[i]
      i++
    }

    const trimmed = currentPart.trim()
    if (trimmed) {
      parts.push(trimmed)
    }

    return parts.filter(p => p.length > 0)
  }

  function processDollarQuotes(line: string): { newTag: string | null } {
    let currentTag = dollarQuoteTag
    let i = 0

    while (i < line.length) {
      if (currentTag === null) {
        const dollarMatch = line.substring(i).match(/^\$\$|\$[a-z_]\w*\$/i)
        if (dollarMatch) {
          currentTag = dollarMatch[0]
          i += currentTag.length
          continue
        }
      }
      else {
        const tagIndex = line.indexOf(currentTag, i)
        if (tagIndex !== -1) {
          const tagLength = currentTag.length
          currentTag = null
          i = tagIndex + tagLength
          continue
        }
      }
      i++
    }

    return { newTag: currentTag }
  }

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

    const { newTag } = processDollarQuotes(line)
    const wasInDollarQuote = dollarQuoteTag !== null
    dollarQuoteTag = newTag
    const isInDollarQuote = dollarQuoteTag !== null

    const commentIndex = line.indexOf('--')
    if (commentIndex !== -1 && !wasInDollarQuote) {
      line = line.substring(0, commentIndex)
    }

    line = line.trim()
    if (!line)
      continue

    if (!currentQuery) {
      queryStartLine = lineNum
    }

    currentQuery += (currentQuery ? ' ' : '') + line

    if (line.endsWith(';') && !isInDollarQuote) {
      const query = currentQuery.slice(0, -1).trim()
      if (query) {
        const queryParts = splitQueryBySemicolons(query)
        queries.push({
          startLineNumber: queryStartLine,
          endLineNumber: lineNum,
          queries: queryParts,
        })
      }
      currentQuery = ''
      dollarQuoteTag = null
    }
  }

  if (currentQuery.trim()) {
    const trimmedQuery = currentQuery.trim()
    const queryParts = splitQueryBySemicolons(trimmedQuery)
    queries.push({
      startLineNumber: queryStartLine,
      endLineNumber: lines.length,
      queries: queryParts,
    })
  }

  return queries
}
