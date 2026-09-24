import type { SqlCatalog, SqlColumn, SqlTable } from './catalog'
import { findEnum, findSchema, findTable } from './catalog'
import type { DialectSpec } from './dialect'
import type { StatementScope, TableRef } from './scope'
import { statementScope, TABLE_INTRODUCERS } from './scope'
import { parseStatements, statementAt } from './statements'
import type { Token } from './tokenizer'
import { identifierName, isKeyword, isPunctuation, tokenize } from './tokenizer'

export type CompletionKind =
  | 'column'
  | 'enum'
  | 'function'
  | 'keyword'
  | 'operator'
  | 'schema'
  | 'table'
  | 'value'
  | 'view'

export interface CompletionItem {
  label: string
  kind: CompletionKind
  insertText: string
  detail?: string
  sortText: string
  /** `insertText` uses `${1:placeholder}` tab stops. */
  snippet?: true
}

/** The column a value or operator at the caret applies to (`WHERE status = |`). */
interface Subject {
  qualifier: string | null
  name: string
}

export interface CompletionContext {
  /** Text of the word under the caret up to the caret. */
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
  /** Which clause the caret sits right after, when that changes what to offer first. */
  slot: 'select' | 'group-by' | 'join-on' | 'into' | null
  subject: Subject | null
  /** Bare columns of the SELECT list, what GROUP BY usually repeats. */
  selected: string[]
  /** Keywords insert in the case the user is already writing in. */
  keywordCase: 'upper' | 'lower'
  /** Caret sits inside a string or comment — nothing to suggest. */
  inLiteral: boolean
  scope: StatementScope
}

const WORD_KINDS = new Set(['identifier', 'keyword', 'function', 'type'])
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
const KEYWORD_PRIORITY = [
  'SELECT',
  'FROM',
  'WHERE',
  'JOIN',
  'LEFT',
  'INNER',
  'ON',
  'GROUP',
  'ORDER',
  'BY',
  'LIMIT',
  'AND',
  'OR',
  'AS',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'WITH',
  'CREATE',
  'ALTER',
  'DROP',
]

// What may follow a finished term, keyed by the clause it sits in.
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
const OPERATORS = [
  '=',
  '<>',
  '>',
  '<',
  '>=',
  '<=',
  'IN (',
  'NOT IN (',
  'LIKE',
  'ILIKE',
  'IS NULL',
  'IS NOT NULL',
  'BETWEEN',
]
const LIMITS = ['10', '50', '100', '1000']
// Nothing before the caret in its statement: only a verb can come first, most used first.
const STATEMENT_VERBS = [
  'SELECT',
  'INSERT INTO',
  'UPDATE',
  'DELETE FROM',
  'WITH',
  'EXPLAIN',
  'SHOW',
  'CREATE',
  'ALTER',
  'DROP',
  'TRUNCATE',
  'BEGIN',
  'COMMIT',
  'ROLLBACK',
]
const BOOLEAN_TYPE = /bool|^bit$/iu
const TEXT_TYPE = /char|text|string|citext|uuid/iu

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

/** `WHERE status |` — a column waiting for its comparison. */
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

const subjectAt = (tokens: Token[], index: number): Subject | null => {
  const token = tokens[index]
  if (token?.kind !== 'identifier') {
    return null
  }
  const qualifier = tokens[index - 2]
  return {
    name: identifierName(token),
    qualifier:
      isPunctuation(tokens[index - 1], '.') && qualifier?.kind === 'identifier'
        ? identifierName(qualifier)
        : null,
  }
}

/** The column a value at the caret compares against: `col = |`, `col IN (|`, `col BETWEEN |`. */
const valueSubject = (before: Token[], cursor: number) => {
  const previous = before[cursor]
  if (previous?.kind === 'operator') {
    return subjectAt(before, cursor - 1)
  }
  if (isPunctuation(previous, '(') && isKeyword(before[cursor - 1], 'IN')) {
    return subjectAt(
      before,
      isKeyword(before[cursor - 2], 'NOT') ? cursor - 3 : cursor - 2
    )
  }
  if (isKeyword(previous, 'BETWEEN', 'LIKE', 'ILIKE')) {
    return subjectAt(before, cursor - 1)
  }
  return null
}

