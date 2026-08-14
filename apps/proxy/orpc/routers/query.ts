import { createQueryRouter } from '@tamery/query-proxy'
import { memoize } from 'memoza'

import { createApiClient } from '~/api-client'
import { authMiddleware, orpc } from '~/orpc'

const resolveQueryConnectionString = memoize(
  ({
    input,
    headers,
  }: {
    input: {
      connectionString?: string
      resourceId?: string
      connectionId?: string
    }
    headers: Headers
  }) => {
    if (input.connectionString) {
      return input.connectionString
    }

    const apiClient = createApiClient({
      authorization: headers.get('authorization'),
      cookie: headers.get('cookie'),
    })

    return apiClient.internal.proxy.resolveConnectionString(input)
  },
  {
    // 5 minutes
    maxAge: 1000 * 60 * 5,
  }
)

export const query = createQueryRouter(
  orpc.use(authMiddleware),
  (input, context) =>
    resolveQueryConnectionString({ headers: context.headers, input })
)
