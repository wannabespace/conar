import type { MaybePromise } from './helpers'

export async function tries<T>(...args: ((() => MaybePromise<T>) | undefined | false)[]): Promise<T> {
  const filteredArgs = args.filter(Boolean) as (() => MaybePromise<T>)[]

  if (filteredArgs.length === 0) {
    throw new Error('No functions to try')
  }

  for (const arg of filteredArgs) {
    try {
      return await arg()
    }
    catch (error) {
      if (filteredArgs.indexOf(arg) === filteredArgs.length - 1) {
        throw error
      }

      continue
    }
  }

  return undefined as T
}
