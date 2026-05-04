import { findReferenceEntry, getCacheKey } from './key'

// eslint-disable-next-line ts/no-explicit-any
export type AnyFunction = (...args: any[]) => any

export interface MemoizeOptions<F extends AnyFunction> {
  /**
   * Maximum time in milliseconds a cached entry remains valid. After this,
   * the next call with the same key recomputes the result.
   * @default Number.POSITIVE_INFINITY
   */
  maxAge?: number
  /**
   * @example
   * ```ts
   * const fn = memoize((a: number, b: number) => a + b, {
   *   transformArgs: (a, b) => `${a}-${b > 2}`,
   * })
   *
   * fn(1, 2) // Stored
   * fn(1, 2) // From cache
   * fn(1, 5) // Stored
   * fn(1, 7) // From cache
   * ```
   */
  transformArgs?: (...args: Parameters<F>) => unknown
}

export interface MemoizedCacheEntry<F extends AnyFunction> {
  value: ReturnType<F>
  storedAt: number
}

export interface MemoizedEntry<F extends AnyFunction> {
  key: unknown
  value: ReturnType<F>
  storedAt: number
}

const CACHE_SYMBOL = Symbol('memoize-cache')

export interface CacheStore<F extends AnyFunction> {
  cache: Map<string, MemoizedCacheEntry<F>>
  fallbackEntries: MemoizedEntry<F>[]
}

export type MemoizedFn<F extends AnyFunction> = F & {
  [CACHE_SYMBOL]: () => CacheStore<F>
}

function isCacheFresh(storedAt: number, maxAge: number) {
  return maxAge === Number.POSITIVE_INFINITY || Date.now() - storedAt <= maxAge
}

export function memoize<F extends AnyFunction>(
  func: F,
  options?: MemoizeOptions<F>,
): F {
  const { transformArgs, maxAge = Number.POSITIVE_INFINITY } = options || {}
  const cache = new Map<string, MemoizedCacheEntry<F>>()
  const fallbackEntries: MemoizedEntry<F>[] = []

  const fn = ((...params: Parameters<F>) => {
    const args = transformArgs
      ? transformArgs(...params)
      : params.length === 1
        ? params[0]
        : params

    const key = getCacheKey(args)

    if (typeof key === 'string') {
      if (cache.has(key)) {
        const wrapped = cache.get(key)!
        if (isCacheFresh(wrapped.storedAt, maxAge))
          return wrapped.value

        cache.delete(key)
      }

      const result = func(...params)
      const storedAt = Date.now()
      cache.set(key, { value: result, storedAt })

      if (result instanceof Promise) {
        result.catch(() => {
          const entry = cache.get(key)
          if (entry !== undefined && entry.value === result)
            cache.delete(key)
        })
      }

      return result
    }

    const hit = findReferenceEntry(fallbackEntries, args)
    if (hit) {
      if (isCacheFresh(hit.storedAt, maxAge))
        return hit.value

      const index = fallbackEntries.indexOf(hit)
      if (index !== -1)
        fallbackEntries.splice(index, 1)
    }

    const result = func(...params)
    const storedAt = Date.now()
    const entry: MemoizedEntry<F> = { key: args, value: result, storedAt }
    fallbackEntries.push(entry)

    if (result instanceof Promise) {
      result.catch(() => {
        const index = fallbackEntries.indexOf(entry)
        if (index !== -1)
          fallbackEntries.splice(index, 1)
      })
    }

    return result
  }) as MemoizedFn<F>

  fn[CACHE_SYMBOL] = () => ({ cache, fallbackEntries })

  return fn
}

export function isMemoized<F extends (...args: Parameters<F>) => ReturnType<F>>(
  fn: F,
): fn is MemoizedFn<F> {
  return CACHE_SYMBOL in fn
}

export function getCacheStore<F extends AnyFunction>(fn: F): CacheStore<F> | null {
  return isMemoized(fn) ? fn[CACHE_SYMBOL]() : null
}

export function clearMemoizeCache<F extends (...args: Parameters<F>) => ReturnType<F>>(
  fn: F,
): void {
  const store = getCacheStore(fn)
  if (!store)
    return

  store.cache.clear()
  store.fallbackEntries.length = 0
}