/** Bare columns of the SELECT list — what GROUP BY repeats. */
const selectedColumns = (statementTokens: Token[]) => {
  const start = statementTokens.findIndex((token) => isKeyword(token, 'SELECT'))
  if (start === -1) {
    return []
  }
  const segments: Token[][] = [[]]
  let depth = 0
  for (const token of statementTokens.slice(start + 1)) {
    if (depth === 0 && isKeyword(token, 'FROM')) {
      break
    }
    if (isPunctuation(token, '(')) {
      depth += 1
    } else if (isPunctuation(token, ')')) {
      depth -= 1
    } else if (depth === 0 && isPunctuation(token, ',')) {
      segments.push([])
      continue
    }
    segments.at(-1)?.push(token)
  }
  return segments.flatMap((segment) =>
    segment.length > 0 &&
    segment.every(
      (token) => token.kind === 'identifier' || isPunctuation(token, '.')
    )
      ? [segment.map((token) => token.text).join('')]
      : []
  )
}

const wordAt = (tokens: Token[], offset: number) =>
  tokens.find(
    (token) =>
      WORD_KINDS.has(token.kind) && token.start < offset && offset <= token.end
  )

const insideLiteral = (tokens: Token[], offset: number) =>
  tokens.some(
    (token) =>
      (token.kind === 'string' || token.kind === 'comment') &&
      token.start < offset &&
      offset <= token.end &&
      (offset < token.end ||
        token.unclosed === true ||
        (token.kind === 'comment' && !token.text.startsWith('/*')))
  )

