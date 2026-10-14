import { tryCatch } from '@tamery/shared/utils'
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

/** A parent's key is a prefix too, so `{ "mysql": { "host": … } }` reads as `MYSQL_HOST`. */
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

const urlPartsOf = (object: JsonObject, parentKey: string) =>
  Object.entries(object)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .map(
      ([key, value]) =>
        guessUrl(value) ?? guessWebUrl(value, `${parentKey} ${key} ${value}`)
    )
    .find(Boolean)?.parts

/** The first object holding a host wins, read with its ancestors' keys (Knex puts `client` beside the `connection` object); without one, the first object naming anything. */
const findParts = (root: unknown): GuessedParts | null => {
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
      urlPartsOf(value, parentKey) ?? {}
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
  return visit(root, '', {}, 0) ?? fallback
}

export const guessJson = (text: string): DatabaseGuess | null => {
  const trimmed = text.trim()
  if (!/^(?:[{[]|module\.exports|export\s+default)/u.test(trimmed)) {
    return null
  }
  // Parse, never evaluate: the text is whatever the user pasted.
  const object = tryCatch(() =>
    JSON5.parse(
      trimmed
        .replace(/^(?:module\.exports\s*=|export\s+default)\s*/u, '')
        .replace(/;\s*$/u, '')
        .replaceAll(/:\s*process\.env\.\w+/gu, ': null')
    )
  ).data
  const parts = findParts(object)
  return parts && { format: 'json', parts }
}
