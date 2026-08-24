import { createORPCClient, onError, ORPCError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { ClientRetryPlugin } from '@orpc/client/plugins'
import type { InferRouterInputs, InferRouterOutputs } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import type * as apiOrpc from '@tamery/api/orpc/routers'
import type * as proxyOrpc from '@tamery/proxy/orpc/routers'
import type * as queryProxy from '@tamery/query-proxy'
import { PROXY_ERROR_MESSAGE } from '@tamery/shared/constants'
import { isConnectionError } from '@tamery/shared/utils/connections'
import { memoize } from 'memoza'

import { handleError } from '../utils/error'
import { apiUrl, proxyUrl } from '../utils/utils'
import { bearerToken } from './auth'

export const orpc = createTanstackQueryUtils(
  createORPCClient(
    new RPCLink({
      fetch: (request, init) =>
        globalThis.fetch(request, {
          ...init,
          credentials: 'include',
        }),
      headers: async () => {
        const token = bearerToken.get()

        return {
          Authorization: token ? `Bearer ${token}` : undefined,
          ...(window.electron
            ? {
                'x-desktop': 'true',
                'x-desktop-version': await window.electron.versions.app(),
              }
            : { 'x-app-version': import.meta.env.VITE_APP_VERSION }),
        }
      },
      interceptors: [onError(handleError)],
      plugins: [
        new ClientRetryPlugin({
          default: {
            retry: 3,
            retryDelay: 2000,
            shouldRetry: ({ error }) =>
              error instanceof TypeError && !navigator.onLine,
          },
        }),
      ],
      url: `${apiUrl}/rpc`,
    })
  ) satisfies apiOrpc.ORPCRouter
)

export const orpcProxy = createORPCClient(
  new RPCLink({
    fetch: (request, init) =>
      globalThis.fetch(request, {
        ...init,
        credentials: 'include',
      }),
    headers: () => {
      const token = bearerToken.get()

      return {
        Authorization: token ? `Bearer ${token}` : undefined,
      }
    },
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
              { cause: error }
            )
          }

          throw error
        }
      },
    ],
    url: `${proxyUrl}/rpc`,
  })
) satisfies proxyOrpc.ORPCRouter

export type ORPCInputs = InferRouterInputs<typeof apiOrpc.router>
export type ORPCOutputs = InferRouterOutputs<typeof apiOrpc.router>

export const createProxyClient = memoize((url: string): queryProxy.ORPCRouter =>
  createORPCClient(
    new RPCLink({
      fetch: (request, init) =>
        globalThis.fetch(request, {
          ...init,
          credentials: 'include',
        }),
      headers: () => {
        const token = bearerToken.get()
        return {
          Authorization: token ? `Bearer ${token}` : undefined,
        }
      },
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
      url,
    })
  )
)
