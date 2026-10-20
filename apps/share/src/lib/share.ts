import { ORPCError } from '@orpc/client'
import { SHARE_PAGE_SIZE, shareSort } from '@tamery/shared/share'
import { createServerFn } from '@tanstack/react-start'
import { type } from 'arktype'
import { Result } from 'better-result'

import { cellText, proxy, sharePassword } from './share.server'

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

export const getShare = createServerFn({ method: 'GET' })
  .validator(
    type({ id: 'string', page: 'number.integer >= 1', sort: shareSort })
  )
  .handler(async ({ data }) => {
    const result = await Result.tryPromise(() =>
      proxy.shares.rows({
        id: data.id,
        offset: (data.page - 1) * SHARE_PAGE_SIZE,
        password: sharePassword.get(data.id),
        sort: data.sort,
      })
    )

    if (result.isErr()) {
      return failure(result.error.cause)
    }

    const {
      columns,
      description,
      fetchedAt,
      filters,
      hasMore,
      name,
      refresh,
      rows,
    } = result.value

    return {
      columns,
      description,
      fetchedAt,
      filters: filters.map(({ column, ref, values, via }) => ({
        column: via ? `${via.table}.${via.target}` : column,
        operator: ref.label,
        value: ref.hasValue === false ? null : values.map(cellText).join(', '),
      })),
      hasMore,
      name,
      refresh,
      rows: rows.map((row) => row.map(cellText)),
      status: 'ready' as const,
    }
  })

export const unlockShare = createServerFn({ method: 'POST' })
  .validator(type({ id: 'string', password: 'string > 0' }))
  .handler(async ({ data }) => {
    const result = await Result.tryPromise(() =>
      proxy.shares.rows({
        id: data.id,
        offset: 0,
        password: data.password,
        sort: null,
      })
    )
    const refused = result.isErr() ? failure(result.error.cause) : null

    if (refused?.status === 'locked') {
      return refused.message ?? 'That password is not right.'
    }

    sharePassword.set(data.id, data.password)
    return null
  })
