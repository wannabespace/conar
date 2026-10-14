import type { Duplex } from 'node:stream'
import { promisify } from 'node:util'

import { tryCatchAsync } from '@tamery/shared/utils'
import type { Client } from 'ssh2'

import { portOf, toConnectionParts } from '../connection-parts'
import type { Forwarding } from './forwarding'
import type { SshTunnel } from './params'
import type { ConfirmHostKey } from './session'
import { connectSsh } from './session'
import { tunnelSocket } from './socket'

interface Session {
  channel: (target: { host: string; port: number }) => Promise<Duplex>
  client: Promise<Client>
  connect: () => Promise<void>
}

const IDLE_TIMEOUT = 60_000

const sessions = new Map<string, Session>()

const openSession = (
  key: string,
  tunnel: SshTunnel,
  confirmHostKey: ConfirmHostKey
): Session => {
  const client = connectSsh(tunnel, confirmHostKey)
  let channels = 0
  let idleTimer: ReturnType<typeof setTimeout> | undefined

  const forget = () => {
    clearTimeout(idleTimer)
    if (sessions.get(key)?.client === client) {
      sessions.delete(key)
    }
  }
  const closeWhenIdle = () => {
    clearTimeout(idleTimer)
    if (channels === 0) {
      idleTimer = setTimeout(async () => {
        // Forgotten before the client ends, so a channel asked for meanwhile opens a new session instead of this closing one.
        forget()
        const { data: connected } = await tryCatchAsync(() => client)
        connected?.end()
      }, IDLE_TIMEOUT)
    }
  }
  const forgetOnClose = async () => {
    const { data: connected } = await tryCatchAsync(() => client)
    if (connected) {
      connected.once('close', forget)
    } else {
      forget()
    }
  }

  const session: Session = {
    channel: async (target) => {
      channels += 1
      clearTimeout(idleTimer)
      const release = () => {
        channels -= 1
        closeWhenIdle()
      }
      try {
        const connected = await client
        const channel = await promisify(connected.forwardOut.bind(connected))(
          '127.0.0.1',
          0,
          target.host,
          target.port
        )
        channel.once('close', release)
        return channel
      } catch (error) {
        release()
        throw error
      }
    },
    client,
    connect: async () => {
      await client
      closeWhenIdle()
    },
  }
  void forgetOnClose()
  sessions.set(key, session)
  return session
}

/** The string keeps the database's real host, so TLS verifies against it. */
export const tunnelForwarding = async (
  connectionString: string,
  confirmHostKey: ConfirmHostKey
): Promise<Forwarding | null> => {
  const parts = toConnectionParts(connectionString)
  const tunnel = parts.ssh
  if (!tunnel) {
    return null
  }
  if (!parts.type) {
    throw new Error('Unsupported connection string scheme')
  }
  const target = { host: parts.host, port: Number(portOf(parts)) }
  const key = JSON.stringify(tunnel)
  const session = () =>
    sessions.get(key) ?? openSession(key, tunnel, confirmHostKey)
  await session().connect()
  return { socket: () => tunnelSocket(session().channel(target)) }
}
