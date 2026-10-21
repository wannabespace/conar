import { ORPCError } from '@orpc/server'
import {
  SHARE_PAGE_SIZE,
  shareCheckInput,
  sharePage,
  shareSort,
} from '@tamery/shared/share'
import { silently, toError } from '@tamery/shared/utils'
import { type } from 'arktype'
import { Result } from 'better-result'

import { createApiClient } from '~/api-client'
import { authMiddleware, orpc } from '~/orpc'
import { assertReachable } from '~/public-host'
import { readShareRows, shareRows } from '~/share-rows'

const proxyApi = createApiClient()

const shareAccess = type({
  id: 'string.uuid',
  password: 'string | null',
  token: 'string | null',
})

export const shares = {
  check: orpc
    .use(authMiddleware)
    .input(shareCheckInput)
    .errors({
      PRIVATE_HOST: {
        message:
          'Shared tables are read from Tamery’s servers, which reach only databases on the internet. This connection’s host is local or on a private network.',
      },
      UNREACHABLE: { message: 'Tamery’s servers could not read this table.' },
    })
    .handler(async ({ context, errors, input }) => {
      const { dialect, resourceId, ...view } = input
      const connectionString = await createApiClient({
        authorization: context.headers.get('authorization'),
        cookie: context.headers.get('cookie'),
      }).internal.proxy.resolveConnectionString({ resourceId })

      const reachable = await Result.tryPromise(() =>
        assertReachable(connectionString)
      )

      if (reachable.isErr()) {
        throw errors.PRIVATE_HOST()
      }

      const read = await Result.tryPromise(() =>
        readShareRows({
          connectionString,
          dialect,
          limit: 1,
          offset: 0,
          sort: null,
          view,
        })
      )

      if (read.isErr()) {
        throw errors.UNREACHABLE({
          message: `Tamery’s servers could not read this table: ${toError(read.error.cause).message}`,
        })
      }
    }),
  info: orpc.input(shareAccess).handler(async ({ input }) => {
    const share = await proxyApi.internal.shares.resolve(input)
    return {
      description: share.description,
      filters: share.view.filters,
      name: share.name,
      token: share.token,
    }
  }),
  rows: orpc
    .input(shareAccess.merge({ page: sharePage, sort: shareSort }))
    .errors({
      UNAVAILABLE: {
        message: 'This table cannot be loaded right now. Try again later.',
      },
    })
    .handler(async ({ errors, input: { page, sort, ...access } }) => {
      const share = await proxyApi.internal.shares.resolve(access)
      const view = { ...share.view, schema: share.schema, table: share.table }
      const isShown = (column: string) =>
        view.columns.some((shown) => shown.id === column)
      const read = await Result.tryPromise(async () => {
        await assertReachable(share.connectionString)
        return shareRows.read(share, {
          connectionString: share.connectionString,
          dialect: share.dialect,
          limit: SHARE_PAGE_SIZE + 1,
          offset: (page - 1) * SHARE_PAGE_SIZE,
          // A hidden column must not even order what the viewer sees.
          sort: sort && isShown(sort.column) ? sort : null,
          view,
        })
      })

      if (read.isErr() && read.error.cause instanceof ORPCError) {
        throw read.error.cause
      }

      const failing = read.isErr()

      // Only the owner's own view reports, so no viewer's page or sort can mark the share failing.
      if (
        page === 1 &&
        sort === null &&
        failing !== (share.failingSince !== null)
      ) {
        await silently(() =>
          proxyApi.internal.shares.report({ failing, id: access.id })
        )
      }

      if (read.isErr()) {
        throw errors.UNAVAILABLE({ cause: read.error.cause })
      }

      return {
        columns: view.columns,
        description: share.description,
        fetchedAt: read.value.fetchedAt,
        filters: view.filters,
        hasMore: read.value.rows.length > SHARE_PAGE_SIZE,
        name: share.name,
        orderBy: Object.fromEntries(
          Object.entries(view.orderBy).filter(([column]) => isShown(column))
        ),
        refresh: share.refresh,
        rows: read.value.rows.slice(0, SHARE_PAGE_SIZE),
        token: share.token,
      }
    }),
}
