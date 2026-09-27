import type { Subject } from './cursor'
import {
  insideLiteral,
  qualifierBefore,
  selectedColumns,
  subjectAt,
  valueSubject,
  wordAt,
} from './cursor'
import type { DialectSpec } from './dialect'
import type { StatementScope } from './scope'
import { statementScope, TABLE_INTRODUCERS } from './scope'
import { parseStatements, statementAt } from './statements'
import type { Token } from './tokenizer'
import { isKeyword, isPunctuation, tokenize } from './tokenizer'

export interface CompletionContext {
  prefix: string
  replaceStart: number
  replaceEnd: number
  /** `a.b.` before the word, outermost first. */
  qualifier: string[]
  expects:
    | 'statement'
    | 'table'
    | 'column'
    | 'clause'
    | 'operator'
    | 'number'
    | 'any'
  /** What may follow a finished term, in order — filled when `expects` is `clause`. */
  clauses: string[]
  slot: 'select' | 'group-by' | 'join-on' | 'into' | null
  subject: Subject | null
  selected: string[]
  keywordCase: 'upper' | 'lower'
  inLiteral: boolean
  scope: StatementScope
}

const COLUMN_INTRODUCERS = [
  'SELECT',
  'WHERE',
  'ON',
  'AND',
  'OR',
  'BY',
  'SET',
  'HAVING',
  'WHEN',
  'THEN',
  'ELSE',
  'DISTINCT',
  'RETURNING',
]

const NEXT_CLAUSES: Record<string, string[]> = {
  AND: ['AND', 'OR', 'GROUP BY', 'ORDER BY', 'LIMIT'],
  BY: ['ASC', 'DESC', 'HAVING', 'ORDER BY', 'LIMIT'],
  FROM: [
    'WHERE',
    'JOIN',
    'LEFT JOIN',
    'INNER JOIN',
    'GROUP BY',
    'ORDER BY',
    'LIMIT',
  ],
  HAVING: ['AND', 'OR', 'ORDER BY', 'LIMIT'],
  INTO: ['VALUES', 'SELECT'],
  JOIN: ['ON', 'AS'],
  ON: [
    'AND',
    'OR',
    'WHERE',
    'JOIN',
    'LEFT JOIN',
    'GROUP BY',
    'ORDER BY',
    'LIMIT',
  ],
  OR: ['AND', 'OR', 'GROUP BY', 'ORDER BY', 'LIMIT'],
  SELECT: ['FROM', 'AS'],
  SET: ['WHERE'],
  UPDATE: ['SET'],
  WHERE: ['AND', 'OR', 'GROUP BY', 'ORDER BY', 'LIMIT'],
}
// In these a term is finished only as the right side of a comparison (`id = 1`), not alone (`id`).
const CONDITION_CLAUSES = new Set(['AND', 'HAVING', 'ON', 'OR', 'WHERE'])
const COMPARISON_KEYWORDS = ['IS', 'NOT', 'LIKE', 'ILIKE', 'IN', 'BETWEEN']
const TERM_KEYWORDS = ['FALSE', 'NULL', 'TRUE']

const isTerm = (token: Token | undefined) =>
  token !== undefined &&
  (['identifier', 'number', 'string', 'variable'].includes(token.kind) ||
    isPunctuation(token, ')') ||
    isKeyword(token, ...TERM_KEYWORDS))

const clausesAfter = (
  previous: Token | undefined,
  beforePrevious: Token | undefined,
  clause: string,
  dialect: DialectSpec
) => {
  const selectsAll =
    previous?.text === '*' && isKeyword(beforePrevious, 'SELECT')
  if (!isTerm(previous) && !selectsAll) {
    return []
  }
  if (
    CONDITION_CLAUSES.has(clause) &&
    beforePrevious?.kind !== 'operator' &&
    !isKeyword(beforePrevious, ...COMPARISON_KEYWORDS)
  ) {
    return []
  }
  return (NEXT_CLAUSES[clause] ?? []).filter((next) =>
    dialect.keywords.has(next.split(' ')[0] ?? '')
  )
}

