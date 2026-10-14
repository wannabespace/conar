import { expect, test } from 'bun:test'
import { once } from 'node:events'
import type { Duplex } from 'node:stream'
import { duplexPair, PassThrough } from 'node:stream'

import { tunnelSocket } from './socket'

test('bytes written before the channel opens reach it, and its replies come back', async () => {
  const [channel, server] = duplexPair()
  const { promise, resolve } = Promise.withResolvers<Duplex>()
  const socket = tunnelSocket(promise)
  socket.write('ping')
  resolve(channel)
  await once(socket, 'connect')
  const [sent] = await once(server, 'data')
  expect(String(sent)).toBe('ping')
  server.write('pong')
  const [reply] = await once(socket, 'data')
  expect(String(reply)).toBe('pong')
})

/** Closes the way an ssh2 direct-tcpip channel does: `destroy` only ends it, and 'close' waits for the unread reply to drain. */
const sshLikeChannel = () => {
  const channel = new PassThrough({ emitClose: false })
  channel.write('unread reply')
  return Object.assign(channel, {
    destroy: () => {
      channel.end()
      channel.once('end', () => channel.emit('close'))
      return channel
    },
  })
}

test.each([
  ['after it opens', true],
  ['before it opens', false],
])('destroying the socket %s closes the channel', async (_, openFirst) => {
  const channel = sshLikeChannel()
  const { promise, resolve } = Promise.withResolvers<Duplex>()
  const socket = tunnelSocket(promise)
  if (openFirst) {
    resolve(channel)
    await once(socket, 'connect')
  }
  socket.destroy()
  resolve(channel)
  await once(channel, 'close')
})

test('a channel that fails to open fails the socket', async () => {
  const socket = tunnelSocket(Promise.reject(new Error('Channel open failure')))
  await expect(once(socket, 'connect')).rejects.toThrow('Channel open failure')
})
