import { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { ConnectionParts } from './connection-parts'
import {
  CLICKHOUSE_HTTP_PORT_OF_NATIVE,
  connectionParts,
  DEFAULT_PORTS,
} from './connection-parts'
import { hostHintOf, hostKindOf, isLocalHost, TYPE_OF_PORT } from './hosts'
import {
  SSH_DESKTOP_ONLY,
  SSH_KEY_ERRORS,
  SSH_TUNNEL_ERROR,
} from './ssh/params'
import type { SslSetting } from './ssl/setting'
import { sslOptionsOf } from './ssl/setting'

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
  focus?:
    | 'password'
    | 'ssh.keyPath'
    | 'ssh.passphrase'
    | 'ssh.privateKey'
    | 'user'
  hint: string
  title: string
}

export interface DiagnosisContext {
  desktop: boolean
  message: string
  parts: ConnectionParts
}

const sslFix = (
  parts: ConnectionParts,
  setting: SslSetting,
  label: string
): Diagnosis['fix'] => {
  const options = sslOptionsOf(parts, setting)
  return options ? { label, patch: { options } } : undefined
}

const SUPABASE_IPV6_ONLY_HINT =
  "Supabase's direct host is IPv6-only. On an IPv4 network, paste the Session pooler string from Supabase → Connect."

const tunnelFix = ({ desktop, parts }: DiagnosisContext): Diagnosis['fix'] =>
  desktop && !parts.ssh
    ? { label: 'Set up an SSH tunnel', patch: { sshEnabled: true } }
    : undefined

