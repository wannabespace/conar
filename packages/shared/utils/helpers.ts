export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  waitFor: number,
) {
  let timeout: ReturnType<typeof setTimeout>

  const debounced = (...args: Parameters<F>) => {
    clearTimeout(timeout)
    // eslint-disable-next-line e18e/prefer-timer-args
    timeout = setTimeout(() => func(...args), waitFor)
  }

  return debounced
}

const whitespaceRegex = /[.*+?^${}()|[\]\\]/g

export function escapeSpecialCharacters(string: string) {
  return string.replace(whitespaceRegex, '\\$&')
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  return result
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key as K))) as Omit<T, K>
}

export function noop() {}

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type Satisfies<T, U extends T> = U

export type MaybePromise<T> = T | Promise<T>

export type MaybeArray<T> = T | T[]

// eslint-disable-next-line ts/no-explicit-any
export type AnyFunction = (...args: any[]) => any

export function tryCatch<T>(fn: () => T): { data: T, error: null } | { data: null, error: Error } {
  try {
    return { data: fn(), error: null }
  }
  catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

export function uppercaseFirst(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function tryParseJson<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T
  }
  catch {
    return null
  }
}

export function tryParseToJsonArray(editedValue: string): string[] {
  const parsed = tryParseJson<unknown[]>(editedValue)
  if (Array.isArray(parsed))
    return parsed.map(String)
  return [editedValue]
}

export function wrapAggregateErrors<T extends Record<string, AnyFunction>>(handlers: T): T {
  const wrapped: Record<string, AnyFunction> = {}

  for (const [key, fn] of Object.entries(handlers)) {
    wrapped[key] = async (arg) => {
      try {
        return await fn(arg)
      }
      catch (error) {
        if (error instanceof AggregateError) {
          throw error.errors[0]
        }
        throw error
      }
    }
  }

  return wrapped as T
}
