import { stringify } from 'devalue'

export const BY_REFERENCE = Symbol('memoize-by-reference')

function getPrimitiveCacheKey(value: unknown): string | null | typeof BY_REFERENCE {
  if (value === null)
    return 'l'

  switch (typeof value) {
    case 'undefined':
      return 'u'
    case 'boolean':
      return value ? 'b1' : 'b0'
    case 'bigint':
      return `i${value}`
    case 'string':
      return `s${value.length}:${value}`
    case 'number':
      if (Number.isNaN(value))
        return 'nNaN'
      if (value === Number.POSITIVE_INFINITY)
        return 'n+Inf'
      if (value === Number.NEGATIVE_INFINITY)
        return 'n-Inf'
      if (Object.is(value, -0))
        return 'n-0'
      return `n${value}`
    case 'object':
      if (value instanceof Date)
        return `d${value.getTime()}`
      if (value instanceof RegExp)
        return `x${value.source}/${value.flags}`
      return null
    default:
      return BY_REFERENCE
  }
}

function isPlainObject(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function getStructuralCacheKey(
  value: unknown,
  seen: Map<object, number>,
): string | typeof BY_REFERENCE {
  const primitiveKey = getPrimitiveCacheKey(value)
  if (primitiveKey === BY_REFERENCE)
    return BY_REFERENCE

  if (primitiveKey !== null)
    return primitiveKey

  const objectValue = value as object
  const seenId = seen.get(objectValue)
  if (seenId !== undefined)
    return `r${seenId}`

  seen.set(objectValue, seen.size)

  if (Array.isArray(objectValue)) {
    const parts: string[] = [`[${objectValue.length}|`]

    for (let index = 0; index < objectValue.length; index++) {
      const itemKey = getStructuralCacheKey(objectValue[index], seen)
      if (itemKey === BY_REFERENCE)
        return BY_REFERENCE

      parts.push(itemKey, ',')
    }

    parts.push(']')
    return parts.join('')
  }

  if (objectValue instanceof Map) {
    const parts: string[] = [`m${objectValue.size}|`]

    for (const [entryKey, entryValue] of objectValue) {
      const key = getStructuralCacheKey(entryKey, seen)
      if (key === BY_REFERENCE)
        return BY_REFERENCE

      const mappedValue = getStructuralCacheKey(entryValue, seen)
      if (mappedValue === BY_REFERENCE)
        return BY_REFERENCE

      parts.push(key, '=>', mappedValue, ',')
    }

    parts.push('}')
    return parts.join('')
  }

  if (objectValue instanceof Set) {
    const parts: string[] = [`t${objectValue.size}|`]

    for (const entryValue of objectValue) {
      const key = getStructuralCacheKey(entryValue, seen)
      if (key === BY_REFERENCE)
        return BY_REFERENCE

      parts.push(key, ',')
    }

    parts.push(')')
    return parts.join('')
  }

  if (isPlainObject(objectValue)) {
    const keys = Object.keys(objectValue)
    const parts: string[] = [`o${keys.length}|`]

    for (const key of keys) {
      const valueKey = getStructuralCacheKey(objectValue[key], seen)
      if (valueKey === BY_REFERENCE)
        return BY_REFERENCE

      parts.push(`${key.length}:`, key, '=', valueKey, ',')
    }

    parts.push('}')
    return parts.join('')
  }

  try {
    return stringify(value)
  }
  catch {
    return BY_REFERENCE
  }
}

export function getCacheKey(value: unknown): string | typeof BY_REFERENCE {
  const primitiveKey = getPrimitiveCacheKey(value)
  if (primitiveKey === BY_REFERENCE)
    return BY_REFERENCE

  if (primitiveKey !== null)
    return primitiveKey

  return getStructuralCacheKey(value, new Map())
}

export function findReferenceEntry<T extends { key: unknown }>(
  entries: T[],
  key: unknown,
): T | undefined {
  for (const entry of entries) {
    if (entry.key === key)
      return entry

    if (Array.isArray(entry.key) && Array.isArray(key)) {
      if (entry.key.length !== key.length)
        continue

      let isEqual = true

      for (let index = 0; index < key.length; index++) {
        if (entry.key[index] !== key[index]) {
          isEqual = false
          break
        }
      }

      if (isEqual)
        return entry
    }
  }

  return undefined
}