const RULES: {
  match: RegExp
  diagnose: (context: DiagnosisContext) => Diagnosis
}[] = [
  {
    diagnose: () => ({
      focus: 'user',
      hint: 'The sign-in worked, but this user may not open that database. Grant it access, or pick another database or user.',
      title: "This user can't open that database",
    }),
    match:
      /access denied for user .+ to database|permission denied for database|does not have connect privilege/iu,
  },
  {
    diagnose: ({ message, parts }) => {
      const database = /database (?<quote>["'])(?<name>.+?)\k<quote>/iu.exec(
        message
      )?.groups?.name
      // Postgres reads an empty database as the user's name, which rarely exists either.
      const fallback = parts.type === ConnectionType.Postgres ? 'postgres' : ''
      return {
        fix:
          parts.database === fallback
            ? undefined
            : {
                label: 'Use the default database',
                patch: { database: fallback },
              },
        hint: 'Pick an existing database, or use the default one.',
        title: database
          ? `Database "${database}" doesn't exist`
          : "That database doesn't exist",
      }
    },
    match:
      /database "[^"]+" does not exist|unknown database|cannot open database|database '[^']+' does not exist|unknown_database/iu,
  },
  {
    diagnose: ({ message }) => {
      const user = /role "(?<name>[^"]+)" does not exist/iu.exec(message)
        ?.groups?.name
      return {
        focus: 'user',
        hint: 'Use a user that exists on this server. A fresh local Postgres usually has "postgres", or the name of the account that installed it.',
        title: user
          ? `User "${user}" doesn't exist`
          : "That user doesn't exist",
      }
    },
    match: /role "[^"]+" does not exist/iu,
  },
  {
    diagnose: () => ({
      focus: 'user',
      hint: "MySQL only lets this user in from other addresses. Create it for '%' or for your address, or connect from an allowed host.",
      title: "This user can't connect from your address",
    }),
    match: /host '[^']*' is not allowed to connect/iu,
  },
  {
    diagnose: () => ({
      focus: 'user',
      hint: "Supabase's pooler doesn't know this project: check the project ref in the user (postgres.<project-ref>), and that the project isn't paused.",
      title: "Supabase can't find this project",
    }),
    match: /tenant or user not found/iu,
  },
  {
    diagnose: ({ parts }) => {
      if (
        hostHintOf(parts.host)?.projectInUser?.test(parts.host) &&
        !parts.user.includes('.')
      ) {
        return {
          focus: 'user',
          hint: "Supabase's pooler needs the project in the user: postgres.<project-ref>, as in its Session pooler string.",
          title: 'Wrong user for the Supabase pooler',
        }
      }
      return parts.password
        ? {
            focus: 'password',
            hint: 'Check the user and password, and that this user may connect from your address.',
            title: 'Wrong user or password',
          }
        : {
            focus: 'password',
            hint: 'The connection has no password, and the server only lets this user in with one.',
            title: 'This server needs a password',
          }
    },
    // `client password must be a` is node-postgres refusing SCRAM without a password, before the server sees one.
    match:
      /password authentication failed|access denied for user|login failed for user|authentication failed|wrong password|invalid password|password is incorrect|no password supplied|password required|client password must be a/iu,
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
      fix: sslFix(parts, 'on', 'Turn on SSL'),
      hint: 'This MySQL user signs in with caching_sha2_password, which needs an encrypted connection the first time.',
      title: 'This sign-in needs SSL',
    }),
    match: /authentication requires secure connection/iu,
  },
  {
    diagnose: () => ({
      hint: "The server's pg_hba.conf has no rule for this address, user and database. Add one, or allow your IP in the provider's network settings.",
      title: "The server doesn't accept connections from here",
    }),
    match: /no pg_hba\.conf entry/iu,
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
      const { host, ssh } = context.parts
      if (ssh) {
        return {
          hint: `The SSH host looked up "${host}" and found nothing. Use the name or address the SSH host knows the database by.`,
          title: `The SSH host can't find "${host}"`,
        }
      }
      const kind = hostKindOf(host)
      if (kind === 'ipv6-only') {
        return {
          hint: SUPABASE_IPV6_ONLY_HINT,
          title: "This network can't reach Supabase's direct host",
        }
      }
      if (kind === 'service') {
        return {
          fix: { label: 'Use localhost', patch: { host: 'localhost' } },
          hint: `"${host}" looks like a Docker Compose service, which only resolves inside Docker. From this machine, connect to the port Docker publishes on localhost.`,
          title: `"${host}" isn't reachable from here`,
        }
      }
      if (kind === 'private') {
        return {
          fix: tunnelFix(context),
          hint: 'It only resolves inside a private network: connect through a bastion host, or over your VPN.',
          title: `"${host}" is a private name`,
        }
      }
      return {
        hint: `No DNS record for "${host}". Check the spelling.`,
        title: 'Host not found',
      }
    },
    match:
      /enotfound|eai_again|getaddrinfo|could not translate host name|name or service not known|name does not resolve|nodename nor servname/iu,
  },
  {
    diagnose: ({ parts }) => {
      const port = connectionParts.port(parts)
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
          hint: `${port} is the usual port for another engine. Check the engine and the port.`,
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
      /econnrefused|connection refused|actively refused|could not connect \(sequence\)|expected http|parse error/iu,
  },
  {
    diagnose: (context) => {
      const { host } = context.parts
      const provider = hostHintOf(host)?.label
      if (hostKindOf(host) === 'private') {
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
      hint:
        hostKindOf(context.parts.host) === 'ipv6-only'
          ? SUPABASE_IPV6_ONLY_HINT
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
      /too many connections|too many clients|remaining connection slots|too_many_connections|max_connections|max client connections reached/iu,
  },
  {
    diagnose: () => ({
      hint: 'The database is starting, shutting down or recovering. Wait a moment and test again.',
      title: "The database isn't ready",
    }),
    match:
      /the database system is (?:starting up|shutting down|in recovery mode)|server is (?:in )?shutdown/iu,
  },
  {
    diagnose: () => ({
      hint: 'Often an SSL mismatch: try turning SSL on or off. Also check that this port belongs to this engine.',
      title: 'The server closed the connection',
    }),
    match:
      /econnreset|socket hang up|connection terminated unexpectedly|server closed the connection unexpectedly/iu,
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

const sshKeyFieldOf = (
  hint: string,
  { ssh }: ConnectionParts
): Diagnosis['focus'] => {
  if (Object.values(SSH_KEY_ERRORS.passphrase).includes(hint)) {
    return 'ssh.passphrase'
  }
  if (Object.values(SSH_KEY_ERRORS.key).includes(hint)) {
    return ssh?.auth === 'keyPath' ? 'ssh.keyPath' : 'ssh.privateKey'
  }
  return undefined
}

export const diagnoseConnectionError = (
  context: DiagnosisContext
): Diagnosis | null => {
  if (context.message.startsWith(SSH_TUNNEL_ERROR)) {
    const hint = context.message.slice(SSH_TUNNEL_ERROR.length)
    const focus = sshKeyFieldOf(hint, context.parts)
    return {
      ...(focus && { focus }),
      hint,
      title: "Couldn't open the SSH tunnel",
    }
  }
  if (context.message === SSH_DESKTOP_ONLY) {
    return { hint: SSH_DESKTOP_ONLY, title: "Couldn't open the SSH tunnel" }
  }
  const { host, password } = context.parts
  const diagnosis =
    RULES.find(({ match }) => match.test(context.message))?.diagnose(context) ??
    null
  // Only a local server runs without a password (trust auth), so anywhere else an empty one fails next whatever this error is.
  if (!diagnosis || diagnosis.focus || password || isLocalHost(host)) {
    return diagnosis
  }
  return {
    ...diagnosis,
    focus: 'password',
    hint: `${diagnosis.hint} The password is empty too.`,
  }
}
