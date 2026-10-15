import { Result } from 'better-result'
import JSON5 from 'json5'

import { partsOfVariables } from './env'
import { mergeParts } from './parts'
import type { DatabaseGuess, GuessedParts } from './types'
import { guessUrl, guessWebUrl } from './url'

type JsonObject = Record<string, unknown>

const MAX_DEPTH = 8
const ENV_ITEM = /^(?<key>[A-Za-z_]\w*)=(?<value>.*)$/su
const CAMEL_HUMP = /(?<lower>[a-z\d])(?<upper>[A-Z])/gu
const NON_WORD = /[^A-Z\d]+/gu

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null

const namesOf = (key: string) => [
  key.toUpperCase(),
  key
    .replaceAll(CAMEL_HUMP, '$<lower>_$<upper>')
    .toUpperCase()
    .replaceAll(NON_WORD, '_'),
]

const variablesOfObject = (
  object: JsonObject,
  parentKey: string,
  inherited: Record<string, string>
) => {
  const variables = { ...inherited }
  const prefix = parentKey ? `${namesOf(parentKey)[1]}_` : ''
  for (const [key, value] of Object.entries(object)) {
    if (typeof value === 'string' || typeof value === 'number') {
      for (const name of namesOf(key)) {
        variables[name] = String(value)
        variables[prefix + name] ??= String(value)
      }
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        const { key: name, value: itemValue } =
          (typeof item === 'string' && ENV_ITEM.exec(item)?.groups) || {}
        if (name && itemValue !== undefined) {
          variables[name.toUpperCase()] ??= itemValue
        }
      }
    }
  }
  return variables
}

export const guessJson = (text: string): DatabaseGuess | null => {
  const literal = text
    .trim()
    .replace(/^(?:module\.exports\s*=|export\s+default)\s*/u, '')
  if (!/^[{[]/u.test(literal)) {
    return null
  }
  const object = Result.try(() =>
    JSON5.parse(
      literal
        .replace(/;\s*$/u, '')
        .replaceAll(/process\.env\.\w+\s*(?:\|\||\?\?)\s*/gu, '')
        .replaceAll(/process\.env\.\w+/gu, 'null')
    )
  ).unwrapOr(null)
  let fallback: GuessedParts | null = null
  const visit = (
    value: unknown,
    parentKey: string,
    inherited: Record<string, string>,
    depth: number
  ): GuessedParts | null => {
    if (!isObject(value) || depth > MAX_DEPTH) {
      return null
    }
    if (Array.isArray(value)) {
      return (
        value
          .values()
          .map((item) => visit(item, parentKey, inherited, depth + 1))
          .find(Boolean) ?? null
      )
    }
    const variables = variablesOfObject(value, parentKey, inherited)
    const parts = mergeParts(
      partsOfVariables(variables) ?? {},
      Object.entries(value)
        .filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string'
        )
        .map(
          ([key, url]) =>
            guessUrl(url) ?? guessWebUrl(url, `${parentKey} ${key} ${url}`)
        )
        .find(Boolean)?.parts ?? {}
    )
    if (parts.host) {
      return parts
    }
    if (!fallback && Object.keys(parts).length > 0) {
      fallback = parts
    }
    return (
      Object.entries(value)
        .values()
        .map(([key, child]) => visit(child, key, variables, depth + 1))
        .find(Boolean) ?? null
    )
  }
  const parts = visit(object, '', {}, 0) ?? fallback
  return parts && { format: 'json', parts }
}
