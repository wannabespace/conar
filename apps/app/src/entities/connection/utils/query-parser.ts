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

// Returns true when `word` appears as a whole word at `pos` inside `text`.
function hasWordAt(word: string, text: string, pos: number): boolean {
  return (pos === 0 || WORD_BOUNDARY_RE.test(text[pos - 1]!))
    && text.substring(pos, pos + word.length).toUpperCase() === word
    && (pos + word.length === text.length || WORD_BOUNDARY_RE.test(text[pos + word.length]!))
}

const TRANSACTION_KEYWORDS: Record<string, 'begin' | 'commit' | 'rollback'> = {
  BEGIN: 'begin',
  COMMIT: 'commit',
  ROLLBACK: 'rollback',
}

// Returns the transaction keyword when the entire line is just that keyword
// (with an optional trailing semicolon), otherwise null.
function getTransactionKeyword(line: string): 'begin' | 'commit' | 'rollback' | null {
  const keyword = line.trim().replace(TRAILING_SEMICOLON_RE, '').toUpperCase()
  return TRANSACTION_KEYWORDS[keyword] ?? null
}

// Scans `line` for dollar-quote delimiters, toggling in/out of quoting as they appear.
// Returns the still-open tag if the line ends inside a dollar-quoted string, otherwise null.
function trackDollarQuotes(line: string, activeTag: string | null): string | null {
  let tag = activeTag
  let pos = 0

  while (pos < line.length) {
    if (tag === null) {
      const match = line.substring(pos).match(DOLLAR_QUOTE_RE)
      if (!match) break
      tag = match[0]
      pos += tag.length
    }
    else {
      const closePos = line.indexOf(tag, pos)
      if (closePos === -1) return tag // tag is still open at end of line
      pos = closePos + tag.length
      tag = null
    }
  }

  return tag
}

// Counts unmatched BEGIN keywords in `line` and returns the updated depth.
function updateBeginDepth(line: string, depth: number): number {
  const upper = line.toUpperCase()
  for (let i = 0; i < upper.length;) {
    if (hasWordAt('BEGIN', upper, i)) {
      depth++
      i += 'BEGIN'.length
    }
    else if (hasWordAt('END', upper, i)) {
      if (depth > 0) depth--
      i += 'END'.length
    }
    else {
      i++
    }
  }
  return depth
}

// Splits a SQL string on semicolons into individual statements,
// respecting dollar-quoted strings and BEGIN/END blocks.
function splitStatements(query: string): string[] {
  const trimmed = query.trim()

  // A transaction block (BEGIN … COMMIT/ROLLBACK) is kept as one statement.
  if (STARTS_WITH_BEGIN_RE.test(trimmed) && HAS_COMMIT_ROLLBACK_RE.test(trimmed))
    return [trimmed]

  const statements: string[] = []
  let current = ''
  let dollarTag: string | null = null
  let insideBeginEnd = false
  let i = 0

  while (i < query.length) {
    // Inside a dollar-quoted string: consume everything up to the closing tag.
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
      current += rest.slice(0, 'BEGIN'.length)
      i += 'BEGIN'.length
      continue
    }

    if (insideBeginEnd && STARTS_WITH_END_RE.test(rest)) {
      insideBeginEnd = false
      current += rest.slice(0, 'END'.length)
      i += 'END'.length
      continue
    }

    if (query[i] === ';' && !insideBeginEnd) {
      const statement = current.trim()
      if (statement) statements.push(statement)
      current = ''
      i++
      continue
    }

    current += query[i]
    i++
  }

  const remaining = current.trim()
  if (remaining) statements.push(remaining)
  return statements
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
  state.beginDepth = 0
  state.beginStartLine = null
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

    // Skip block-comment lines.
    if (!state.inBlockComment && line.includes('/*'))
      state.inBlockComment = true
    if (state.inBlockComment) {
      if (line.includes('*/')) state.inBlockComment = false
      continue
    }

    // Update dollar-quote state before stripping inline comments so we know
    // whether the line started inside a quoted string.
    const lineStartsInDollarQuote = state.dollarTag !== null
    state.dollarTag = trackDollarQuotes(line, state.dollarTag)
    const inDollarQuote = state.dollarTag !== null

    // Strip inline comments, but never inside a dollar-quoted string.
    if (!lineStartsInDollarQuote) {
      const commentIdx = line.indexOf('--')
      if (commentIdx !== -1) line = line.substring(0, commentIdx)
    }

    line = line.trim()
    if (!line) continue

    // Detect bare transaction keywords (BEGIN / COMMIT / ROLLBACK).
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

    // Track BEGIN/END nesting depth for PL/pgSQL blocks.
    if (!inDollarQuote) {
      const prevDepth = state.beginDepth
      state.beginDepth = updateBeginDepth(line, state.beginDepth)
      if (prevDepth === 0 && state.beginDepth > 0 && !state.buffer)
        state.beginStartLine = lineNum
    }

    // Remember where the current statement started.
    if (!state.buffer) {
      state.startLine = lineNum
      if (state.inTransaction && state.transactionStartLine !== null)
        state.startLine = state.transactionStartLine
      else if (state.beginDepth > 0 && state.beginStartLine !== null)
        state.startLine = state.beginStartLine
    }

    state.buffer += (state.buffer ? ' ' : '') + line

    // Flush completed top-level statements (terminated by a semicolon).
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

  // Flush any unterminated statement at the end of input.
  if (state.buffer.trim()) {
    results.push({
      startLineNumber: state.transactionStartLine ?? state.beginStartLine ?? state.startLine,
      endLineNumber: lines.length,
      queries: splitStatements(state.buffer.trim()),
    })
  }

  return results
}
