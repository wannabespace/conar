import type { DialectSpec } from './dialect'

type TokenKind =
  | 'comment'
  | 'function'
  | 'identifier'
  | 'keyword'
  | 'number'
  | 'operator'
  | 'punctuation'
  | 'string'
  | 'type'
  | 'variable'

export interface Token {
  kind: TokenKind
  text: string
  start: number
  end: number
  unclosed?: true
  /** Quoted identifiers keep `identifier`; this marks them so lookups strip the quotes. */
  quoted?: true
}

interface OpenState {
  kind: 'comment' | 'string' | 'identifier'
  close: string
  backslash: boolean
  doubled: boolean
}

export type TokenizerState = OpenState | { kind: 'none' }

export const INITIAL_STATE: TokenizerState = { kind: 'none' }
const CLOSED = { backslash: false, doubled: false }

const WORD_START = /[\p{L}_]/u
const WORD = /[\p{L}\p{N}_$]/u
const DIGIT = /\d/u
const DOLLAR_TAG = /\$(?<tag>[A-Za-z_]\w*)?\$/uy
const NUMBER =
  /(?:0x[\dA-Fa-f]+|\d+(?:\.\d*)?(?:[Ee][+-]?\d+)?|\.\d+(?:[Ee][+-]?\d+)?)/uy
