import { ORPCError } from '@orpc/client'
import type { ColumnKind } from '@tamery/shared/column-kind'
import { sharePage, shareSort, shareToken } from '@tamery/shared/share'
import { valueToText } from '@tamery/shared/value-text'
import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { type } from 'arktype'
import { Result } from 'better-result'

import { proxy } from './proxy'
import { unlockToken } from './share.server'

export const SHARE_LOCKED = 'This table needs a password'

const UNAVAILABLE = 'This table cannot be loaded right now.'
const WRONG_PASSWORD = 'That password is not right.'
const REFUSED_CODES = new Set(['BAD_REQUEST', 'LOCKED'])
// The API words these for viewers; any other failure's message is a server's own.
const WORDED_CODES = new Set(['NOT_FOUND', 'TOO_MANY_ATTEMPTS'])

// Thrown, never returned: a failure cached as data would outlive invalidation under `staleTime: 'static'`. A fresh error, so no proxy message reaches the viewer.
const failure = (cause: unknown) => {
  if (cause instanceof ORPCError && cause.code === 'NOT_FOUND') {
    return notFound()
  }
  return new Error(
    cause instanceof ORPCError && cause.code === 'LOCKED'
      ? SHARE_LOCKED
      : UNAVAILABLE
  )
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
      proxy.shares.rows({ ...data, token: unlockToken.get(data.id) })
    )

    if (result.isErr()) {
      throw failure(result.error.cause)
    }

    const { columns, rows } = result.value

    return {
      ...result.value,
      rows: rows.map((row) =>
        row.map((value, index) => cellText(value, columns[index]?.kind ?? null))
      ),
    }
  })

export const getShareInfo = createServerFn({ method: 'GET' })
  .validator(type({ id: 'string' }))
  .handler(async ({ data }) => {
    const result = await Result.tryPromise(() =>
      proxy.shares.info({ id: data.id, token: unlockToken.get(data.id) })
    )

    if (result.isErr()) {
      throw failure(result.error.cause)
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
    }
  })

const rememberUnlock = createServerFn({ method: 'POST' })
  .validator(type({ id: 'string', token: shareToken }))
  .handler(({ data }) => {
    unlockToken.set(data.id, data.token)
  })

// The password goes from the browser straight to the proxy, which locks out wrong guesses by the viewer's own address.
export const unlockShare = async (data: { id: string; password: string }) => {
  const result = await Result.tryPromise(() => proxy.shares.unlock(data))

  if (result.isErr()) {
    const { cause } = result.error
    if (cause instanceof ORPCError && WORDED_CODES.has(cause.code)) {
      return Result.err(cause.message)
    }
    return Result.err(
      cause instanceof ORPCError && REFUSED_CODES.has(cause.code)
        ? WRONG_PASSWORD
        : UNAVAILABLE
    )
  }

  if (result.value.token) {
    await rememberUnlock({ data: { id: data.id, token: result.value.token } })
  }
  return Result.ok()
}
