import { once } from 'node:events'
import { readFile } from 'node:fs/promises'
import { homedir, userInfo } from 'node:os'

import { noop, silently, tryCatchAsync } from '@tamery/shared/utils'
import type { Client, ConnectConfig } from 'ssh2'

import type { HostKeyStatus } from './known-hosts'
import { knownHosts } from './known-hosts'
import type { SshTunnel } from './params'
import { DEFAULT_SSH_PORT, SSH_TUNNEL_ERROR } from './params'

export type ConfirmHostKey = (prompt: {
  fingerprint: string
  host: string
  keyType: string
}) => Promise<boolean>

const READY_TIMEOUT = 20_000
const AGENT_UNAVAILABLE =
  'SSH agent not available. Start ssh-agent or pick another method.'

// Worded without the host and user: ~/.ssh/config resolves them, and these messages reach the AI diagnosis, which redacts only what the form holds.
const HOST_KEY_REFUSALS: Record<Exclude<HostKeyStatus, 'known'>, string> = {
  changed:
    "The SSH host presented a key that doesn't match known_hosts, so someone may be impersonating it. If its key changed on purpose, remove the old entry from ~/.ssh/known_hosts (or /etc/ssh/ssh_known_hosts) and connect again.",
  revoked: "The SSH host's key is revoked in known_hosts",
  unknown: "The SSH host's key wasn't trusted",
}

const expandHome = (path: string) => path.replace(/^~(?=$|\/)/u, homedir())

const tunnelError = (message: string) =>
  new Error(`${SSH_TUNNEL_ERROR}${message}`)

const authConfig = async (
  tunnel: SshTunnel,
  sshConfig: (key: string) => string | undefined
): Promise<ConnectConfig> => {
  if (tunnel.auth === 'password') {
    if (!tunnel.password) {
      throw tunnelError("The SSH password isn't stored on this device")
    }
    return { password: tunnel.password }
  }
  if (tunnel.auth === 'key') {
    if (!tunnel.privateKey) {
      throw tunnelError("The SSH private key isn't stored on this device")
    }
    return { passphrase: tunnel.passphrase, privateKey: tunnel.privateKey }
  }
  if (tunnel.auth === 'keyPath') {
    const keyPath = tunnel.keyPath || sshConfig('IdentityFile') || ''
    const { data: privateKey } = await tryCatchAsync(() =>
      readFile(expandHome(keyPath))
    )
    if (!privateKey) {
      throw tunnelError("The SSH key file wasn't found. Check its path.")
    }
    return { passphrase: tunnel.passphrase, privateKey }
  }
  const agent = sshConfig('IdentityAgent') ?? process.env.SSH_AUTH_SOCK
  if (!agent) {
    throw tunnelError(AGENT_UNAVAILABLE)
  }
  return { agent: expandHome(agent) }
}

const sshErrorMessage = (error: Error & { code?: string; level?: string }) => {
  if (error.level === 'client-authentication') {
    return 'SSH authentication failed. Check the SSH user and credentials.'
  }
  if (error.level === 'agent') {
    return AGENT_UNAVAILABLE
  }
  if (error.level === 'client-timeout' || error.code === 'ETIMEDOUT') {
    return 'Timed out reaching the SSH host'
  }
  if (error.level === 'client-socket') {
    return `Can't reach the SSH host: ${error.code ?? 'connection failed'}`
  }
  return `SSH connection failed: ${error.message}`
}

const trusting = new Map<string, Promise<boolean>>()

/** One prompt and one known_hosts line per host key, however many sessions reach the host at once. */
const trustOnce = (
  name: string,
  key: Buffer,
  {
    confirm,
    hashed,
    isLive,
  }: { confirm: ConfirmHostKey; hashed: boolean; isLive: () => boolean }
) => {
  const id = `${name} ${key.toString('base64')}`
  const pending = trusting.get(id)
  if (pending) {
    return pending
  }
  const trusted = (async () => {
    try {
      const confirmed = await confirm({
        host: name,
        ...knownHosts.describe(key),
      })
      if (confirmed && isLive()) {
        // A read-only known_hosts (a home-manager symlink) only costs the next prompt, like OpenSSH: the user approved this connection.
        await silently(() => knownHosts.trust(name, key, { hashed }))
      }
      return confirmed
    } finally {
      trusting.delete(id)
    }
  })()
  trusting.set(id, trusted)
  return trusted
}

