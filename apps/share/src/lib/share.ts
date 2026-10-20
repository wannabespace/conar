import { ORPCError } from '@orpc/client'
import type { ColumnKind } from '@tamery/shared/column-kind'
import { sharePage, shareSort } from '@tamery/shared/share'
import { omit } from '@tamery/shared/utils'
import { valueToText } from '@tamery/shared/value-text'
import { createServerFn } from '@tanstack/react-start'
import { type } from 'arktype'
import { Result } from 'better-result'

import { proxy, unlockToken } from './share.server'

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
        password: null,
        sort: data.sort,
        token: unlockToken.get(data.id),
      })
    )

    if (result.isErr()) {
      return failure(result.error.cause)
    }

    const { columns, rows } = result.value

    return {
      ...omit(result.value, ['filters', 'token']),
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
      proxy.shares.info({
        id: data.id,
        password: null,
        token: unlockToken.get(data.id),
      })
    )

    if (result.isErr()) {
      return failure(result.error.cause)
    }

    return {
      ...omit(result.value, ['token']),
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

export const unlockShare = createServerFn({ method: 'POST' })
  .validator(type({ id: 'string', password: 'string > 0' }))
  .handler(async ({ data }) => {
    const result = await Result.tryPromise(() =>
      proxy.shares.info({ id: data.id, password: data.password, token: null })
    )

    if (result.isErr()) {
      const refused = failure(result.error.cause)
      return refused.status === 'locked'
        ? (refused.message ?? 'That password is not right.')
        : null
    }

    if (result.value.token) {
      unlockToken.set(data.id, result.value.token)
    }
    return null
  })
