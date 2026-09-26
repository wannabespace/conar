import type { AnyFunction } from '@tamery/shared/utils'
import { tryParseJson } from '@tamery/shared/utils'

import { handleQueryError } from '../..'

export const wrapClickhouseError = <T extends AnyFunction>(fn: T): T =>
  (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return await handleQueryError(fn)(...args)
    } catch (error) {
      if (error instanceof Error) {
        const parsed = tryParseJson<
          Partial<{
            message: string
            status: string
            code: number
            request_id: string
          }>
        >(error.message)
        if (parsed?.message) {
          throw new Error(parsed.message, { cause: error })
        }
      }
      throw error
    }
  }) as T
