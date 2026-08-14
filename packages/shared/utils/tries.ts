import type { MaybePromise } from './helpers'

type EmptyParams = Record<string, never>
type Fn<T, P extends object = EmptyParams> = (params: P) => MaybePromise<T>
type FnParam<T, P extends object = EmptyParams> = Fn<T, P> | undefined | false

export const tries = async <T>(
  ...args: [
    FnParam<T>,
    ...FnParam<T, { firstError: unknown; previousError: unknown }>[],
  ]
): Promise<T> => {
  const filteredFn = args.filter(Boolean) as Fn<
    T,
    { firstError: unknown; previousError: unknown }
  >[]
  let firstError: unknown
  let previousError: unknown

  if (filteredFn.length === 0) {
    throw new Error('No functions to try')
  }

  for (const [index, fn] of filteredFn.entries()) {
    try {
      // oxlint-disable-next-line no-await-in-loop
      return await fn({ firstError, previousError })
    } catch (error) {
      if (index === 0) {
        firstError = error
      }

      if (index === filteredFn.length - 1) {
        throw error
      }

      previousError = error

      continue
    }
  }

  return undefined as T
}
