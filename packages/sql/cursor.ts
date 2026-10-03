import { identifierName, isKeyword, isPunctuation } from './tokenizer'
import type { Token } from './tokenizer'

export interface ColumnRef {
  qualifier: string | null
  name: string
}

const WORD_KINDS = new Set(['identifier', 'keyword', 'function', 'type'])

export const columnRefAt = (
  tokens: Token[],
  index: number
): ColumnRef | null => {
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

export const columnBeforeValue = (before: Token[], cursor: number) => {
  const previous = before[cursor]
  if (previous?.kind === 'operator') {
    return columnRefAt(before, cursor - 1)
  }
  if (isPunctuation(previous, '(') && isKeyword(before[cursor - 1], 'IN')) {
    return columnRefAt(
      before,
      isKeyword(before[cursor - 2], 'NOT') ? cursor - 3 : cursor - 2
    )
  }
  if (isKeyword(previous, 'BETWEEN', 'LIKE', 'ILIKE')) {
    return columnRefAt(before, cursor - 1)
  }
  return null
}

export const selectedColumns = (statementTokens: Token[]) => {
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

export const wordAt = (tokens: Token[], offset: number) =>
  tokens.find(
    (token) =>
      WORD_KINDS.has(token.kind) && token.start < offset && offset <= token.end
  )

export const literalAt = (tokens: Token[], offset: number) =>
  tokens.find(
    (token) =>
      (token.kind === 'string' || token.kind === 'comment') &&
      token.start < offset &&
      offset <= token.end &&
      (offset < token.end ||
        token.unclosed === true ||
        (token.kind === 'comment' && !token.text.startsWith('/*')))
  )

/** `a.b.` just before the word, outermost first, and where the tokens before it end. */
export const qualifierBefore = (before: Token[]) => {
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

/** Where a value typed inside `'…'` goes: between the quotes. */
export const stringContentRange = (literal: Token | undefined) =>
  literal?.kind === 'string' && literal.text.startsWith("'")
    ? {
        end: literal.end - (literal.unclosed ? 0 : 1),
        start: literal.start + 1,
      }
    : undefined