export const connectSsh = async (
  tunnel: SshTunnel,
  confirmHostKey: ConfirmHostKey
): Promise<Client> => {
  const { parse } = await import('ssh-config')
  const { data: userConfig } = await tryCatchAsync(() =>
    readFile(expandHome('~/.ssh/config'), 'utf-8')
  )
  const computed = parse(userConfig ?? '').compute(tunnel.host)
  const sshConfig = (key: string): string | undefined =>
    [computed[key]].flat()[0]
  const host = sshConfig('HostName') ?? tunnel.host
  const port = Number(tunnel.port || sshConfig('Port') || DEFAULT_SSH_PORT)
  const hostKeyName = knownHosts.nameOf({
    alias: sshConfig('HostKeyAlias'),
    host,
    port,
  })
  const auth = await authConfig(tunnel, sshConfig)
  const known = await knownHosts.read()
  const listedAlgorithms = knownHosts.listedAlgorithms(known, hostKeyName)
  const { Client: SshClient } = await import('ssh2')
  const client = new SshClient().on('error', noop)
  let closed = false
  client.once('close', () => {
    closed = true
  })
  let refusal: string | undefined
  let verifiedKey: Buffer | undefined
  let readyTimer: ReturnType<typeof setTimeout> | undefined
  const startReadyTimer = () => {
    readyTimer = setTimeout(() => {
      client.emit(
        'error',
        Object.assign(new Error('Timed out while waiting for handshake'), {
          level: 'client-timeout',
        })
      )
      client.end()
    }, READY_TIMEOUT)
  }

  const isTrusted = async (key: Buffer) => {
    // ssh2 verifies again on every rekey: the same key passes without a second prompt, and another one fails like OpenSSH's "host key changed during rekey".
    if (verifiedKey) {
      return verifiedKey.equals(key)
    }
    const status = knownHosts.check(known, hostKeyName, key)
    if (status === 'known') {
      return true
    }
    if (status === 'unknown') {
      clearTimeout(readyTimer)
      const trusted = await trustOnce(hostKeyName, key, {
        confirm: confirmHostKey,
        hashed: sshConfig('HashKnownHosts') === 'yes',
        isLive: () => !closed,
      })
      if (!closed) {
        startReadyTimer()
      }
      if (trusted) {
        return true
      }
    }
    refusal = HOST_KEY_REFUSALS[status]
    return false
  }
  const verifyHostKey = async (
    key: Buffer,
    verify: (valid: boolean) => void
  ) => {
    const { data: trusted } = await tryCatchAsync(() => isTrusted(key))
    if (trusted) {
      verifiedKey = key
    }
    if (!closed) {
      verify(!!trusted)
    }
  }

  // ssh2 emits only `close`, never `error`, when the host hangs up after its banner (sshd's LoginGraceTime while the host-key prompt is open).
  const hungUp = async () => {
    await once(client, 'close')
    throw new Error('the SSH host closed the connection')
  }
  const ready = Promise.race([once(client, 'ready'), hungUp()])
  startReadyTimer()
  client.connect({
    ...auth,
    algorithms: { serverHostKey: listedAlgorithms },
    host,
    // Returns undefined on purpose: ssh2 takes any other return value, a promise included, as the verdict.
    hostVerifier: (key: Buffer, verify: (valid: boolean) => void) => {
      void verifyHostKey(key, verify)
    },
    keepaliveInterval: 10_000,
    port,
    // Replaced by `readyTimer`, which stops while the host-key prompt is open.
    readyTimeout: 0,
    username: tunnel.user || sshConfig('User') || userInfo().username,
  })
  const { error } = await tryCatchAsync(() => ready)
  clearTimeout(readyTimer)
  if (error) {
    client.end()
    throw tunnelError(refusal ?? sshErrorMessage(error))
  }
  return client
}
