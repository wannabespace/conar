import type { MaybePromise } from './helpers'

// oxlint-disable-next-line ts/no-empty-object-type
type Fn<T, P extends object = {}> = (params: P) => MaybePromise<T>
// oxlint-disable-next-line ts/no-empty-object-type
type FnParam<T, P extends object = {}> = Fn<T, P> | undefined | false

export async function tries<T>(
  ...args: [FnParam<T>, ...FnParam<T, { firstError: unknown; previousError: unknown }>[]]
): Promise<T> {
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
      // Sequential by design: each fallback runs only after the previous one fails
      // eslint-disable-next-line no-await-in-loop
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
