import type * as apiOrpc from '@conar/api/orpc/routers'
import type * as proxyOrpc from '@conar/proxy/orpc/routers'
import type * as queryProxy from '@conar/query-proxy'
import { isConnectionError } from '@conar/shared/utils/connections'
import { createORPCClient, onError, ORPCError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { ClientRetryPlugin } from '@orpc/client/plugins'
import type { InferRouterInputs, InferRouterOutputs } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { memoize } from 'memoza'

import { handleError } from '../utils/error'
import { apiUrl, proxyUrl } from '../utils/utils'
import { bearerToken } from './auth'

export const orpc = createTanstackQueryUtils(
  createORPCClient(
    new RPCLink({
      url: `${apiUrl}/rpc`,
      headers: async () => {
        const token = bearerToken.get()

        return {
          Authorization: token ? `Bearer ${token}` : undefined,
          ...(window.electron
            ? {
                'x-desktop': 'true',
                'x-desktop-version': await window.electron.versions.app(),
              }
            : {}),
        }
      },
      fetch: (request, init) => {
        return globalThis.fetch(request, {
          ...init,
          credentials: 'include',
        })
      },
      interceptors: [onError(handleError)],
      plugins: [
        new ClientRetryPlugin({
          default: {
            retry: 3,
            retryDelay: 2000,
            shouldRetry: ({ error }) => error instanceof TypeError && !navigator.onLine,
          },
        }),
      ],
    }),
  ) satisfies apiOrpc.ORPCRouter,
)

export const orpcProxy = createORPCClient(
  new RPCLink({
    url: `${proxyUrl}/rpc`,
    interceptors: [
      async (options) => {
        try {
          return await options.next()
        } catch (error) {
          if (error instanceof ORPCError) {
            throw error
          }

          if (error instanceof Error && isConnectionError(error)) {
            throw new Error(
              "We can't connect to the proxy, please check your connection and try again.",
              { cause: error },
            )
          }

          throw error
        }
      },
    ],
    headers: async () => {
      const token = bearerToken.get()

      return {
        Authorization: token ? `Bearer ${token}` : undefined,
      }
    },
    fetch: (request, init) => {
      return globalThis.fetch(request, {
        ...init,
        credentials: 'include',
      })
    },
  }),
) satisfies proxyOrpc.ORPCRouter

export type ORPCInputs = InferRouterInputs<typeof apiOrpc.router>
export type ORPCOutputs = InferRouterOutputs<typeof apiOrpc.router>

export const PROXY_ERROR_MESSAGE =
  "We can't connect to the proxy, please check your connection and try again."

export const createProxyClient = memoize((url: string): queryProxy.ORPCRouter => {
  return createORPCClient(
    new RPCLink({
      url,
      interceptors: [
        async (options) => {
          try {
            return await options.next()
          } catch (error) {
            if (error instanceof ORPCError) {
              throw error
            }

            if (error instanceof Error && isConnectionError(error)) {
              throw new Error(PROXY_ERROR_MESSAGE, { cause: error })
            }

            throw error
          }
        },
      ],
      headers: async () => {
        const token = bearerToken.get()
        return {
          Authorization: token ? `Bearer ${token}` : undefined,
        }
      },
      fetch: (request, init) => {
        return globalThis.fetch(request, {
          ...init,
          credentials: 'include',
        })
      },
    }),
  )
})
