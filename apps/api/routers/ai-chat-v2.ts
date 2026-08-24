import type { WebSocketLike } from '@tanstack/ai'
import { chat, toWebSocketStream } from '@tanstack/ai'
import { anthropicText } from '@tanstack/ai-anthropic'
import { Hono } from 'hono'
import { createBunWebSocket } from 'hono/bun'

import { auth } from '~/lib/auth'

const { upgradeWebSocket, websocket } = createBunWebSocket()

export { websocket }

const SYSTEM_PROMPT = [
  'You are Conar AI, a helpful assistant embedded in Conar — a database management app.',
  'You help users with databases, SQL, and general questions about their work.',
  'Reply in the same language as the user. Use markdown. Place SQL in ```sql code blocks.',
  'Be concise and precise.',
].join('\n')

// Bridges Hono's callback-style WebSocket events to the WHATWG-like
// addEventListener surface that toWebSocketStream expects.
function createSocketBridge() {
  const messageHandlers = new Set<(ev: { data: unknown }) => void>()
  const closeHandlers = new Set<() => void>()
  let send: ((data: string) => void) | null = null
  let close: ((code?: number, reason?: string) => void) | null = null

  const socket: WebSocketLike = {
    send: data => send?.(data),
    close: (code, reason) => close?.(code, reason),
    addEventListener: ((type: 'message' | 'close' | 'error', handler: never) => {
      if (type === 'message') {
        messageHandlers.add(handler)
      } else {
        closeHandlers.add(handler)
      }
    }) as WebSocketLike['addEventListener'],
  }

  return {
    socket,
    attach(ws: { send: (data: string) => void; close: (code?: number, reason?: string) => void }) {
      send = data => ws.send(data)
      close = (code, reason) => ws.close(code, reason)
    },
    emitMessage(data: unknown) {
      messageHandlers.forEach(handler => handler({ data }))
    },
    emitClose() {
      closeHandlers.forEach(handler => handler())
    },
  }
}

export const aiChatV2Router = new Hono()
  .use('/chat', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers }).catch(() => null)

    if (!session) {
      return c.text('Unauthorized', 401)
    }

    return next()
  })
  .get(
    '/chat',
    upgradeWebSocket(c => {
      const bridge = createSocketBridge()
      const request = c.req.raw

      return {
        onOpen(_event, ws) {
          bridge.attach(ws)
          toWebSocketStream(bridge.socket, request, {
            onRun: ctx => {
              const abortController = new AbortController()
              ctx.signal.addEventListener('abort', () => abortController.abort())

              return chat({
                adapter: anthropicText('claude-opus-4-8'),
                messages: ctx.messages,
                systemPrompts: [SYSTEM_PROMPT],
                abortController,
              })
            },
          })
        },
        onMessage(event) {
          bridge.emitMessage(event.data)
        },
        onClose() {
          bridge.emitClose()
        },
        onError() {
          bridge.emitClose()
        },
      }
    }),
  )
