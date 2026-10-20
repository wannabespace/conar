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
import { assertNoServerFiles, assertPublicHost } from '~/public-host'
import { readShareRows, shareRows } from '~/share-rows'

const assertReachable = async (connectionString: string) => {
  assertNoServerFiles(connectionString)
  await assertPublicHost(connectionString)
}

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
  rows: orpc
    .input(
      type({
        id: 'string.uuid',
        page: sharePage,
        password: 'string | null',
        sort: shareSort,
        token: 'string | null',
      })
    )
    .errors({
      UNAVAILABLE: {
        message: 'This table cannot be loaded right now. Try again later.',
      },
    })
    .handler(async ({ errors, input: { id, page, password, sort, token } }) => {
      const api = createApiClient({})
      const share = await api.internal.shares.resolve({ id, password, token })
      const view = { ...share.view, schema: share.schema, table: share.table }
      const read = await Result.tryPromise(async () => {
        await assertReachable(share.connectionString)
        return shareRows.read(share, {
          connectionString: share.connectionString,
          dialect: share.dialect,
          limit: SHARE_PAGE_SIZE + 1,
          offset: (page - 1) * SHARE_PAGE_SIZE,
          // A hidden column must not even order what the viewer sees.
          sort:
            sort && view.columns.some((column) => column.id === sort.column)
              ? sort
              : null,
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
        await silently(() => api.internal.shares.report({ failing, id }))
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
        refresh: share.refresh,
        rows: read.value.rows.slice(0, SHARE_PAGE_SIZE),
        token: share.token,
      }
    }),
}
