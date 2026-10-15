import type { Duplex } from 'node:stream'
import { duplexPair } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import { toError } from '@tamery/shared/utils'
import { Result } from 'better-result'

// An ssh2 channel emits 'close' only once its readable side ends, so it is drained as it closes or the session counts it open forever.
const close = (channel: Duplex) => channel.resume().destroy()

/** pg and mysql2 take their socket synchronously; pg, tedious and Node's HTTP agent call the no-op methods unguarded. */
export const tunnelSocket = (channel: Promise<Duplex>) => {
  const [socket, inner] = duplexPair()
  const self = () => socket
  const attach = async () => {
    const opening = await Result.tryPromise(() => channel)
    if (opening.isErr()) {
      socket.destroy(toError(opening.error.cause))
      return
    }
    const opened = opening.value
    if (socket.destroyed) {
      close(opened)
      return
    }
    // A destroyed pair side doesn't destroy the other on Electron's Node, so the channel is closed here.
    socket.once('close', () => close(opened))
    socket.emit('connect')
    const piped = await Result.tryPromise(() => pipeline(inner, opened, inner))
    socket.destroy(piped.isErr() ? toError(piped.error.cause) : undefined)
  }
  void attach()
  return Object.assign(socket, {
    connect: self,
    ref: self,
    setKeepAlive: self,
    setNoDelay: self,
    setTimeout: self,
    unref: self,
  })
}
