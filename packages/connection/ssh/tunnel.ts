import { once } from 'node:events'
import { readFile } from 'node:fs/promises'
import net from 'node:net'
import { homedir, userInfo } from 'node:os'
import { pipeline } from 'node:stream'

import { SafeURL } from '@tamery/shared/safe-url'
import { noop, silently, tryCatchAsync } from '@tamery/shared/utils'
import { memoize } from 'memoza'
import type { Client, ConnectConfig } from 'ssh2'

import { DEFAULT_PORTS, typeOfScheme } from '../connection-parts'
import type { HostKeyStatus } from './known-hosts'
import { knownHosts } from './known-hosts'
import type { SshTunnel } from './params'
import {
  DEFAULT_SSH_PORT,
  SSH_TLS_HOST_PARAM,
  deleteSshParams,
  sshTunnelOf,
} from './params'

export type ConfirmHostKey = (prompt: {
  fingerprint: string
  host: string
  keyType: string
}) => Promise<boolean>

interface Session {
  config: ConnectConfig
  endpoint: string
  hostKeyName: string
}

const IDLE_TIMEOUT = 60_000
const KEEPALIVE_INTERVAL = 10_000
const LOCAL_HOST = '127.0.0.1'
const AGENT_UNAVAILABLE =
  'SSH agent not available — start ssh-agent or pick another method'

const expandHome = (path: string) => path.replace(/^~(?=$|\/)/u, homedir())

const userSshConfig = async (host: string) => {
  const { parse } = await import('ssh-config')
  const { data } = await tryCatchAsync(() =>
    readFile(expandHome('~/.ssh/config'), 'utf-8')
  )
  const computed = parse(data ?? '').compute(host)
  return (key: string): string | undefined => [computed[key]].flat()[0]
}

const authConfig = async (
  tunnel: SshTunnel,
  sshConfig: (key: string) => string | undefined
): Promise<ConnectConfig> => {
  if (tunnel.auth === 'password') {
    if (!tunnel.password) {
      throw new Error("The SSH password isn't stored on this device")
    }
    return { password: tunnel.password }
  }
  if (tunnel.auth === 'key') {
    if (!tunnel.privateKey) {
      throw new Error("The SSH private key isn't stored on this device")
    }
    return { passphrase: tunnel.passphrase, privateKey: tunnel.privateKey }
  }
  if (tunnel.auth === 'keyPath') {
    const keyPath = tunnel.keyPath || sshConfig('IdentityFile') || ''
    const { data: privateKey } = await tryCatchAsync(() =>
      readFile(expandHome(keyPath))
    )
    if (!privateKey) {
      throw new Error(`SSH key file not found: ${keyPath}`)
    }
    return { passphrase: tunnel.passphrase, privateKey }
  }
  const agent = sshConfig('IdentityAgent') ?? process.env.SSH_AUTH_SOCK
  if (!agent) {
    throw new Error(AGENT_UNAVAILABLE)
  }
  return { agent: expandHome(agent) }
}

const sshErrorMessage = (
  error: Error & { code?: string; level?: string },
  endpoint: string
) => {
  if (error.level === 'client-authentication') {
    return `SSH authentication failed for ${endpoint}`
  }
  if (error.level === 'agent') {
    return AGENT_UNAVAILABLE
  }
  if (error.level === 'client-timeout' || error.code === 'ETIMEDOUT') {
    return `Timed out reaching the SSH host ${endpoint}`
  }
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return `Can't reach the SSH host ${endpoint}`
  }
  return `SSH connection to ${endpoint} failed: ${error.message}`
}

const HOST_KEY_REFUSALS: Record<
  Exclude<HostKeyStatus, 'known'>,
  (name: string) => string
> = {
  changed: (name) =>
    `The SSH host key for ${name} has changed, so someone may be impersonating it. If the change is expected, remove the old key from ~/.ssh/known_hosts.`,
  revoked: (name) =>
    `The SSH host key for ${name} is revoked in ~/.ssh/known_hosts`,
  unknown: (name) => `The SSH host key for ${name} wasn't trusted`,
}

const sessionOf = async (tunnel: SshTunnel): Promise<Session> => {
  const sshConfig = await userSshConfig(tunnel.host)
  const host = sshConfig('HostName') ?? tunnel.host
  const port = Number(tunnel.port || sshConfig('Port') || DEFAULT_SSH_PORT)
  const username = tunnel.user || sshConfig('User') || userInfo().username
  return {
    config: {
      ...(await authConfig(tunnel, sshConfig)),
      host,
      keepaliveInterval: KEEPALIVE_INTERVAL,
      port,
      username,
    },
    endpoint: `${username}@${host}`,
    hostKeyName: knownHosts.nameOf(sshConfig('HostKeyAlias') ?? host, port),
  }
}

