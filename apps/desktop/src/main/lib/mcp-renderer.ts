import { once } from 'node:events'

import type { McpReply, McpRequest, McpSource } from '@tamery/shared/mcp'
import { BrowserWindow, MessageChannelMain } from 'electron'

const ask = async (
  window: BrowserWindow,
  request: McpRequest,
  signal: AbortSignal
): Promise<McpReply> => {
  signal.throwIfAborted()
  const { port1, port2 } = new MessageChannelMain()
  const closed = new AbortController()
  const abort = () => port1.postMessage('abort')
  port1.once('close', () => closed.abort())
  signal.addEventListener('abort', abort, { once: true })
  port1.start()
  window.webContents.postMessage('mcp.request', request, [port2])
  try {
    const [{ data }] = await once(port1, 'message', {
      signal: AbortSignal.any([signal, closed.signal]),
    })
    port1.close()
    return data
  } catch (askError) {
    throw closed.signal.aborted
      ? new Error('The Tamery window closed before answering.')
      : askError
  } finally {
    signal.removeEventListener('abort', abort)
  }
}

export const askRenderer = async <Method extends McpRequest['method']>(
  request: Extract<McpRequest, { method: Method }>,
  signal: AbortSignal
) => {
  for (const window of BrowserWindow.getAllWindows()) {
    // Sequential by design: the first window serving answers, the rest are never asked.
    // oxlint-disable-next-line no-await-in-loop
    const reply = await ask(window, request, signal)
    if ('error' in reply) {
      throw new Error(reply.error)
    }
    if ('result' in reply) {
      // Wire boundary: the port carries untyped data; the preload answers with `McpSource[request.method]`'s result.
      return reply.result as Awaited<ReturnType<McpSource[Method]>>
    }
  }
  throw new Error('Open Tamery and sign in first.')
}
