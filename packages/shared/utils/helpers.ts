export const sleep = (ms: number, signal?: AbortSignal) =>
  // oxlint-disable-next-line promise/avoid-new -- timer-based delay requires Promise constructor
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      // oxlint-disable-next-line promise/no-multiple-resolved
      resolve()
    })
  })

export const abortControllerFrom = (signal?: AbortSignal) => {
  const controller = new AbortController()

  signal?.addEventListener('abort', () => controller.abort(), { once: true })

  return controller
}

export const debounce = <F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  waitFor: number
) => {
  let timeout: ReturnType<typeof setTimeout>

  const debounced = (...args: Parameters<F>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), waitFor)
  }

  return debounced
}

const whitespaceRegex = /[.*+?^${}()|[\]\\]/gu

export const escapeSpecialCharacters = (string: string) =>
  string.replace(whitespaceRegex, '\\$&')

export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  return result
}

export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> =>
  Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key as K))
  ) as Omit<T, K>

// oxlint-disable-next-line eslint/no-empty-function -- intentional no-op callback
export const noop = () => {}

export const objectEntries = Object.entries as <T extends object>(
  obj: T
) => [keyof T, T[keyof T]][]

export type Prettify<T> = {
  [K in keyof T]: T[K]
} extends infer O
  ? { [K in keyof O]: O[K] }
  : never

export type Satisfies<T, U extends T> = U

export type MaybePromise<T> = T | Promise<T>

export type MaybeArray<T> = T | T[]

// oxlint-disable-next-line ts/no-explicit-any
export type AnyFunction = (...args: any[]) => any

export const tryCatch = <T>(
  fn: () => T
): { data: T; error: null } | { data: null; error: Error } => {
  try {
    return { data: fn(), error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

export const tryCatchAsync = async <T>(
  fn: () => Promise<T>
): Promise<{ data: T; error: null } | { data: null; error: Error }> => {
  try {
    return { data: await fn(), error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

export const uppercaseFirst = (string: string) =>
  string.charAt(0).toUpperCase() + string.slice(1)

export const tryParseJson = <T>(json: string): T | null => {
  try {
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

export const tryParseToJsonArray = (editedValue: string): string[] => {
  const parsed = tryParseJson<unknown[]>(editedValue)
  if (Array.isArray(parsed)) {
    return parsed.map(String)
  }
  return [editedValue]
}

export const handleAggregateError = <T extends AnyFunction>(fn: T): T =>
  (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      if (error instanceof AggregateError && error.errors.length > 0) {
        throw error.errors[0]
      }
      throw error
    }
  }) as T
