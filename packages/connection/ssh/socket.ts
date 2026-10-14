import type { Duplex } from 'node:stream'
import { duplexPair } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import { tryCatchAsync } from '@tamery/shared/utils'

// An ssh2 channel emits 'close' only once its readable side ends, so it is drained as it closes or the session counts it open forever.
const close = (channel: Duplex) => channel.resume().destroy()

/**
 * A socket for a driver, over an SSH channel that may still be opening: pg and mysql2 take their socket synchronously, so writes wait in the pair until the channel is up.
 * The no-op socket methods are the ones pg, tedious and Node's HTTP agent call unguarded; `connect` fires once the channel is open.
 */
export const tunnelSocket = (channel: Promise<Duplex>) => {
  const [socket, inner] = duplexPair()
  const self = () => socket
  const attach = async () => {
    const { data: opened, error } = await tryCatchAsync(() => channel)
    if (error) {
      socket.destroy(error)
      return
    }
    if (socket.destroyed) {
      close(opened)
      return
    }
    // A destroyed pair side doesn't destroy the other on Electron's Node, so the channel is closed here.
    socket.once('close', () => close(opened))
    socket.emit('connect')
    const { error: broken } = await tryCatchAsync(() =>
      pipeline(inner, opened, inner)
    )
    socket.destroy(broken ?? undefined)
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
