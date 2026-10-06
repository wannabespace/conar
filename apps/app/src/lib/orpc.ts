import { createORPCClient, onError, ORPCError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { RetryLinkPlugin } from '@orpc/client/plugins'
import type { RetryLinkPluginContext } from '@orpc/client/plugins'
import type { InferRouterInputs, InferRouterOutputs } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import type * as apiOrpc from '@tamery/api/orpc/routers'
import type * as proxyOrpc from '@tamery/proxy/orpc/routers'
import type * as queryProxy from '@tamery/query-proxy'
import { querySerializer } from '@tamery/query-proxy/serializer'
import { isConnectionError } from '@tamery/shared/connections'
import { PROXY_ERROR_MESSAGE } from '@tamery/shared/constants'
import { memoize } from 'memoza'

import { bearerToken } from './auth'
import { handleError } from './error'
import { apiUrl, proxyUrl } from './urls'

export interface AppClientContext extends RetryLinkPluginContext {
  silent?: boolean
}

export const orpc = createTanstackQueryUtils(
  createORPCClient(
    new RPCLink<AppClientContext>({
      fetch: (url, init) =>
        globalThis.fetch(url, {
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
      origin: apiUrl,
      plugins: [
        new RetryLinkPlugin({
          default: {
            retry: 3,
            retryDelay: 2000,
            shouldRetry: ({ error }) =>
              error instanceof TypeError && !navigator.onLine,
          },
        }),
      ],
      url: '/rpc',
    })
  ) satisfies apiOrpc.ORPCRouter
)

export const orpcProxy = createORPCClient(
  new RPCLink({
    fetch: (url, init) =>
      globalThis.fetch(url, {
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
    origin: proxyUrl,
    serializer: querySerializer,
    url: '/rpc',
  })
) satisfies proxyOrpc.ORPCRouter

export type ORPCInputs = InferRouterInputs<typeof apiOrpc.router>
export type ORPCOutputs = InferRouterOutputs<typeof apiOrpc.router>

export const createProxyClient = memoize(
  (origin: string): queryProxy.ORPCRouter =>
    createORPCClient(
      new RPCLink({
        fetch: (url, init) =>
          globalThis.fetch(url, {
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
        origin,
        serializer: querySerializer,
      })
    )
)
