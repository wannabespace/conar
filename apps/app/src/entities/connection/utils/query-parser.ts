const WORD_BOUNDARY_RE = /\W/u
const DOLLAR_QUOTE_RE = /^\$\$|\$[a-z_]\w*\$/iu
const STARTS_WITH_BEGIN_RE = /^\s*BEGIN\b/iu
const STARTS_WITH_END_RE = /^END\b/iu
const HAS_COMMIT_ROLLBACK_RE = /\b(?:COMMIT|ROLLBACK)\b/iu
const TRAILING_SEMICOLON_RE = /;\s*$/u

export interface EditorQuery {
  startLineNumber: number
  endLineNumber: number
  queries: string[]
}

interface ParserState {
  buffer: string
  startLine: number
  inBlockComment: boolean
  dollarTag: string | null
  beginDepth: number
  beginStartLine: number | null
  inTransaction: boolean
  transactionStartLine: number | null
}

const hasWordAt = (word: string, text: string, pos: number): boolean => {
  const charBefore = pos === 0 ? undefined : text[pos - 1]
  const charAfter =
    pos + word.length === text.length ? undefined : text[pos + word.length]

  const boundaryBefore =
    charBefore === undefined || WORD_BOUNDARY_RE.test(charBefore)
  const boundaryAfter =
    charAfter === undefined || WORD_BOUNDARY_RE.test(charAfter)

  return (
    boundaryBefore &&
    text.slice(pos, pos + word.length).toUpperCase() === word &&
    boundaryAfter
  )
}

const TRANSACTION_KEYWORDS: Record<string, 'begin' | 'commit' | 'rollback'> = {
  BEGIN: 'begin',
  COMMIT: 'commit',
  ROLLBACK: 'rollback',
}

const getTransactionKeyword = (
  line: string
): 'begin' | 'commit' | 'rollback' | null => {
  const keyword = line.trim().replace(TRAILING_SEMICOLON_RE, '').toUpperCase()
  return TRANSACTION_KEYWORDS[keyword] ?? null
}

const trackDollarQuotes = (
  line: string,
  activeTag: string | null
): string | null => {
  let tag = activeTag
  let pos = 0

  while (pos < line.length) {
    if (tag === null) {
      const rest = line.slice(pos)
      const match = rest.match(/\$\$|\$[a-z_]\w*\$/iu)
      if (!match || match.index === undefined) {
        break
      }
      pos += match.index
      const [matchedTag] = match
      tag = matchedTag
      pos += tag.length
    } else {
      const closePos = line.indexOf(tag, pos)
      if (closePos === -1) {
        return tag
      }
      pos = closePos + tag.length
      tag = null
    }
  }

  return tag
}

const updateBeginDepth = (line: string, depth: number): number => {
  let nextDepth = depth
  const upper = line.toUpperCase()
  for (let i = 0; i < upper.length;) {
    if (hasWordAt('BEGIN', upper, i)) {
      nextDepth += 1
      i += 'BEGIN'.length
    } else if (hasWordAt('END', upper, i)) {
      if (nextDepth > 0) {
        nextDepth -= 1
      }
      i += 'END'.length
    } else {
      i += 1
    }
  }
  return nextDepth
}

const splitStatements = (query: string): string[] => {
  const trimmed = query.trim()

  if (
    STARTS_WITH_BEGIN_RE.test(trimmed) &&
    HAS_COMMIT_ROLLBACK_RE.test(trimmed)
  ) {
    return [trimmed]
  }

  const statements: string[] = []
  let current = ''
  let dollarTag: string | null = null
  let insideBeginEnd = false
  let i = 0

  while (i < query.length) {
    if (dollarTag !== null) {
      const closeIdx = query.indexOf(dollarTag, i)
      if (closeIdx === -1) {
        current += query.slice(i)
        break
      } else {
        current += query.slice(i, closeIdx + dollarTag.length)
        i = closeIdx + dollarTag.length
        dollarTag = null
      }
      continue
    }

    const rest = query.slice(i)
    const dollarMatch = rest.match(DOLLAR_QUOTE_RE)

    if (dollarMatch) {
      const [matchedDollar] = dollarMatch
      dollarTag = matchedDollar
      current += dollarTag
      i += dollarTag.length
    } else if (!insideBeginEnd && STARTS_WITH_BEGIN_RE.test(rest)) {
      insideBeginEnd = true
      current += rest.slice(0, 'BEGIN'.length)
      i += 'BEGIN'.length
    } else if (insideBeginEnd && STARTS_WITH_END_RE.test(rest)) {
      insideBeginEnd = false
      current += rest.slice(0, 'END'.length)
      i += 'END'.length
    } else if (query[i] === ';' && !insideBeginEnd) {
      const statement = current.trim()
      if (statement) {
        statements.push(statement)
      }
      current = ''
      i += 1
    } else {
      current += query[i]
      i += 1
    }
  }

  const remaining = current.trim()
  if (remaining) {
    statements.push(remaining)
  }
  return statements
}

