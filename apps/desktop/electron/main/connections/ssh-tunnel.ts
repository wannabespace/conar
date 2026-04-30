import type { SshConfig } from '@conar/connection/server'
import type { ConnectConfig, Client as SshClient } from 'ssh2'
import { createRequire } from 'node:module'
import net from 'node:net'
import { readSshKey } from '@conar/connection/server'
import { clearMemoizeCache, getCacheStore, memoize } from '@conar/memoize'

const ssh2 = createRequire(import.meta.url)('ssh2') as typeof import('ssh2')

export interface TunnelEndpoint {
  host: string
  port: number
}

interface ActiveTunnel {
  endpoint: TunnelEndpoint
  client: SshClient
  server: net.Server
}

function tunnelKey(ssh: SshConfig, targetHost: string, targetPort: number): string {
  return [
    ssh.host,
    ssh.port,
    ssh.user,
    ssh.auth,
    ssh.privateKeyPath ?? '',
    targetHost,
    targetPort,
  ].join('|')
}

function buildAuth(ssh: SshConfig): Pick<ConnectConfig, 'password' | 'privateKey' | 'passphrase' | 'agent'> {
  if (ssh.auth === 'password') {
    return { password: ssh.password }
  }
  if (ssh.auth === 'agent') {
    return { agent: process.env.SSH_AUTH_SOCK }
  }
  const privateKey = readSshKey(ssh)
  return {
    ...(privateKey ? { privateKey } : {}),
    ...(ssh.passphrase ? { passphrase: ssh.passphrase } : {}),
  }
}

const getActiveTunnel = memoize(
  async ({ ssh, targetHost, targetPort }: {
    ssh: SshConfig
    targetHost: string
    targetPort: number
  }): Promise<ActiveTunnel> => {
    const key = tunnelKey(ssh, targetHost, targetPort)
    const client = new ssh2.Client()

    const invalidateCache = () => {
      const store = getCacheStore(getActiveTunnel)
      store?.cache.delete(key)
    }

    const server = net.createServer((socket) => {
      client.forwardOut('127.0.0.1', 0, targetHost, targetPort, (err, stream) => {
        if (err) {
          socket.destroy(err)
          return
        }
        socket.pipe(stream).pipe(socket)
      })
    })

    const closeServerSafely = () => {
      try {
        server.close()
      }
      catch {}
    }

    client.on('close', () => {
      invalidateCache()
      closeServerSafely()
    })
    client.on('error', () => {
      invalidateCache()
      closeServerSafely()
    })

    const connect = Promise.withResolvers<void>()
    client.once('ready', () => connect.resolve())
    client.once('error', (err: Error) => {
      connect.reject(new Error(`SSH connect failed: ${err.message}`, { cause: err }))
    })
    // TODO: persist trusted host fingerprints in electron-store and pass a
    // hostVerifier callback here. Until then, host keys are accepted blind.
    client.connect({
      host: ssh.host,
      port: ssh.port,
      username: ssh.user,
      keepaliveInterval: 30_000,
      readyTimeout: 15_000,
      ...buildAuth(ssh),
    })
    await connect.promise

    const listen = Promise.withResolvers<void>()
    server.once('error', listen.reject)
    server.once('listening', () => listen.resolve())
    server.listen(0, '127.0.0.1')
    await listen.promise

    const address = server.address()
    if (!address || typeof address === 'string') {
      throw new Error('SSH tunnel: failed to obtain local listener address')
    }

    return {
      client,
      server,
      endpoint: { host: '127.0.0.1', port: address.port },
    }
  },
  {
    transformArgs: ({ ssh, targetHost, targetPort }) => tunnelKey(ssh, targetHost, targetPort),
  },
)

export async function ensureTunnel(
  ssh: SshConfig,
  targetHost: string,
  targetPort: number,
): Promise<TunnelEndpoint> {
  const tunnel = await getActiveTunnel({ ssh, targetHost, targetPort })
  return tunnel.endpoint
}

export function closeAllTunnels(): void {
  const store = getCacheStore(getActiveTunnel)
  if (!store)
    return

  const pending = [...store.cache.values()]
  void (async () => {
    for (const promise of pending) {
      try {
        const tunnel = (await promise) as ActiveTunnel
        try {
          tunnel.server.close()
        }
        catch {}
        try {
          tunnel.client.end()
        }
        catch {}
      }
      catch {
      }
    }
  })()
  clearMemoizeCache(getActiveTunnel)
}
