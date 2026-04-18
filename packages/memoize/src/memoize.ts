import { deepEqual } from 'fast-equals'

// eslint-disable-next-line ts/no-explicit-any
export type AnyFunction = (...args: any[]) => any

export interface MemoizeOptions<F extends AnyFunction> {
  /**
   * @example
   * ```ts
   * const fn = memoize((a: number, b: number) => a + b, {
   *   transformArgs: ([a, b]) => `${a}-${b > 2}`,
   * })
   * ```
   */
  transformArgs?: (args: Parameters<F>) => unknown
}

export interface MemoizedEntry<F extends AnyFunction> {
  key: unknown
  value: ReturnType<F>
}

const CACHE_SYMBOL = Symbol('memoize-cache')

export type MemoizedFn<F extends AnyFunction> = F & {
  [CACHE_SYMBOL]: {
    entries: MemoizedEntry<F>[]
  }
}

export function memoize<F extends AnyFunction, O extends MemoizeOptions<F>>(
  func: F,
  options?: O,
): F {
  const entries: MemoizedEntry<F>[] = []
  const { transformArgs } = options ?? {}

  const fn = ((...args: Parameters<F>) => {
    const key = transformArgs ? transformArgs(args) : args

    const existingEntry = entries.find(entry => deepEqual(entry.key, key))

    if (existingEntry) {
      return existingEntry.value
    }

    const result = func(...args)
    const newEntry: MemoizedEntry<F> = { key, value: result }
    entries.push(newEntry)

    if (result instanceof Promise) {
      result.catch(() => {
        const index = entries.indexOf(newEntry)
        if (index !== -1) {
          entries.splice(index, 1)
        }
      })
    }

    return result
  }) as MemoizedFn<F>

  fn[CACHE_SYMBOL] = {
    entries,
  }

  return fn
}

export function isMemoized<F extends (...args: Parameters<F>) => ReturnType<F>>(fn: F): fn is MemoizedFn<F> {
  return CACHE_SYMBOL in fn
}

export function clearMemoizeCache<F extends (...args: Parameters<F>) => ReturnType<F>>(fn: F): void {
  if (isMemoized(fn)) {
    fn[CACHE_SYMBOL].entries.length = 0
  }
}
