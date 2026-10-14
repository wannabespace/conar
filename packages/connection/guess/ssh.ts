import { isLocalHost } from '../hosts'
import type { SshTunnel } from '../ssh/params'
import { EMPTY_SSH_TUNNEL } from '../ssh/params'
import { shellTokens } from './tokens'
import type { GuessedParts } from './types'

interface Forward {
  host: string
  localPort: string
  port: string
}

const PRIVATE_KEY =
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/u
const FLAGS_WITH_VALUE = new Set('BbcDEeFIiJLlmOoPpQRSWw')
const FLAG_OF_OPTION: Record<string, string> = {
  identityfile: 'i',
  port: 'p',
  user: 'l',
}
const OPTION = /^(?<key>\w+)[=\s]+(?<value>.*)$/su
const PORT = /^\d+$/u
const DESTINATION =
  /^(?:ssh:\/\/)?(?:(?<user>[^@]*)@)?(?<host>[^:@]+)(?::(?<port>\d+))?$/u

const applyFlag = (
  tunnel: SshTunnel,
  forwards: Forward[],
  flag: string,
  value: string
) => {
  if (flag === 'o') {
    const { key = '', value: optionValue = '' } =
      OPTION.exec(value)?.groups ?? {}
    applyFlag(
      tunnel,
      forwards,
      FLAG_OF_OPTION[key.toLowerCase()] ?? '',
      optionValue
    )
  } else if (flag === 'L') {
    const [localPort = '', host = '', port = ''] = value.split(':').slice(-3)
    if (host && PORT.test(localPort) && PORT.test(port)) {
      forwards.push({ host, localPort, port })
    }
  } else if (flag === 'i') {
    tunnel.auth = 'keyPath'
    tunnel.keyPath = value
  } else if (flag === 'l') {
    tunnel.user = value
  } else if (flag === 'p') {
    tunnel.port = value
  }
}

const sshCommandOf = (tokens: string[]) => {
  const start = tokens.findIndex((token) => token.split('/').at(-1) === 'ssh')
  if (start === -1) {
    return null
  }
  const tunnel = { ...EMPTY_SSH_TUNNEL }
  const forwards: Forward[] = []
  let destination = ''
  const args = tokens.slice(start + 1)
  while (args.length > 0) {
    const arg = args.shift() ?? ''
    if (!arg.startsWith('-')) {
      if (destination) {
        break
      }
      destination = arg
      continue
    }
    const flagAt = [...arg].findIndex(
      (char, index) => index > 0 && FLAGS_WITH_VALUE.has(char)
    )
    if (flagAt > 0) {
      applyFlag(
        tunnel,
        forwards,
        arg.charAt(flagAt),
        arg.slice(flagAt + 1) || (args.shift() ?? '')
      )
    }
  }
  const {
    host = '',
    port = '',
    user = '',
  } = DESTINATION.exec(destination)?.groups ?? {}
  if (!host && forwards.length === 0) {
    return null
  }
  return {
    forwards,
    tunnel: {
      ...tunnel,
      host,
      port: port || tunnel.port,
      user: user || tunnel.user,
    },
  }
}

export const guessSsh = (
  text: string
): { forwards: Forward[]; rest: string; tunnel: SshTunnel | null } => {
  const privateKey = PRIVATE_KEY.exec(text)?.[0] ?? ''
  const lines = text.replace(PRIVATE_KEY, '').split('\n')
  const commands = lines.map((line) => sshCommandOf(shellTokens(line)))
  const commandAt = commands.findIndex(Boolean)
  const command = commands[commandAt]
  const tunnel = command?.tunnel ?? (privateKey ? EMPTY_SSH_TUNNEL : null)

  return {
    forwards: command?.forwards ?? [],
    rest: lines.filter((_, index) => index !== commandAt).join('\n'),
    tunnel:
      tunnel && privateKey ? { ...tunnel, auth: 'key', privateKey } : tunnel,
  }
}

/** Tamery opens the tunnel itself, so a database on a forward's local port is the forward's remote target. */
export const throughForwards = (
  parts: GuessedParts,
  forwards: Forward[]
): GuessedParts => {
  const isTunnelled = !parts.host || isLocalHost(parts.host)
  const forward = isTunnelled
    ? forwards.find(
        (candidate) =>
          !parts.host || !parts.port || candidate.localPort === parts.port
      )
    : undefined
  return forward ? { ...parts, host: forward.host, port: forward.port } : parts
}