const CALL_PAREN = /\s*\(/uy
const OPERATORS = [
  '->>',
  '#>>',
  '!~*',
  '<=>',
  '<>',
  '!=',
  '<=',
  '>=',
  '||',
  '::',
  '->',
  '#>',
  '@>',
  '<@',
  '?|',
  '?&',
  '~*',
  '!~',
  '<<',
  '>>',
  '&&',
  '+',
  '-',
  '*',
  '/',
  '%',
  '<',
  '>',
  '=',
  '~',
  '^',
  '!',
  '&',
  '|',
  '?',
  '#',
  '@',
]
const PUNCTUATION = new Set(['(', ')', ',', ';', '.', '[', ']', '{', '}', ':'])
const CLOSING_QUOTE: Record<string, string> = { '"': '"', '[': ']', '`': '`' }

const stickyMatch = (regex: RegExp, text: string, at: number) => {
  regex.lastIndex = at
  return regex.exec(text)?.[0]
}

const wordEnd = (text: string, from: number) => {
  let end = from
  while (end < text.length && WORD.test(text[end] ?? '')) {
    end += 1
  }
  return end
}

const scanUntil = (
  text: string,
  from: number,
  { backslash, close, doubled }: OpenState
): { end: number; unclosed: boolean } => {
  let index = from
  while (index < text.length) {
    if (backslash && text[index] === '\\') {
      index += 2
      continue
    }
    if (text.startsWith(close, index)) {
      if (doubled && text.startsWith(close, index + close.length)) {
        index += close.length * 2
        continue
      }
      return { end: index + close.length, unclosed: false }
    }
    index += 1
  }
  return { end: text.length, unclosed: true }
}

const openingAt = (
  text: string,
  index: number,
  dialect: DialectSpec
): { pending: OpenState; contentStart: number } | null => {
  const char = text[index] ?? ''
  if (text.startsWith('/*', index)) {
    return {
      contentStart: index + 2,
      pending: { ...CLOSED, close: '*/', kind: 'comment' },
    }
  }
  if (dialect.dollarQuotes && char === '$') {
    const tag = stickyMatch(DOLLAR_TAG, text, index)
    if (tag) {
      return {
        contentStart: index + tag.length,
        pending: { ...CLOSED, close: tag, kind: 'string' },
      }
    }
  }
  if (dialect.identifierQuotes.includes(char)) {
    return {
      contentStart: index + 1,
      pending: {
        ...CLOSED,
        close: CLOSING_QUOTE[char] ?? char,
        doubled: true,
        kind: 'identifier',
      },
    }
  }
  // MySQL reads "..." as a string unless ANSI_QUOTES is on; every dialect reads '...' as one.
  if (char === "'" || char === '"') {
    return {
      contentStart: index + 1,
      pending: {
        backslash: dialect.backslashEscapes,
        close: char,
        doubled: true,
        kind: 'string',
      },
    }
  }
  return null
}

const wordKind = (
  text: string,
  start: number,
  end: number,
  dialect: DialectSpec
): TokenKind => {
  const upper = text.slice(start, end).toUpperCase()
  if (dialect.keywords.has(upper)) {
    return 'keyword'
  }
  if (dialect.types.has(upper)) {
    return 'type'
  }
  if (dialect.functions.has(upper) && stickyMatch(CALL_PAREN, text, end)) {
    return 'function'
  }
  return 'identifier'
}

const tokenAt = (
  text: string,
  index: number,
  dialect: DialectSpec
): Pick<Token, 'kind' | 'end'> | null => {
  const char = text[index] ?? ''
  const next = text[index + 1] ?? ''

  if (
    text.startsWith('--', index) ||
    (dialect.hashComments && char === '#' && next !== '>')
  ) {
    const newline = text.indexOf('\n', index)
    return { end: newline === -1 ? text.length : newline, kind: 'comment' }
  }
  if (
    (dialect.atVariables && char === '@' && WORD.test(next)) ||
    (char === '$' && DIGIT.test(next))
  ) {
    return { end: wordEnd(text, index + 1), kind: 'variable' }
  }
  if (DIGIT.test(char) || (char === '.' && DIGIT.test(next))) {
    const match = stickyMatch(NUMBER, text, index)
    if (match) {
      return { end: index + match.length, kind: 'number' }
    }
  }
  if (WORD_START.test(char)) {
    const end = wordEnd(text, index + 1)
    return { end, kind: wordKind(text, index, end, dialect) }
  }
  const operator = OPERATORS.find((candidate) =>
    text.startsWith(candidate, index)
  )
  if (operator) {
    return { end: index + operator.length, kind: 'operator' }
  }
  if (PUNCTUATION.has(char)) {
    return { end: index + 1, kind: 'punctuation' }
  }
  return null
}

export const tokenize = (
  text: string,
  dialect: DialectSpec,
  initialState: TokenizerState = INITIAL_STATE
): { tokens: Token[]; state: TokenizerState } => {
  const tokens: Token[] = []
  let state = initialState
  let index = 0

  const push = (
    kind: TokenKind,
    start: number,
    end: number,
    extra?: Pick<Token, 'quoted' | 'unclosed'>
  ) => {
    tokens.push({ end, kind, start, text: text.slice(start, end), ...extra })
    index = end
  }

  const enclosed = (
    pending: OpenState,
    start: number,
    contentStart: number
  ) => {
    const { end, unclosed } = scanUntil(text, contentStart, pending)
    push(pending.kind, start, end, {
      ...(pending.kind === 'identifier' && { quoted: true }),
      ...(unclosed && { unclosed }),
    })
    state = unclosed ? pending : INITIAL_STATE
  }

  while (index < text.length) {
    if (state.kind !== 'none') {
      enclosed(state, index, index)
      continue
    }
    if (/\s/u.test(text[index] ?? '')) {
      index += 1
      continue
    }
    const opening = openingAt(text, index, dialect)
    if (opening) {
      enclosed(opening.pending, index, opening.contentStart)
      continue
    }
    const token = tokenAt(text, index, dialect)
    if (token) {
      push(token.kind, index, token.end)
    } else {
      index += 1
    }
  }

  return { state, tokens }
}

export const identifierName = (token: Token) =>
  token.quoted ? token.text.slice(1, -1) : token.text

export const isKeyword = (token: Token | undefined, ...words: string[]) =>
  token?.kind === 'keyword' && words.includes(token.text.toUpperCase())

export const isPunctuation = (token: Token | undefined, char: string) =>
  token?.kind === 'punctuation' && token.text === char
