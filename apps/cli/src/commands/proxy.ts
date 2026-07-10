import process from 'node:process'

import type { RouterOutputs } from '@conar/api/orpc/routers'
import { createQueryRouter } from '@conar/query-proxy'
import { PORTS } from '@conar/shared/constants'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { command } from '@drizzle-team/brocli'
import { serve } from '@hono/node-server'
import { ORPCError, os, ValidationError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { consola } from 'consola'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { orpc as apiOrpc } from '~/orpc'
import { requireSession } from '~/session'

type Connection = RouterOutputs['connections']['list'][number]
type Resource = RouterOutputs['connectionsResources']['list'][number]

const REFRESH_INTERVAL_MS = 60_000

export const proxyCommand = command({
  name: 'proxy',
  desc: 'Start a local proxy server so the web app can query local connections',
  handler: async () => {
    const session = await requireSession()

    let connections: Connection[] = []
    let resources: Resource[] = []

    async function fetchConnections() {
      const prevIds = new Set(connections.map(c => c.id))
      const [fetchedConnections, fetchedResources] = await Promise.all([
        apiOrpc.connections.list(),
        apiOrpc.connectionsResources.list(),
      ])
      connections = fetchedConnections
      resources = fetchedResources
      for (const conn of connections) {
        if (!prevIds.has(conn.id)) {
          consola.info(`+ Connection: ${conn.name} (${conn.type})`)
        }
        prevIds.delete(conn.id)
      }
      for (const removed of prevIds) {
        consola.info(`- Connection removed: ${removed}`)
      }
      return connections.length
    }

    function resolveConnectionString(input: {
      connectionString?: string
      resourceId?: string
      connectionId?: string
    }): string {
      if (input.connectionString) {
        return input.connectionString
      }

      if (input.resourceId) {
        const resource = resources.find(r => r.id === input.resourceId)
        if (!resource) {
          throw new ORPCError('NOT_FOUND', {
            message: `Resource "${input.resourceId}" not found in local cache. Try restarting \`conar proxy\`.`,
          })
        }

        const conn = connections.find(c => c.id === resource.connectionId)
        if (!conn) {
          throw new ORPCError('NOT_FOUND', {
            message: `Connection for resource "${input.resourceId}" not found in local cache.`,
          })
        }

        const url = new SafeURL(conn.connectionString)
        url.pathname = resource.name || ''
        return url.toString()
      }

      if (input.connectionId) {
        const conn = connections.find(c => c.id === input.connectionId)
        if (!conn) {
          throw new ORPCError('NOT_FOUND', {
            message: `Connection "${input.connectionId}" not found in local cache. Try restarting \`conar proxy\`.`,
          })
        }
        return conn.connectionString
      }

      throw new ORPCError('BAD_REQUEST', {
        message: 'One of connectionString, resourceId, or connectionId is required.',
      })
    }

    async function verifyBrowserSession(headers: Headers): Promise<void> {
      const res = await fetch(`${import.meta.env.API_URL}/auth/get-session`, {
        headers,
      })

      if (!res.ok) {
        throw new Error('Invalid or expired browser session.')
      }

      const data = (await res.json()) as { user?: { id?: string } } | null
      if (!data?.user?.id) {
        throw new Error('Invalid browser session.')
      }

      if (data.user.id !== session.user.id) {
        throw new Error('Browser session belongs to a different user than the CLI session.')
      }
    }

    const orpc = os.$context<{ headers: Headers }>()

    const authed = orpc.use(
      orpc.middleware(async ({ next, context }) => {
        await verifyBrowserSession(context.headers)
        return next({})
      }),
    )

    const router = createQueryRouter(authed, input => resolveConnectionString(input))

    consola.start('Fetching connections...')
    const count = await fetchConnections()
    consola.success(`Loaded ${count} connection${count === 1 ? '' : 's'}.`)

    const refreshInterval = setInterval(async () => {
      try {
        await fetchConnections()
      } catch (error) {
        consola.warn(
          `Failed to refresh connections: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }, REFRESH_INTERVAL_MS)

    const handler = new RPCHandler(router, {
      interceptors: [
        async options => {
          try {
            return await options.next()
          } catch (error) {
            consola.error({
              type: error instanceof Error ? error.constructor.name : typeof error,
              message: error instanceof Error ? error.message : String(error),
              cause: error instanceof Error ? error.cause : undefined,
              stack: error instanceof Error ? error.stack : undefined,
            })

            if (error instanceof ORPCError) {
              if (error.cause instanceof ValidationError) {
                const message = error.cause.issues
                  .map(issue =>
                    issue.path
                      ? `${issue.path.join('.')}: ${issue.message.toLowerCase()}`
                      : issue.message,
                  )
                  .join(', ')

                throw new ORPCError('BAD_REQUEST', { message })
              }

              throw error
            }

            if (error instanceof Error) {
              throw new ORPCError('INTERNAL_SERVER_ERROR', { message: error.message, cause: error })
            }

            throw error
          }
        },
      ],
    })

    const app = new Hono()
      .use(
        cors({
          origin(origin) {
            const allowedOrigins = [import.meta.env.MAIN_URL]
            return origin.endsWith(`.${new URL(import.meta.env.MAIN_URL).host}`) ||
              allowedOrigins.includes(origin)
              ? origin
              : null
          },
          credentials: true,
        }),
      )
      .get('/health', c =>
        c.json({
          ok: true,
          version: import.meta.env.VERSION,
          userId: session.user.id,
        }),
      )
      .use('/*', async (c, next) => {
        const { matched, response } = await handler.handle(c.req.raw.clone(), {
          context: { headers: c.req.raw.headers },
        })

        if (matched) {
          return c.newResponse(response.body, response)
        }

        await next()
      })

    const onSigint = () => {
      clearInterval(refreshInterval)
      consola.info('Shutting down proxy...')
      process.exit(0)
    }
    process.once('SIGINT', onSigint)
    process.once('SIGTERM', onSigint)

    serve(
      {
        fetch: app.fetch,
        port: PORTS.LOCAL_PROXY,
        hostname: '127.0.0.1',
      },
      () => {
        consola.box({
          title: 'Conar Local Proxy',
          message: [
            `Listening on http://127.0.0.1:${PORTS.LOCAL_PROXY}`,
            `Signed in as ${session.user.email}`,
            '',
            'The web app will automatically route connections through this proxy.',
            'Press Ctrl+C to stop.',
          ].join('\n'),
          style: { borderColor: 'cyan', borderStyle: 'rounded', padding: 1 },
        })
      },
    )
  },
})