const awaitsOperator = (
  previous: Token | undefined,
  beforePrevious: Token | undefined,
  clause: string
) =>
  CONDITION_CLAUSES.has(clause) &&
  (previous?.kind === 'identifier' || isPunctuation(previous, ')')) &&
  beforePrevious?.kind !== 'operator' &&
  !isKeyword(beforePrevious, ...COMPARISON_KEYWORDS)

const expectsAfter = (
  previous: Token | undefined,
  clause: string
): 'table' | 'column' | 'number' | 'any' => {
  if (
    isKeyword(previous, ...TABLE_INTRODUCERS) ||
    (isPunctuation(previous, ',') && clause === 'FROM')
  ) {
    return 'table'
  }
  if (isKeyword(previous, 'LIMIT', 'OFFSET')) {
    return 'number'
  }
  if (
    isKeyword(previous, ...COLUMN_INTRODUCERS) ||
    isPunctuation(previous, ',') ||
    isPunctuation(previous, '(') ||
    previous?.kind === 'operator'
  ) {
    return 'column'
  }
  return 'any'
}

const slotAfter = (
  previous: Token | undefined,
  beforePrevious: Token | undefined,
  clause: string,
  expects: CompletionContext['expects']
): CompletionContext['slot'] => {
  if (isKeyword(previous, 'SELECT', 'DISTINCT')) {
    return 'select'
  }
  if (isKeyword(previous, 'BY') && isKeyword(beforePrevious, 'GROUP')) {
    return 'group-by'
  }
  if (isKeyword(previous, 'ON') && clause === 'ON') {
    return 'join-on'
  }
  if (expects === 'clause' && clause === 'INTO') {
    return 'into'
  }
  return null
}

export const completionContext = (
  text: string,
  offset: number,
  dialect: DialectSpec
): CompletionContext => {
  const { tokens } = tokenize(text, dialect)
  const statement = statementAt(
    parseStatements(text, tokens, dialect),
    offset,
    text
  )
  const scope = statement
    ? statementScope(statement.tokens)
    : { ctes: [], derived: [], opaque: false, tables: [] }

  const word = wordAt(tokens, offset)
  const inLiteral = insideLiteral(tokens, offset)
  const before = tokens.filter(
    (token) => token.kind !== 'comment' && token.end <= (word?.start ?? offset)
  )

  const { cursor, qualifier } = qualifierBefore(before)

  const previous = before[cursor]
  const beforePrevious = before[cursor - 1]
  const statementTokens = statement
    ? before.filter((token) => token.start >= statement.start)
    : []
  const lastKeyword = statementTokens.findLast(
    (token) => token.kind === 'keyword'
  )
  const clause = lastKeyword?.text.toUpperCase() ?? ''
  const clauses = clausesAfter(previous, beforePrevious, clause, dialect)
  let expects: CompletionContext['expects'] = expectsAfter(previous, clause)
  if (statementTokens.length === 0) {
    expects = 'statement'
  } else if (clauses.length > 0) {
    expects = 'clause'
  } else if (awaitsOperator(previous, beforePrevious, clause)) {
    expects = 'operator'
  }

  const prefix = word ? text.slice(word.start, offset) : ''
  const caseSample = prefix || lastKeyword?.text || ''

  return {
    clauses,
    expects,
    inLiteral,
    keywordCase:
      caseSample === caseSample.toLowerCase() &&
      caseSample !== caseSample.toUpperCase()
        ? 'lower'
        : 'upper',
    prefix,
    qualifier,
    replaceEnd: word?.end ?? offset,
    replaceStart: word?.start ?? offset,
    scope,
    selected: selectedColumns(statementTokens),
    slot: slotAfter(previous, beforePrevious, clause, expects),
    subject:
      expects === 'operator'
        ? subjectAt(before, cursor)
        : valueSubject(before, cursor),
  }
}
