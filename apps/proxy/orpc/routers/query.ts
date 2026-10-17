import { createQueryRouter } from '@tamery/query-proxy'

import { createApiClient } from '~/api-client'
import { authMiddleware, orpc } from '~/orpc'
import { assertNoServerFiles, assertPublicHost } from '~/public-host'

export const query = createQueryRouter(orpc.use(authMiddleware), {
  connectionString: async (input, { headers }) => {
    const connectionString =
      'connectionString' in input
        ? input.connectionString
        : await createApiClient({
            authorization: headers.get('authorization'),
            cookie: headers.get('cookie'),
          }).internal.proxy.resolveConnectionString(
            'connectionId' in input
              ? { connectionId: input.connectionId }
              : { resourceId: input.resourceId }
          )
    assertNoServerFiles(connectionString)
    await assertPublicHost(connectionString)
    return connectionString
  },
  owner: (context) => context.session.userId,
})
