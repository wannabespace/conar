import { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { ConnectionParts } from './connection-parts'
import { DEFAULT_PORTS } from './connection-parts'
import { isIpv6OnlyHost } from './guess/fixes'
import { hostHintOf, isLocalHost, TYPE_OF_PORT } from './guess/hosts'

export interface ConnectionPatch {
  database?: string
  host?: string
  options?: string
  port?: string
  sshEnabled?: boolean
  type?: ConnectionType
}

export interface Diagnosis {
  fix?: { label: string; patch: ConnectionPatch }
  /** The field the user has to correct by hand. */
  focus?: 'password' | 'user'
  hint: string
  title: string
}

interface Context {
  desktop: boolean
  message: string
  parts: ConnectionParts
}

type SslSetting = 'off' | 'on' | 'unverified'

/** Driver options that set SSL, per engine; sync with `ssl/*.ts`. */
const SSL_OPTIONS: Partial<
  Record<ConnectionType, Partial<Record<SslSetting, [string, string]>>>
> = {
  [ConnectionType.MSSQL]: {
    off: ['encrypt', 'false'],
    on: ['encrypt', 'true'],
    unverified: ['trustServerCertificate', 'true'],
  },
  [ConnectionType.MySQL]: { off: ['ssl', 'false'], on: ['ssl', 'true'] },
  [ConnectionType.Postgres]: {
    off: ['sslmode', 'disable'],
    on: ['sslmode', 'require'],
    unverified: ['sslmode', 'no-verify'],
  },
}

const CLICKHOUSE_HTTP_PORT_OF_NATIVE: Record<string, string> = {
  9000: '8123',
  9440: '8443',
}
const PRIVATE_IPV4 =
  /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/u
const PRIVATE_NAME =
  /\.(?:internal|local|lan|svc|cluster\.local|corp|intranet)$/iu
const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/u
const ANY_IPV4 = /\b\d{1,3}(?:\.\d{1,3}){3}\b/gu

const sslFix = (
  { options, type }: ConnectionParts,
  setting: SslSetting,
  label: string
): Diagnosis['fix'] => {
  const option = type ? SSL_OPTIONS[type]?.[setting] : undefined
  if (!option) {
    return undefined
  }
  const params = new URLSearchParams(options)
  params.set(...option)
  return { label, patch: { options: params.toString() } }
}

const isPrivateHost = (host: string) =>
  PRIVATE_IPV4.test(host) || PRIVATE_NAME.test(host)

/** `db` or `postgres` with no dot: a Docker Compose service, which only resolves inside the compose network. */
const isServiceName = (host: string) =>
  !host.includes('.') &&
  !isLocalHost(host) &&
  !IPV4.test(host) &&
  !host.includes(':')

const tunnelFix = ({ desktop, parts }: Context): Diagnosis['fix'] =>
  desktop && !parts.ssh
    ? { label: 'Set up an SSH tunnel', patch: { sshEnabled: true } }
    : undefined

const RULES: { match: RegExp; diagnose: (context: Context) => Diagnosis }[] = [
  {
    diagnose: ({ parts }) =>
      /\.pooler\.supabase\.com$/iu.test(parts.host) && !parts.user.includes('.')
        ? {
            focus: 'user',
            hint: "Supabase's pooler needs the project in the user: postgres.<project-ref>, as in its Session pooler string.",
            title: 'Wrong user for the Supabase pooler',
          }
        : {
            focus: 'password',
            hint: parts.password
              ? 'Check the user and password, and that this user may connect from your address.'
              : 'The password is empty — enter it.',
            title: 'Wrong user or password',
          },
    match:
      /password authentication failed|access denied for user|login failed for user|authentication failed|wrong password|invalid password|password is incorrect|no password supplied/iu,
  },
  {
    diagnose: ({ message }) => {
      const name =
        /database "(?<name>[^"]+)"|database '(?<quoted>[^']+)'/iu.exec(
          message
        )?.groups
      const database = name?.name ?? name?.quoted
      return {
        fix: { label: 'Use the default database', patch: { database: '' } },
        hint: 'Pick an existing database, or leave Database empty to use the default one.',
        title: database
          ? `Database "${database}" doesn't exist`
          : "That database doesn't exist",
      }
    },
    match:
      /database "[^"]+" does not exist|unknown database|cannot open database|database '[^']+' does not exist|unknown_database/iu,
  },
  {
    diagnose: ({ parts }) => ({
      fix: sslFix(parts, 'on', 'Turn on SSL'),
      hint: 'The server only accepts encrypted connections.',
      title: 'The server requires SSL',
    }),
    match:
      /no pg_hba\.conf entry.*(?:no encryption|ssl off)|ssl connection is required|requires? (?:an )?ssl|insecure transport are prohibited|ssl required|sslmode value "require" invalid/iu,
  },
  {
    diagnose: ({ parts }) => ({
      fix: sslFix(parts, 'off', 'Turn off SSL'),
      hint: "The server doesn't speak SSL. Only turn it off on a network you trust.",
      title: "The server doesn't support SSL",
    }),
    match:
      /does not support ssl|ssl is not enabled on the server|wrong version number|handshake_ssl_error|ssl3_get_record/iu,
  },
  {
    diagnose: ({ parts }) => ({
      fix: sslFix(parts, 'unverified', 'Skip the certificate check'),
      hint: "The server's certificate isn't signed by an authority this device trusts, or names another host. The connection stays encrypted without the check.",
      title: "Couldn't verify the server's certificate",
    }),
    match:
      /self[- ]signed certificate|unable to verify the first certificate|unable to get (?:local )?issuer certificate|certificate has expired|hostname\/ip does not match|altnames|depth_zero_self_signed/iu,
  },
  {
    diagnose: (context) => {
      const { host } = context.parts
      if (isIpv6OnlyHost(host)) {
        return {
          hint: "Supabase's direct host is IPv6-only. On an IPv4 network, paste the Session pooler string from Supabase → Connect.",
          title: "This network can't reach Supabase's direct host",
        }
      }
      if (isServiceName(host)) {
        return {
          fix: { label: 'Use localhost', patch: { host: 'localhost' } },
          hint: `"${host}" looks like a Docker Compose service, which only resolves inside Docker. From this machine, connect to the port Docker publishes on localhost.`,
          title: `"${host}" isn't reachable from here`,
        }
      }
      if (isPrivateHost(host)) {
        return {
          fix: tunnelFix(context),
          hint: 'It only resolves inside a private network: connect through a bastion host, or over your VPN.',
          title: `"${host}" is a private name`,
        }
      }
      return {
        hint: `No DNS record for "${host}" — check the spelling.`,
        title: 'Host not found',
      }
    },
    match:
      /enotfound|eai_again|getaddrinfo|could not translate host name|name or service not known|nodename nor servname/iu,
  },
  {
    diagnose: ({ parts }) => {
      const port =
        parts.port || (parts.type ? String(DEFAULT_PORTS[parts.type]) : '')
      const clickHousePort = CLICKHOUSE_HTTP_PORT_OF_NATIVE[port]
      if (parts.type === ConnectionType.ClickHouse && clickHousePort) {
        return {
          fix: {
            label: `Use port ${clickHousePort}`,
            patch: { port: clickHousePort },
          },
          hint: `${port} is ClickHouse's native protocol; Tamery talks to its HTTP interface.`,
          title: "That's ClickHouse's native port",
        }
      }
      const portType = TYPE_OF_PORT[port]
      if (
        portType &&
        parts.type &&
        portType !== parts.type &&
        port === String(DEFAULT_PORTS[portType])
      ) {
        return {
          fix: { label: 'Switch the engine', patch: { type: portType } },
          hint: `${port} is the usual port for another engine — check the engine and the port.`,
          title: 'Wrong engine for this port?',
        }
      }
      return isLocalHost(parts.host)
        ? {
            hint: `Nothing answers on port ${port}. Start the database, or with Docker, use the port it publishes (the left side of "${port}:${port}").`,
            title: "The database isn't running here",
          }
        : {
            hint: `Port ${port} refused the connection: check the port, and that the server listens on outside addresses (listen_addresses, bind-address).`,
            title: 'Connection refused',
          }
    },
    match:
      /econnrefused|connection refused|actively refused|expected http|parse error/iu,
  },
  {
    diagnose: (context) => {
      const { host } = context.parts
      const provider = hostHintOf(host)?.label
      if (isPrivateHost(host)) {
        return {
          fix: tunnelFix(context),
          hint: 'That address is on a private network: connect through a bastion host, or over your VPN.',
          title: "The server didn't answer",
        }
      }
      return {
        hint: provider
          ? `Allow your IP address in ${provider}'s network settings (firewall, security group or allowlist).`
          : "A firewall is probably dropping the connection, or the server's allowlist doesn't include your IP address.",
        title: "The server didn't answer",
      }
    },
    match: /etimedout|timed? ?out|esockettimedout/iu,
  },
  {
    diagnose: (context) => ({
      fix: tunnelFix(context),
      hint: isIpv6OnlyHost(context.parts.host)
        ? "Supabase's direct host is IPv6-only. On an IPv4 network, paste the Session pooler string from Supabase → Connect."
        : 'No network route to that address: it may be IPv6-only, or need your VPN.',
      title: "This network can't reach the server",
    }),
    match: /enetunreach|ehostunreach|no route to host/iu,
  },
  {
    diagnose: () => ({
      hint: "Close idle sessions, or connect through the provider's pooler in session mode.",
      title: 'The server is out of connections',
    }),
    match:
      /too many connections|remaining connection slots|too_many_connections|max_connections/iu,
  },
  {
    diagnose: () => ({
      hint: "The server asked for an authentication method the driver can't use. Create the user with mysql_native_password, or update the server's auth plugin.",
      title: 'Unsupported sign-in method',
    }),
    match:
      /auth_switch_plugin_error|client does not support authentication protocol|auth_gssapi|unknown authentication plugin/iu,
  },
]

