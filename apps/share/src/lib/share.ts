import { safe } from '@orpc/client'
import type { ColumnKind } from '@tamery/shared/column-kind'
import type { shareAccessErrors } from '@tamery/shared/share'
import { sharePage, shareToken } from '@tamery/shared/share'
import { valueToText } from '@tamery/shared/value-text'
import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { type } from 'arktype'
import { Result } from 'better-result'

import { proxy } from './proxy'
import { unlockToken } from './share.server'

export const SHARE_LOCKED = 'This table needs a password'

const UNAVAILABLE = 'This table cannot be loaded right now.'

// Thrown, never returned: a failure cached as data would outlive invalidation under `staleTime: 'static'`. A fresh error, so no proxy message reaches the viewer.
const failure = (
  error: { code: keyof typeof shareAccessErrors | 'UNAVAILABLE' } | null
) => {
  if (error?.code === 'NOT_FOUND') {
    return notFound()
  }
  return new Error(error?.code === 'LOCKED' ? SHARE_LOCKED : UNAVAILABLE)
}

// Engines hand booleans back as 1 and 0 too (SQLite), which read as text would never check the box.
const cellText = (value: unknown, kind: ColumnKind | null) => {
  if (value === null || value === undefined) {
    return null
  }
  return valueToText(kind === 'boolean' ? Boolean(value) : value)
}

export const getShare = createServerFn({ method: 'GET' })
  .validator(type({ id: 'string', page: sharePage }))
  .handler(async ({ data }) => {
    const { data: share, definedError } = await safe(
      proxy.shares.rows({ ...data, token: unlockToken.get(data.id) })
    )

    if (!share) {
      throw failure(definedError)
    }

    const { columns, rows } = share

    return {
      ...share,
      rows: rows.map((row) =>
        row.map((value, index) => cellText(value, columns[index]?.kind ?? null))
      ),
    }
  })

export const getShareInfo = createServerFn({ method: 'GET' })
  .validator(type({ id: 'string' }))
  .handler(async ({ data }) => {
    const { data: info, definedError } = await safe(
      proxy.shares.info({ id: data.id, token: unlockToken.get(data.id) })
    )

    if (!info) {
      throw failure(definedError)
    }

    return {
      ...info,
      filters: info.filters.map(({ column, ref, values, via }) => ({
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
  const { data: unlocked, definedError } = await safe(proxy.shares.unlock(data))

  if (!unlocked) {
    return Result.err(definedError?.message ?? UNAVAILABLE)
  }

  if (unlocked.token) {
    await rememberUnlock({ data: { id: data.id, token: unlocked.token } })
  }
  return Result.ok()
}