/** `a.b.` just before the word, outermost first, and where the tokens before it end. */
const qualifierBefore = (before: Token[]) => {
  const qualifier: string[] = []
  let cursor = before.length - 1
  for (
    let part = before[cursor - 1];
    isPunctuation(before[cursor], '.') && part?.kind === 'identifier';
    part = before[cursor - 1]
  ) {
    qualifier.unshift(identifierName(part))
    cursor -= 2
  }
  return { cursor, qualifier }
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

const hasLowercaseLetters = (text: string) =>
  text !== text.toUpperCase() && text === text.toLowerCase()

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
    keywordCase: hasLowercaseLetters(caseSample) ? 'lower' : 'upper',
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

const scopeTable = (
  scope: StatementScope,
  catalog: SqlCatalog,
  qualifier: string
) => {
  const ref = scope.tables.find(
    (table) =>
      table.alias?.toLowerCase() === qualifier.toLowerCase() ||
      table.name.toLowerCase() === qualifier.toLowerCase()
  )
  return ref ? findTable(catalog, ref.name, ref.schema) : undefined
}

const resolveSubject = (
  subject: Subject | null,
  scope: StatementScope,
  catalog: SqlCatalog
): { column: SqlColumn; table: SqlTable } | null => {
  if (!subject) {
    return null
  }
  const tables = subject.qualifier
    ? [scopeTable(scope, catalog, subject.qualifier)]
    : scope.tables.map((ref) => findTable(catalog, ref.name, ref.schema))
  for (const table of tables) {
    const column = table?.columns?.find(
      (item) => item.name.toLowerCase() === subject.name.toLowerCase()
    )
    if (table && column) {
      return { column, table }
    }
  }
  return null
}

const columnItems = (
  table: SqlTable,
  { detail = '', qualifier = '' }: { detail?: string; qualifier?: string } = {}
): CompletionItem[] =>
  (table.columns ?? []).map((column) => {
    const name = qualifier ? `${qualifier}.${column.name}` : column.name
    return {
      detail: `${detail}${column.type}${column.nullable ? '' : ' not null'}`,
      insertText: name,
      kind: 'column',
      label: name,
      sortText: `1${name}`,
    }
  })

const tableItems = (catalog: SqlCatalog): CompletionItem[] =>
  catalog.schemas.flatMap((schema) =>
    schema.tables.map((table) => {
      const qualified =
        schema.name === catalog.defaultSchema
          ? table.name
          : `${schema.name}.${table.name}`
      return {
        detail: `${table.kind} · ${schema.name}`,
        insertText: qualified,
        kind: table.kind === 'view' ? 'view' : 'table',
        label: qualified,
        sortText: `2${qualified}`,
      }
    })
  )

const keywordItems = (dialect: DialectSpec): CompletionItem[] =>
  [...dialect.keywords].map((keyword) => {
    const priority = KEYWORD_PRIORITY.indexOf(keyword)
    return {
      insertText: keyword,
      kind: 'keyword',
      label: keyword,
      sortText: `4${(priority === -1 ? 99 : priority).toString().padStart(2, '0')}${keyword}`,
    }
  })

const functionItems = (dialect: DialectSpec): CompletionItem[] =>
  [...dialect.functions].map((name) => ({
    insertText: `${name}($1)`,
    kind: 'function',
    label: name,
    snippet: true,
    sortText: `5${name}`,
  }))

const ordered = (
  items: {
    label: string
    insertText?: string
    detail?: string
    kind?: CompletionKind
    snippet?: true
  }[],
  kind: CompletionKind,
  rank = '0'
): CompletionItem[] =>
  items.map((item, index) => ({
    detail: item.detail,
    insertText: item.insertText ?? item.label,
    kind: item.kind ?? kind,
    label: item.label,
    snippet: item.snippet,
    sortText: `${rank}${index.toString().padStart(2, '0')}`,
  }))

const qualifiedItems = (
  context: CompletionContext,
  catalog: SqlCatalog
): CompletionItem[] => {
  const [first, second] = context.qualifier
  if (first === undefined) {
    return []
  }
  if (second !== undefined) {
    const table = findTable(catalog, second, first)
    return table ? columnItems(table) : []
  }
  const table =
    scopeTable(context.scope, catalog, first) ?? findTable(catalog, first, null)
  if (table) {
    return columnItems(table)
  }
  const schema = findSchema(catalog, first)
  return (
    schema?.tables.map((item) => ({
      detail: item.kind,
      insertText: item.name,
      kind: item.kind === 'view' ? 'view' : 'table',
      label: item.name,
      sortText: `2${item.name}`,
    })) ?? []
  )
}

/** Operators for the column at the caret, most likely first by its type. */
const operatorItems = (
  resolved: ReturnType<typeof resolveSubject>
): CompletionItem[] => {
  const type = resolved?.column.type ?? ''
  const first = [
    ...(BOOLEAN_TYPE.test(type) ? ['= TRUE', '= FALSE'] : []),
    ...(TEXT_TYPE.test(type) ? ['=', 'LIKE', 'ILIKE'] : []),
    ...(resolved?.column.nullable ? ['IS NULL', 'IS NOT NULL'] : []),
  ]
  return ordered(
    [...new Set([...first, ...OPERATORS])].map((label) => ({ label })),
    'operator'
  )
}

/** Literal values the column at the caret takes: its enum members, booleans. */
const valueItems = (
  resolved: ReturnType<typeof resolveSubject>,
  catalog: SqlCatalog
): CompletionItem[] => {
  if (!resolved) {
    return []
  }
  const { column, table } = resolved
  const enumeration = findEnum(catalog, table.name, column)
  if (enumeration) {
    return ordered(
      enumeration.values.map((value) => ({
        detail: `enum ${enumeration.name}`,
        insertText: `'${value}'`,
        label: value,
      })),
      'enum'
    )
  }
  if (BOOLEAN_TYPE.test(column.type)) {
    return ordered([{ label: 'TRUE' }, { label: 'FALSE' }], 'value')
  }
  return []
}

const singular = (name: string) => {
  if (name.endsWith('ies')) {
    return `${name.slice(0, -3)}y`
  }
  return name.endsWith('s') ? name.slice(0, -1) : name
}

/** `a.user_id = b.id` pairs guessed from column names, for the table just joined. */
const joinConditionItems = (
  scope: StatementScope,
  catalog: SqlCatalog
): CompletionItem[] => {
  const joined = scope.tables.at(-1)
  if (!joined || scope.tables.length < 2) {
    return []
  }
  const pairs: string[] = []
  const sides = (ref: TableRef) => {
    const table = findTable(catalog, ref.name, ref.schema)
    return {
      columns: table?.columns?.map((column) => column.name.toLowerCase()) ?? [],
      prefix: ref.alias ?? ref.name,
      table,
    }
  }
  const right = sides(joined)
  for (const ref of scope.tables.slice(0, -1)) {
    const left = sides(ref)
    if (!left.table || !right.table) {
      continue
    }
    for (const [from, to] of [
      [left, right],
      [right, left],
    ]) {
      if (!from || !to) {
        continue
      }
      const key = `${singular(to.table?.name ?? '').toLowerCase()}_id`
      if (from.columns.includes(key) && to.columns.includes('id')) {
        pairs.push(`${from.prefix}.${key} = ${to.prefix}.id`)
      }
    }
  }
  return ordered(
    pairs.map((label) => ({ label })),
    'column'
  )
}

const insertTemplate = (
  scope: StatementScope,
  catalog: SqlCatalog
): CompletionItem[] => {
  const target = scope.tables.at(-1)
  const table = target && findTable(catalog, target.name, target.schema)
  const columns = table?.columns?.filter((column) => column.name !== 'id')
  if (!columns || columns.length === 0) {
    return []
  }
  const names = columns.map((column) => column.name)
  return ordered(
    [
      {
        detail: names.join(', '),
        insertText: `(${names.join(', ')})\nVALUES (${names.map((name, index) => `\${${index + 1}:${name}}`).join(', ')})`,
        label: '(columns…) VALUES (…)',
        snippet: true,
      },
    ],
    'keyword'
  )
}

const cased = (item: CompletionItem, keywordCase: 'upper' | 'lower') =>
  keywordCase === 'lower' &&
  (item.kind === 'keyword' ||
    item.kind === 'operator' ||
    item.kind === 'function' ||
    item.kind === 'value')
    ? { ...item, insertText: item.insertText.toLowerCase() }
    : item

const scopeColumnItems = (
  scope: StatementScope,
  catalog: SqlCatalog
): CompletionItem[] => {
  const known = scope.tables.flatMap((ref) => {
    const table = findTable(catalog, ref.name, ref.schema)
    return table ? [{ qualifier: ref.alias ?? table.name, table }] : []
  })
  // One table reads best bare; several are told apart by their alias.
  const qualify = known.length > 1
  const seen = new Set<string>()
  return known.flatMap(({ qualifier, table }) =>
    columnItems(table, {
      detail: qualify ? '' : `${qualifier} · `,
      qualifier: qualify ? qualifier : '',
    }).filter((item) => {
      if (seen.has(item.label.toLowerCase())) {
        return false
      }
      seen.add(item.label.toLowerCase())
      return true
    })
  )
}

const slotItems = (
  context: CompletionContext,
  catalog: SqlCatalog
): CompletionItem[] => {
  const { scope, selected, slot } = context
  if (slot === 'select') {
    const [only] = scope.tables
    const table =
      only && scope.tables.length === 1
        ? findTable(catalog, only.name, only.schema)
        : undefined
    const all = table?.columns?.map((column) => column.name) ?? []
    return ordered(
      [
        { label: '*' },
        ...(all.length > 0
          ? [
              {
                detail: 'all columns',
                insertText: all.join(', '),
                label: all.join(', '),
              },
            ]
          : []),
      ],
      'column'
    )
  }
  if (slot === 'group-by' && selected.length > 0) {
    return ordered(
      [
        ...(selected.length > 1
          ? [{ detail: 'every selected column', label: selected.join(', ') }]
          : []),
        ...selected.map((label) => ({ label })),
      ],
      'column'
    )
  }
  if (slot === 'join-on') {
    return joinConditionItems(scope, catalog)
  }
  if (slot === 'into') {
    return insertTemplate(scope, catalog)
  }
  return []
}

export const completionItems = (
  context: CompletionContext,
  catalog: SqlCatalog,
  dialect: DialectSpec
): CompletionItem[] => {
  if (context.inLiteral) {
    return []
  }
  if (context.qualifier.length > 0) {
    return qualifiedItems(context, catalog)
  }

  const resolved = resolveSubject(context.subject, context.scope, catalog)
  const items: CompletionItem[] = []

  switch (context.expects) {
    case 'clause': {
      items.push(
        ...slotItems(context, catalog),
        ...ordered(
          context.clauses.map((label) => ({ label })),
          'keyword',
          '1'
        )
      )
      break
    }
    case 'operator': {
      items.push(...operatorItems(resolved))
      break
    }
    case 'statement': {
      items.push(
        ...ordered(
          STATEMENT_VERBS.filter((verb) =>
            dialect.keywords.has(verb.split(' ')[0] ?? '')
          ).map((label) => ({ label })),
          'keyword'
        )
      )
      break
    }
    case 'number': {
      items.push(
        ...ordered(
          LIMITS.map((label) => ({ label })),
          'value'
        )
      )
      break
    }
    case 'table': {
      items.push(
        ...context.scope.ctes.map((name) => ({
          detail: 'CTE',
          insertText: name,
          kind: 'table' as const,
          label: name,
          sortText: `0${name}`,
        })),
        ...tableItems(catalog),
        ...catalog.schemas.map((schema) => ({
          detail: 'schema',
          insertText: schema.name,
          kind: 'schema' as const,
          label: schema.name,
          sortText: `3${schema.name}`,
        }))
      )
      break
    }
    case 'column': {
      items.push(
        ...valueItems(resolved, catalog),
        ...slotItems(context, catalog),
        ...scopeColumnItems(context.scope, catalog),
        ...functionItems(dialect),
        ...keywordItems(dialect)
      )
      break
    }
    default: {
      items.push(
        ...tableItems(catalog),
        ...functionItems(dialect),
        ...keywordItems(dialect)
      )
    }
  }

  return items.map((item) => cased(item, context.keywordCase))
}
