import { randomBytes } from 'node:crypto'
import { once } from 'node:events'
import { createRequire } from 'node:module'
import type { AddressInfo, Server, Socket } from 'node:net'
import { pipeline } from 'node:stream/promises'

import { silently } from '@tamery/shared/utils'

import type { Forwarding } from './forwarding'

interface SocksServer extends Server {
  useAuth: (auth: unknown) => void
}

// The package ships no types; this is the part of its API Tamery calls.
interface Socks {
  auth: {
    UserPassword: (
      check: (
        user: string,
        password: string,
        done: (ok: boolean) => void
      ) => void
    ) => unknown
  }
  createServer: (
    onConnection: (
      target: { dstAddr: string; dstPort: number },
      accept: (intercept: true) => Socket | undefined
    ) => void
  ) => SocksServer
}

const LOOPBACK = '127.0.0.1'

const secret = () => randomBytes(24).toString('hex')

/**
 * Serves an SSH forwarding as a SOCKS5 proxy for a driver that takes no stream and dials every server it discovers.
 * It listens on loopback only, and its random credentials keep any other local process from using the tunnel.
 */
export const socksProxy = async (forwarding: Forwarding) => {
  // Loaded only for a tunnel: tunnels open in the desktop database process alone, and nothing else ships the package.
  const socks = createRequire(import.meta.url)('@mongodb-js/socksv5') as Socks
  const proxyUsername = secret()
  const proxyPassword = secret()
  const server = socks.createServer(({ dstAddr, dstPort }, accept) => {
    const client = accept(true)
    if (client) {
      const channel = forwarding.socketTo({ host: dstAddr, port: dstPort })
      void silently(() => pipeline(client, channel, client))
    }
  })
  server.useAuth(
    socks.auth.UserPassword((user, password, done) =>
      done(user === proxyUsername && password === proxyPassword)
    )
  )
  server.listen(0, LOOPBACK)
  await once(server, 'listening')
  const { port } = server.address() as AddressInfo
  return {
    close: () => server.close(),
    options: {
      proxyHost: LOOPBACK,
      proxyPassword,
      proxyPort: port,
      proxyUsername,
    },
  }
}
