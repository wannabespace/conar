import { ORPCError } from '@orpc/client'
import type { ColumnKind } from '@tamery/shared/column-kind'
import { sharePage, shareSort } from '@tamery/shared/share'
import { omit } from '@tamery/shared/utils'
import { valueToText } from '@tamery/shared/value-text'
import { createServerFn } from '@tanstack/react-start'
import { type } from 'arktype'
import { Result } from 'better-result'

import { proxy } from './proxy'
import { unlockToken } from './share.server'

const LOCKED_CODES = new Set(['LOCKED', 'TOO_MANY_ATTEMPTS'])
const GONE_CODES = new Set(['BAD_REQUEST', 'NOT_FOUND'])

const failure = (cause: unknown) => {
  if (cause instanceof ORPCError && LOCKED_CODES.has(cause.code)) {
    return {
      message: cause.code === 'LOCKED' ? null : cause.message,
      status: 'locked' as const,
    }
  }
  if (cause instanceof ORPCError && GONE_CODES.has(cause.code)) {
    return { status: 'gone' as const }
  }
  return { status: 'unavailable' as const }
}

// Engines hand booleans back as 1 and 0 too (SQLite), which read as text would never check the box.
const cellText = (value: unknown, kind: ColumnKind | null) => {
  if (value === null || value === undefined) {
    return null
  }
  return valueToText(kind === 'boolean' ? Boolean(value) : value)
}

export const getShare = createServerFn({ method: 'GET' })
  .validator(type({ id: 'string', page: sharePage, sort: shareSort }))
  .handler(async ({ data }) => {
    const result = await Result.tryPromise(() =>
      proxy.shares.rows({
        id: data.id,
        page: data.page,
        sort: data.sort,
        token: unlockToken.get(data.id),
      })
    )

    if (result.isErr()) {
      return failure(result.error.cause)
    }

    const { columns, rows } = result.value

    return {
      ...omit(result.value, ['filters']),
      rows: rows.map((row) =>
        row.map((value, index) => cellText(value, columns[index]?.kind ?? null))
      ),
      status: 'ready' as const,
    }
  })

export const getShareInfo = createServerFn({ method: 'GET' })
  .validator(type({ id: 'string' }))
  .handler(async ({ data }) => {
    const result = await Result.tryPromise(() =>
      proxy.shares.info({ id: data.id, token: unlockToken.get(data.id) })
    )

    if (result.isErr()) {
      return failure(result.error.cause)
    }

    return {
      ...result.value,
      filters: result.value.filters.map(({ column, ref, values, via }) => ({
        column: via ? `${via.table}.${via.target}` : column,
        operator: ref.label,
        value:
          ref.hasValue === false
            ? null
            : values.map((value) => cellText(value, null)).join(', '),
      })),
      status: 'ready' as const,
    }
  })

const rememberUnlock = createServerFn({ method: 'POST' })
  .validator(type({ id: 'string', token: 'string.hex == 64' }))
  .handler(({ data }) => {
    unlockToken.set(data.id, data.token)
  })

// The password goes from the browser straight to the proxy, which locks out wrong guesses by the viewer's own address.
export const unlockShare = async (data: { id: string; password: string }) => {
  const result = await Result.tryPromise(() => proxy.shares.unlock(data))

  if (result.isErr()) {
    const refused = failure(result.error.cause)
    return refused.status === 'locked'
      ? (refused.message ?? 'That password is not right.')
      : null
  }

  if (result.value.token) {
    await rememberUnlock({ data: { id: data.id, token: result.value.token } })
  }
  return null
}
