import { once } from 'node:events'
import { readFile } from 'node:fs/promises'
import { homedir, userInfo } from 'node:os'

import { noop, silently, toError } from '@tamery/shared/utils'
import { Result } from 'better-result'
import type { Client, ConnectConfig } from 'ssh2'

import type { HostKeyStatus } from './known-hosts'
import { knownHosts } from './known-hosts'
import type { SshTunnel } from './params'
import { DEFAULT_SSH_PORT, SSH_AUTH_ERRORS, SSH_TUNNEL_ERROR } from './params'

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
  // ssh2 tries to decrypt with an empty passphrase rather than report the key as encrypted.
  const passphrase = tunnel.passphrase || undefined
  if (tunnel.auth === 'password') {
    if (!tunnel.password) {
      throw tunnelError(SSH_AUTH_ERRORS.passwordMissing)
    }
    return { password: tunnel.password }
  }
  if (tunnel.auth === 'key') {
    if (!tunnel.privateKey) {
      throw tunnelError(SSH_AUTH_ERRORS.privateKeyMissing)
    }
    return { passphrase, privateKey: tunnel.privateKey }
  }
  if (tunnel.auth === 'keyPath') {
    const keyPath = tunnel.keyPath || sshConfig('IdentityFile')
    if (!keyPath) {
      throw tunnelError(SSH_AUTH_ERRORS.noKeyFile)
    }
    const privateKey = await Result.tryPromise(() =>
      readFile(expandHome(keyPath))
    )
    if (privateKey.isErr()) {
      throw tunnelError(SSH_AUTH_ERRORS.keyFileMissing)
    }
    return { passphrase, privateKey: privateKey.value }
  }
  const agent = sshConfig('IdentityAgent') ?? process.env.SSH_AUTH_SOCK
  if (!agent) {
    throw tunnelError(AGENT_UNAVAILABLE)
  }
  return { agent: expandHome(agent) }
}

const sshErrorMessage = (
  error: Error & { code?: string; level?: string },
  auth: ConnectConfig
) => {
  if (error.level === 'client-authentication') {
    return 'agent' in auth
      ? 'SSH authentication failed: the host accepted no key from your ssh-agent. Add yours with ssh-add, or pick another sign-in method.'
      : 'SSH authentication failed. Check the SSH user and credentials.'
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

// ssh2 names the passphrase in both its "no passphrase given" and "bad passphrase?" parse errors, and in nothing else.
const unreadableKey = ({ auth, passphrase }: SshTunnel, error: Error) => {
  if (!/passphrase/iu.test(error.message)) {
    return auth === 'keyPath'
      ? SSH_AUTH_ERRORS.keyFileNotAKey
      : SSH_AUTH_ERRORS.notAKey
  }
  return passphrase
    ? SSH_AUTH_ERRORS.passphraseWrong
    : SSH_AUTH_ERRORS.passphraseNeeded
}

const trusting = new Map<string, Promise<boolean>>()

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
  const userConfig = await Result.tryPromise(() =>
    readFile(expandHome('~/.ssh/config'), 'utf-8')
  )
  // OpenSSH keywords are case-insensitive, and `Match exec` runs through spawnSync, which would freeze the desktop main process.
  const computed = parse(userConfig.unwrapOr('')).compute(tunnel.host, {
    ignoreCase: true,
    matchExec: false,
  })
  const sshConfig = (key: string): string | undefined =>
    [computed[key.toLowerCase()]].flat()[0]
  const host = sshConfig('HostName') ?? tunnel.host
  const port = Number(tunnel.port || sshConfig('Port') || DEFAULT_SSH_PORT)
  const hostKeyName = knownHosts.getName({
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
        hashed: sshConfig('HashKnownHosts')?.toLowerCase() === 'yes',
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
    const checked = await Result.tryPromise(() => isTrusted(key))
    const trusted = checked.unwrapOr(false)
    if (trusted) {
      verifiedKey = key
    }
    if (!closed) {
      verify(trusted)
    }
  }

  // ssh2 emits only `close`, never `error`, when the host hangs up after its banner (sshd's LoginGraceTime while the host-key prompt is open).
  const hungUp = async () => {
    await once(client, 'close')
    throw new Error('the SSH host closed the connection')
  }
  // `connect` throws synchronously for a key it cannot parse; arming the timer or the race before it leaves an unawaited rejection that crashes the desktop main process.
  const connecting = Result.try(() =>
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
  )
  if (connecting.isErr()) {
    const configError = toError(connecting.error.cause)
    client.end()
    throw tunnelError(
      'privateKey' in auth
        ? unreadableKey(tunnel, configError)
        : sshErrorMessage(configError, auth)
    )
  }
  const ready = Promise.race([once(client, 'ready'), hungUp()])
  startReadyTimer()
  const readied = await Result.tryPromise(() => ready)
  clearTimeout(readyTimer)
  if (readied.isErr()) {
    client.end()
    throw tunnelError(
      refusal ?? sshErrorMessage(toError(readied.error.cause), auth)
    )
  }
  return client
}