/** Explains a failed connection test from the driver's message, with a one-click fix where the cause is unambiguous. */
export const diagnoseConnectionError = (context: Context): Diagnosis | null =>
  RULES.find(({ match }) => match.test(context.message))?.diagnose(context) ??
  null

/** Strips the values that identify the user's server, and any IP address (Postgres names the client's own), from an error before it leaves the device. */
export const redactConnectionError = (
  message: string,
  parts: ConnectionParts
) => {
  const secrets: [string | undefined, string][] = [
    [parts.password, '<password>'],
    [parts.ssh?.host, '<ssh-host>'],
    [parts.host, '<host>'],
    [parts.user, '<user>'],
    [parts.ssh?.user, '<ssh-user>'],
    [parts.database, '<database>'],
  ]
  let redacted = message
  for (const [value, placeholder] of secrets
    .filter(
      (entry): entry is [string, string] => !!entry[0] && entry[0].length > 1
    )
    .toSorted(([a], [b]) => b.length - a.length)) {
    redacted = redacted.replaceAll(value, placeholder)
  }
  return redacted.replaceAll(ANY_IPV4, '<ip>')
}

const hostKindOf = (host: string) => {
  if (isLocalHost(host)) {
    return 'localhost'
  }
  if (isServiceName(host)) {
    return 'single-label name (Docker service?)'
  }
  if (isPrivateHost(host)) {
    return 'private network'
  }
  const provider = hostHintOf(host)?.label
  return provider
    ? `${provider}${isIpv6OnlyHost(host) ? ' direct host (IPv6-only)' : ''}`
    : 'public host'
}

const SECRET_OPTION = /pass|key|cert|secret|token|credential/iu
const MAX_OPTION_VALUE = 40

/** What an AI request about a failed connection may carry: no address, user, database or secret. */
export const diagnosisRequestOf = ({ desktop, message, parts }: Context) => ({
  // Sync with `error: 'string <= 4000'` in packages/ai/features/diagnose-connection.ts: a longer error fails the request.
  error: redactConnectionError(message, parts).slice(0, 4000),
  hostKind: hostKindOf(parts.host),
  options: new URLSearchParams(
    [...new URLSearchParams(parts.options)].map(([key, value]) => [
      key,
      SECRET_OPTION.test(key) || value.length > MAX_OPTION_VALUE
        ? '<redacted>'
        : value,
    ])
  ).toString(),
  passwordSet: !!parts.password,
  port: parts.port || (parts.type ? String(DEFAULT_PORTS[parts.type]) : ''),
  runtime: desktop ? ('desktop' as const) : ('web' as const),
  sshEnabled: !!parts.ssh,
  userSet: !!parts.user,
})
