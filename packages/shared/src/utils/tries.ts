import type { MaybePromise } from './helpers'

// eslint-disable-next-line ts/no-empty-object-type
type Fn<T, P extends object = {}> = (params: P) => MaybePromise<T>
// eslint-disable-next-line ts/no-empty-object-type
type FnParam<T, P extends object = {}> = Fn<T, P> | undefined | false

export async function tries<T>(...args: [FnParam<T>, ...FnParam<T, { previousError: unknown }>[]]): Promise<T> {
  const filteredFn = args.filter(Boolean) as Fn<T, { previousError: unknown }>[]
  let previousError: unknown

  if (filteredFn.length === 0) {
    throw new Error('No functions to try')
  }

  for (const fn of filteredFn) {
    try {
      return await fn({ previousError })
    }
    catch (error) {
      if (filteredFn.indexOf(fn) === filteredFn.length - 1) {
        throw error
      }

      previousError = error

      continue
    }
  }

  return undefined as T
}
