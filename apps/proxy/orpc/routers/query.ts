import { createQueryRouter } from '@tamery/query-proxy'

import { createApiClient } from '~/api-client'
import { authMiddleware, orpc } from '~/orpc'
import { assertPublicHost } from '~/public-host'

export const query = createQueryRouter(orpc.use(authMiddleware), {
  connectionString: async (input, { headers }) => {
    const connectionString =
      'connectionString' in input
        ? input.connectionString
        : await createApiClient({
            authorization: headers.get('authorization'),
            cookie: headers.get('cookie'),
          }).internal.proxy.resolveConnectionString(input)
    await assertPublicHost(connectionString)
    return connectionString
  },
  owner: (context) => context.session.userId,
})