const connectClient = async (
  session: Session,
  confirmHostKey: ConfirmHostKey,
  trusted = false
): Promise<Client> => {
  const known = await knownHosts.read()
  const hostKey: { key: Buffer | null; status: HostKeyStatus } = {
    key: null,
    status: 'known',
  }
  const { Client: SshClient } = await import('ssh2')
  const client = new SshClient().on('error', noop)
  const ready = once(client, 'ready')
  client.connect({
    ...session.config,
    // Synchronous on purpose: ssh2 takes any return value but `undefined` as the verdict, so an async verifier's promise would trust every key.
    hostVerifier: (key: Buffer) => {
      hostKey.key = key
      hostKey.status = knownHosts.check(known, session.hostKeyName, key)
      return hostKey.status === 'known'
    },
  })
  const { error } = await tryCatchAsync(() => ready)

  if (!error) {
    return client
  }
  if (!hostKey.key || hostKey.status === 'known') {
    throw new Error(sshErrorMessage(error, session.endpoint))
  }
  if (
    hostKey.status === 'unknown' &&
    !trusted &&
    (await confirmHostKey({
      host: session.hostKeyName,
      ...knownHosts.describe(hostKey.key),
    }))
  ) {
    await knownHosts.trust(session.hostKeyName, hostKey.key)
    return connectClient(session, confirmHostKey, true)
  }
  throw new Error(HOST_KEY_REFUSALS[hostKey.status](session.hostKeyName))
}

// The local port outlives each SSH session: dialect pools are memoized by the tunneled string, so a new port per reconnect would orphan them.
const openForward = memoize(
  async (
    tunnel: SshTunnel,
    target: { host: string; port: number },
    confirmHostKey: ConfirmHostKey
  ) => {
    const session = await sessionOf(tunnel)
    let client: Promise<Client> | null = null
    let sockets = 0
    let idleTimer: ReturnType<typeof setTimeout> | undefined

    const closeWhenIdle = () => {
      clearTimeout(idleTimer)
      if (sockets === 0) {
        idleTimer = setTimeout(
          () =>
            silently(async () => {
              const connected = await client
              connected?.end()
            }),
          IDLE_TIMEOUT
        )
      }
    }

    const connect = async () => {
      const { data: connected, error } = await tryCatchAsync(() =>
        connectClient(session, confirmHostKey)
      )
      if (error) {
        client = null
        throw error
      }
      return connected.on('close', () => {
        client = null
      })
    }

    const open = async () => {
      client ??= connect()
      const connected = await client
      closeWhenIdle()
      return connected
    }

    const forwardSocket = async (socket: net.Socket) => {
      const { data: connected } = await tryCatchAsync(open)
      if (!connected) {
        socket.destroy()
        return
      }
      connected.forwardOut(
        LOCAL_HOST,
        0,
        target.host,
        target.port,
        // oxlint-disable-next-line promise/prefer-await-to-callbacks -- ssh2 offers forwardOut only with a callback
        (error, channel) => {
          if (error) {
            socket.destroy()
            return
          }
          pipeline(socket, channel, socket, noop)
        }
      )
    }

    const server = net.createServer((socket) => {
      sockets += 1
      clearTimeout(idleTimer)
      socket.once('close', () => {
        sockets -= 1
        closeWhenIdle()
      })
      forwardSocket(socket)
    })
    await once(server.listen(0, LOCAL_HOST), 'listening')

    const address = server.address()
    if (!address || typeof address === 'string') {
      server.close()
      throw new Error('Could not open a local port for the SSH tunnel')
    }
    return { open, port: address.port }
  },
  { cacheKey: (tunnel, target) => [tunnel, target] }
)

/** Opens (or reuses) the connection's SSH tunnel and points the string at its local end; a string without one comes back unchanged. */
export const tunneledConnectionString = async (
  connectionString: string,
  confirmHostKey: ConfirmHostKey
) => {
  const url = new SafeURL(connectionString)
  const tunnel = sshTunnelOf(url.searchParams)

  if (!tunnel) {
    return connectionString
  }

  const type = typeOfScheme(url.protocol.slice(0, -1))

  if (!type) {
    throw new Error(`Unsupported connection string scheme: ${url.protocol}`)
  }

  const target = {
    host: url.hostname,
    port: Number(url.port) || DEFAULT_PORTS[type],
  }
  const forward = await openForward(tunnel, target, confirmHostKey)
  await forward.open()
  deleteSshParams(url.searchParams)
  url.searchParams.set(SSH_TLS_HOST_PARAM, url.hostname)
  url.hostname = LOCAL_HOST
  url.port = String(forward.port)
  return url.toString()
}
