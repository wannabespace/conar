const WORD_BOUNDARY_RE = /\W/
const DOLLAR_QUOTE_RE = /^\$\$|\$[a-z_]\w*\$/i
const STARTS_WITH_BEGIN_RE = /^\s*BEGIN\b/i
const STARTS_WITH_END_RE = /^END\b/i
const HAS_COMMIT_ROLLBACK_RE = /\b(?:COMMIT|ROLLBACK)\b/i
const TRAILING_SEMICOLON_RE = /;\s*$/

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

function hasWordAt(word: string, text: string, pos: number): boolean {
  return (pos === 0 || WORD_BOUNDARY_RE.test(text[pos - 1]!))
    && text.substring(pos, pos + word.length).toUpperCase() === word
    && (pos + word.length === text.length || WORD_BOUNDARY_RE.test(text[pos + word.length]!))
}

function getTransactionKeyword(line: string): 'begin' | 'commit' | 'rollback' | null {
  const keyword = line.trim().replace(TRAILING_SEMICOLON_RE, '').toUpperCase()
  if (keyword === 'BEGIN')
    return 'begin'
  if (keyword === 'COMMIT')
    return 'commit'
  if (keyword === 'ROLLBACK')
    return 'rollback'
  return null
}

function trackDollarQuotes(line: string, activeTag: string | null): string | null {
  let tag = activeTag
  let i = 0
  while (i < line.length) {
    if (tag === null) {
      const match = line.substring(i).match(DOLLAR_QUOTE_RE)
      if (match) {
        tag = match[0]
        i += tag.length
        continue
      }
    }
    else {
      const closeIdx = line.indexOf(tag, i)
      if (closeIdx !== -1) {
        i = closeIdx + tag.length
        tag = null
        continue
      }
      return tag
    }
    i++
  }
  return tag
}

function updateBeginEndDepth(line: string, depth: number): number {
  const upper = line.toUpperCase()
  for (let i = 0; i < upper.length;) {
    if (hasWordAt('BEGIN', upper, i)) {
      depth++
      i += 5
    }
    else if (hasWordAt('END', upper, i)) {
      if (depth > 0)
        depth--
      i += 3
    }
    else {
      i++
    }
  }
  return depth
}

function splitStatements(query: string): string[] {
  const trimmed = query.trim()

  if (STARTS_WITH_BEGIN_RE.test(trimmed) && HAS_COMMIT_ROLLBACK_RE.test(trimmed)) {
    return [trimmed]
  }

  const parts: string[] = []
  let current = ''
  let dollarTag: string | null = null
  let insideBeginEnd = false
  let i = 0

  while (i < query.length) {
    if (dollarTag !== null) {
      const closeIdx = query.indexOf(dollarTag, i)
      if (closeIdx !== -1) {
        current += query.substring(i, closeIdx + dollarTag.length)
        i = closeIdx + dollarTag.length
        dollarTag = null
      }
      else {
        current += query.substring(i)
        break
      }
      continue
    }

    const dollarMatch = query.substring(i).match(DOLLAR_QUOTE_RE)
    if (dollarMatch) {
      dollarTag = dollarMatch[0]
      current += dollarTag
      i += dollarTag.length
      continue
    }

    const rest = query.substring(i)
    if (!insideBeginEnd && STARTS_WITH_BEGIN_RE.test(rest)) {
      insideBeginEnd = true
      current += rest.slice(0, 5)
      i += 5
      continue
    }
    if (insideBeginEnd && STARTS_WITH_END_RE.test(rest)) {
      insideBeginEnd = false
      current += rest.slice(0, 3)
      i += 3
      continue
    }

    if (query[i] === ';' && !insideBeginEnd) {
      const part = current.trim()
      if (part)
        parts.push(part)
      current = ''
      i++
      continue
    }

    current += query[i]
    i++
  }

  const remaining = current.trim()
  if (remaining)
    parts.push(remaining)
  return parts
}

function flushTransaction(results: EditorQuery[], state: ParserState, endLine: number) {
  const text = state.buffer.trim()
  if (text) {
    results.push({
      startLineNumber: state.transactionStartLine ?? state.startLine,
      endLineNumber: endLine,
      queries: [text],
    })
  }
  state.buffer = ''
  state.dollarTag = null
  state.beginStartLine = null
  state.beginDepth = 0
  state.inTransaction = false
  state.transactionStartLine = null
}

export function getEditorQueries(sql: string): EditorQuery[] {
  const lines = sql.split('\n')
  const results: EditorQuery[] = []
  const state: ParserState = {
    buffer: '',
    startLine: 1,
    inBlockComment: false,
    dollarTag: null,
    beginDepth: 0,
    beginStartLine: null,
    inTransaction: false,
    transactionStartLine: null,
  }

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1
    let line = lines[i]!

    if (!state.inBlockComment && line.includes('/*'))
      state.inBlockComment = true
    if (state.inBlockComment) {
      if (line.includes('*/'))
        state.inBlockComment = false
      continue
    }

    const wasInDollarQuote = state.dollarTag !== null
    state.dollarTag = trackDollarQuotes(line, state.dollarTag)
    const inDollarQuote = state.dollarTag !== null

    if (!wasInDollarQuote) {
      const commentIdx = line.indexOf('--')
      if (commentIdx !== -1)
        line = line.substring(0, commentIdx)
    }

    line = line.trim()
    if (!line)
      continue

    if (!inDollarQuote) {
      const txn = getTransactionKeyword(line)
      if (txn === 'begin') {
        state.inTransaction = true
        state.transactionStartLine ??= lineNum
      }
      else if (txn === 'commit' || txn === 'rollback') {
        state.buffer += (state.buffer ? ' ' : '') + line
        flushTransaction(results, state, lineNum)
        continue
      }
    }

    if (!inDollarQuote) {
      const prevDepth = state.beginDepth
      state.beginDepth = updateBeginEndDepth(line, state.beginDepth)
      if (prevDepth === 0 && state.beginDepth > 0 && !state.buffer) {
        state.beginStartLine = lineNum
      }
    }

    if (!state.buffer) {
      state.startLine = lineNum
      if (state.inTransaction && state.transactionStartLine !== null)
        state.startLine = state.transactionStartLine
      else if (state.beginDepth > 0 && state.beginStartLine !== null)
        state.startLine = state.beginStartLine
    }

    state.buffer += (state.buffer ? ' ' : '') + line

    const atTopLevel = !state.inTransaction && state.beginDepth === 0 && !inDollarQuote
    if (atTopLevel && line.endsWith(';')) {
      const query = state.buffer.slice(0, -1).trim()
      if (query) {
        results.push({
          startLineNumber: state.startLine,
          endLineNumber: lineNum,
          queries: splitStatements(query),
        })
      }
      state.buffer = ''
      state.dollarTag = null
      state.beginStartLine = null
    }
  }

  if (state.buffer.trim()) {
    results.push({
      startLineNumber: state.transactionStartLine ?? state.beginStartLine ?? state.startLine,
      endLineNumber: lines.length,
      queries: splitStatements(state.buffer.trim()),
    })
  }

  return results
}