const flushTransaction = (
  results: EditorQuery[],
  state: ParserState,
  endLine: number
) => {
  const text = state.buffer.trim()
  if (text) {
    results.push({
      endLineNumber: endLine,
      queries: [text],
      startLineNumber: state.transactionStartLine ?? state.startLine,
    })
  }
  state.buffer = ''
  state.dollarTag = null
  state.beginDepth = 0
  state.beginStartLine = null
  state.inTransaction = false
  state.transactionStartLine = null
}

const stripSqlLineComment = (
  line: string,
  lineStartsInDollarQuote: boolean
): string => {
  if (lineStartsInDollarQuote) {
    return line
  }
  const commentIdx = line.indexOf('--')
  if (commentIdx === -1) {
    return line
  }
  return line.slice(0, commentIdx)
}

const applyTransactionKeywords = (
  line: string,
  lineNum: number,
  state: ParserState,
  results: EditorQuery[]
): boolean => {
  const txn = getTransactionKeyword(line)
  if (txn === 'begin') {
    state.inTransaction = true
    state.transactionStartLine ??= lineNum
    return false
  }
  if (txn === 'commit' || txn === 'rollback') {
    state.buffer += (state.buffer ? ' ' : '') + line
    flushTransaction(results, state, lineNum)
    return true
  }
  return false
}

const updateBeginTracking = (
  line: string,
  state: ParserState,
  lineNum: number
) => {
  const prevDepth = state.beginDepth
  state.beginDepth = updateBeginDepth(line, state.beginDepth)
  if (prevDepth === 0 && state.beginDepth > 0 && !state.buffer) {
    state.beginStartLine = lineNum
  }
}

const flushCompletedQuery = (
  line: string,
  lineNum: number,
  state: ParserState,
  results: EditorQuery[],
  inDollarQuote: boolean
) => {
  const atTopLevel =
    !state.inTransaction && state.beginDepth === 0 && !inDollarQuote
  if (!(atTopLevel && line.endsWith(';'))) {
    return
  }
  const query = state.buffer.slice(0, -1).trim()
  if (query) {
    results.push({
      endLineNumber: lineNum,
      queries: splitStatements(query),
      startLineNumber: state.startLine,
    })
  }
  state.buffer = ''
  state.dollarTag = null
  state.beginStartLine = null
}

const processParserLine = (
  rawLine: string,
  lineNum: number,
  state: ParserState,
  results: EditorQuery[]
) => {
  if (rawLine.includes('/*')) {
    state.inBlockComment = true
  }
  if (state.inBlockComment) {
    if (rawLine.includes('*/')) {
      state.inBlockComment = false
    }
    return
  }

  const lineStartsInDollarQuote = state.dollarTag !== null
  state.dollarTag = trackDollarQuotes(rawLine, state.dollarTag)
  const inDollarQuote = state.dollarTag !== null

  const line = stripSqlLineComment(rawLine, lineStartsInDollarQuote).trim()
  if (!line) {
    return
  }

  if (!inDollarQuote) {
    if (applyTransactionKeywords(line, lineNum, state, results)) {
      return
    }
    updateBeginTracking(line, state, lineNum)
  }

  if (!state.buffer) {
    state.startLine =
      state.transactionStartLine ?? state.beginStartLine ?? lineNum
  }

  state.buffer += (state.buffer ? ' ' : '') + line
  flushCompletedQuery(line, lineNum, state, results, inDollarQuote)
}

export const getEditorQueries = (sql: string): EditorQuery[] => {
  const lines = sql.split('\n')
  const results: EditorQuery[] = []
  const state: ParserState = {
    beginDepth: 0,
    beginStartLine: null,
    buffer: '',
    dollarTag: null,
    inBlockComment: false,
    inTransaction: false,
    startLine: 1,
    transactionStartLine: null,
  }

  for (let i = 0; i < lines.length; i += 1) {
    const lineNum = i + 1
    const rawLine = lines[i]
    if (rawLine === undefined) {
      continue
    }
    processParserLine(rawLine, lineNum, state, results)
  }

  if (state.buffer.trim()) {
    results.push({
      endLineNumber: lines.length,
      queries: splitStatements(state.buffer.trim()),
      startLineNumber:
        state.transactionStartLine ?? state.beginStartLine ?? state.startLine,
    })
  }

  return results
}
