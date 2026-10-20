import {
  SHARE_PAGE_SIZE,
  shareCheckInput,
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
          share: { id: resourceId, updatedAt: new Date() },
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
        offset: 'number.integer >= 0',
        password: 'string | null',
        sort: shareSort,
      })
    )
    .errors({
      UNAVAILABLE: {
        message: 'This table cannot be loaded right now. Try again later.',
      },
    })
    .handler(async ({ errors, input: { id, offset, password, sort } }) => {
      const api = createApiClient({})
      const share = await api.internal.shares.resolve({ id, password })
      const view = { ...share.view, schema: share.schema, table: share.table }
      const read = await Result.tryPromise(async () => {
        await assertReachable(share.connectionString)
        return shareRows[share.refresh]({
          connectionString: share.connectionString,
          dialect: share.dialect,
          limit: SHARE_PAGE_SIZE + 1,
          offset,
          share,
          // A hidden column must not even order what the viewer sees.
          sort: sort && view.columns.includes(sort.column) ? sort : null,
          view,
        })
      })
      const failing = read.isErr()

      if (failing !== (share.failingSince !== null)) {
        await silently(() => api.internal.shares.report({ failing, id }))
      }

      if (read.isErr()) {
        throw errors.UNAVAILABLE({ cause: read.error.cause })
      }

      return {
        columns: view.columns.map((column) => ({
          id: column,
          type:
            view.columnTypes.find(({ id: typed }) => typed === column)?.type ??
            '',
        })),
        description: share.description,
        fetchedAt: read.value.fetchedAt,
        filters: view.filters,
        hasMore: read.value.rows.length > SHARE_PAGE_SIZE,
        name: share.name,
        rows: read.value.rows.slice(0, SHARE_PAGE_SIZE),
      }
    }),
}
