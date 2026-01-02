import type { enumType } from '../sql/enums'
import type { Column } from './table'
import type { DatabaseDialect, GeneratorFormat } from './types'

export const DEFAULT_PAGE_LIMIT = 100

export const DEFAULT_ROW_HEIGHT = 32
export const DEFAULT_COLUMN_WIDTH = 240

export const DANGEROUS_SQL_KEYWORDS = ['DELETE', 'UPDATE', 'DROP', 'RENAME', 'TRUNCATE', 'ALTER'] as const

export function hasDangerousSqlKeywords(sql: string) {
  const uncommentedLines = sql.split('\n').filter(line => !line.trim().startsWith('--')).join('\n')
  const dangerousKeywordsPattern = DANGEROUS_SQL_KEYWORDS.map(keyword => `\\b${keyword}\\b`).join('|')
  return new RegExp(dangerousKeywordsPattern, 'gi').test(uncommentedLines)
}

function isWord(word: string, line: string, idx: number) {
  return (idx === 0 || /\W/.test(line[idx - 1]!))
    && line.substring(idx, idx + word.length).toUpperCase() === word
    && (idx + word.length === line.length || /\W/.test(line[idx + word.length]!))
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
  let beginEndBlockDepth = 0
  let beginEndStartLine: number | null = null

  const splitQueryBySemicolons = (query: string): string[] => {
    const parts: string[] = []
    let currentPart = ''
    let currentTag: string | null = null
    let i = 0
    let localBeginEndBlockDepth = 0

    while (i < query.length) {
      if (currentTag === null) {
        const dollarMatch = query.substring(i).match(/^\$\$|\$[a-z_]\w*\$/i)
        if (dollarMatch) {
          currentTag = dollarMatch[0]
          currentPart += currentTag
          i += currentTag.length
          continue
        }

        const beginMatch = query.substring(i).match(/^(BEGIN)\b/i)
        const endMatch = query.substring(i).match(/^(END)\b/i)
        if (beginMatch && localBeginEndBlockDepth === 0) {
          localBeginEndBlockDepth++
          currentPart += beginMatch[0]
          i += beginMatch[0].length
          continue
        }
        if (endMatch && localBeginEndBlockDepth > 0) {
          localBeginEndBlockDepth--
          currentPart += endMatch[0]
          i += endMatch[0].length
          continue
        }

        if (query[i] === ';' && localBeginEndBlockDepth === 0) {
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

  const processDollarQuotes = (line: string): { newTag: string | null } => {
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

    if (!isInDollarQuote) {
      for (let idx = 0; idx < line.length;) {
        if (isWord('BEGIN', line.toUpperCase(), idx)) {
          beginEndBlockDepth++
          if (beginEndBlockDepth === 1 && !currentQuery) {
            beginEndStartLine = lineNum
          }
          idx += 5
        }
        else if (isWord('END', line.toUpperCase(), idx)) {
          if (beginEndBlockDepth > 0)
            beginEndBlockDepth--
          idx += 3
        }
        else {
          idx++
        }
      }
    }

    if (!currentQuery) {
      queryStartLine = lineNum
      if (beginEndBlockDepth > 0 && beginEndStartLine !== null) {
        queryStartLine = beginEndStartLine
      }
    }

    currentQuery += (currentQuery ? ' ' : '') + line

    if (beginEndBlockDepth === 0 && !isInDollarQuote && line.endsWith(';')) {
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
      beginEndStartLine = null
    }
  }

  if (currentQuery.trim()) {
    const trimmedQuery = currentQuery.trim()
    const queryParts = splitQueryBySemicolons(trimmedQuery)
    queries.push({
      startLineNumber: beginEndStartLine ?? queryStartLine,
      endLineNumber: lines.length,
      queries: queryParts,
    })
  }

  return queries
}

export function toPascalCase(name: string): string {
  const alphanumeric = name.replace(/[^a-z0-9]+/gi, ' ')
  const words = alphanumeric.trim().split(/\s+/).filter(Boolean)
  let pascal = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')

  if (!pascal) {
    pascal = 'Table'
  }

  if (/^[^A-Z_]/i.test(pascal)) {
    pascal = `_${pascal}`
  }

  return pascal
}

export function sanitize(name: string) {
  return name.replace(/\W/g, '_')
}

export const TYPE_MAPPINGS: Record<GeneratorFormat, (type: string, dialect?: DatabaseDialect) => string> = {
  ts: (t) => {
    if (/int|float|decimal|number|double|numeric/i.test(t))
      return 'number'
    if (/bool|bit/i.test(t))
      return 'boolean'
    if (/date|time/i.test(t))
      return 'Date'
    if (/json/i.test(t))
      return 'any'
    return 'string'
  },
  zod: (t) => {
    if (/int|float|decimal|number|double|numeric/i.test(t))
      return 'z.number()'
    if (/bool|bit/i.test(t))
      return 'z.boolean()'
    if (/date|time/i.test(t))
      return 'z.date()'
    if (/json/i.test(t))
      return 'z.any()'
    return 'z.string()'
  },
  prisma: (t, d) => {
    if (d === 'mssql' && /^date$/i.test(t))
      return 'DateTime @db.Date'
    if (/int/i.test(t))
      return 'Int'
    if (/float|double/i.test(t))
      return 'Float'
    if (/decimal|numeric/i.test(t))
      return 'Decimal'
    if (/bool|bit/i.test(t))
      return 'Boolean'
    if (/date|timestamp/i.test(t))
      return 'DateTime'
    if (/json/i.test(t))
      return 'Json'
    return 'String'
  },
  drizzle: (t, d) => {
    if (d === 'mssql' && /datetime2/i.test(t))
      return 'datetime2'
    if (d === 'mssql' && /datetime/i.test(t))
      return 'datetime'

    if (/serial/i.test(t))
      return 'serial'
    if (/tinyint/i.test(t))
      return 'tinyint'
    if (/int/i.test(t))
      return 'integer'
    if (/text/i.test(t))
      return 'text'
    if (/nvarchar/i.test(t))
      return 'nvarchar'
    if (/varchar|varying|char/i.test(t))
      return 'varchar'
    if (/bit/i.test(t))
      return 'bit'
    if (/bool/i.test(t))
      return 'boolean'
    if (/timestamp/i.test(t))
      return 'timestamp'
    if (/datetime2/i.test(t))
      return 'datetime2'
    if (/datetime/i.test(t))
      return 'datetime'
    if (/^date$/i.test(t))
      return 'date'
    if (/decimal|numeric/i.test(t))
      return 'decimal'
    if (/float|double|real/i.test(t)) {
      if (d === 'mysql')
        return 'double'
      if (d === 'postgres')
        return 'doublePrecision'
      if (d === 'mssql')
        return 'float'
      return 'real'
    }
    if (d !== 'mssql' && /json/i.test(t))
      return 'json'
    return 'text'
  },
  sql: (t, d) => {
    if (d === 'postgres') {
      if (/datetime2/i.test(t))
        return 'timestamp'
      if (/nvarchar/i.test(t))
        return 'varchar'
      if (/int32/i.test(t))
        return 'integer'
    }
    return t
  },
  kysely: t => t,
}

export function getColumnType(type: string | undefined, format: GeneratorFormat, dialect?: DatabaseDialect): string {
  if (!type)
    return 'any'
  const mapper = TYPE_MAPPINGS[format]
  return mapper ? mapper(type, dialect) : type
}

export function formatValue(value: unknown): string {
  if (value === null)
    return 'NULL'
  if (typeof value === 'string')
    return `'${value.replace(/'/g, '\'\'')}'`
  if (typeof value === 'number')
    return String(value)
  if (typeof value === 'boolean')
    return value ? 'TRUE' : 'FALSE'
  if (value instanceof Date)
    return `'${value.toISOString()}'`
  return `'${String(value)}'`
}

export function quoteIdentifier(name: string, dialect: DatabaseDialect) {
  if (dialect === 'mysql' || dialect === 'clickhouse')
    return `\`${name}\``
  if (dialect === 'mssql')
    return `[${name}]`
  return `"${name}"`
}

export function findEnum(c: Column, table: string, enums: typeof enumType.infer[]) {
  return enums.find(e =>
    (e.metadata?.table === table && e.metadata?.column === c.id)
    || (c.enum && e.name === c.enum)
    || (c.type && e.name === c.type),
  )
}
