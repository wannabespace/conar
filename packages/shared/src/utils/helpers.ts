export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function enumValues<T extends { [key: string]: string }>(enumType: T) {
  return Object.values(enumType) as [T[keyof T], ...T[keyof T][]]
}

export function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  waitFor: number
) {
  let timeout: ReturnType<typeof setTimeout>

  const debounced = (...args: Parameters<F>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), waitFor)
  }

  return debounced
}

export function escapeSpecialCharacters(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key as K))
  ) as Omit<T, K>
}

export function noop() {}

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type Satisfies<T, U extends T> = U

export type MaybePromise<T> = T | Promise<T>

export type MaybeArray<T> = T | T[]

export function tryCatch<T>(
  fn: () => T
): { data: T; error: null } | { data: null; error: unknown } {
  try {
    return { data: fn(), error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function tryCatchAsync<T>(
  fn: () => Promise<T>
): Promise<{ data: T; error: null } | { data: null; error: unknown }> {
  try {
    return { data: await fn(), error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export function memoize<F extends (...args: Parameters<F>) => ReturnType<F>>(func: F) {
  const cache = new Map<string, ReturnType<F>>()

  return (...args: Parameters<F>) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)!
    }
    const result = func(...args)
    cache.set(key, result)

    if (result instanceof Promise) {
      result.catch(() => {
        cache.delete(key)
      })
    }

    return result
  }
}
