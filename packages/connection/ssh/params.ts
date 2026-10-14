export const SSH_AUTH_METHODS = ['agent', 'keyPath', 'key', 'password'] as const

export type SshAuth = (typeof SSH_AUTH_METHODS)[number]

export interface SshTunnel {
  auth: SshAuth
  host: string
  keyPath: string
  passphrase: string
  password: string
  port: string
  privateKey: string
  user: string
}

export const EMPTY_SSH_TUNNEL: SshTunnel = {
  auth: 'agent',
  host: '',
  keyPath: '',
  passphrase: '',
  password: '',
  port: '',
  privateKey: '',
  user: '',
}

export const DEFAULT_SSH_PORT = 22

export const SSH_DESKTOP_ONLY =
  'SSH tunnels run in the Tamery desktop app. Open this connection there.'

export const SSH_PARAMS = {
  auth: 'ssh_auth',
  host: 'ssh_host',
  keyPath: 'ssh_key_path',
  passphrase: 'ssh_passphrase',
  password: 'ssh_password',
  port: 'ssh_port',
  privateKey: 'ssh_key',
  user: 'ssh_user',
} as const satisfies Record<keyof SshTunnel, string>

export const sshTunnelOf = (
  searchParams: URLSearchParams
): SshTunnel | null => {
  const host = searchParams.get(SSH_PARAMS.host)

  if (!host) {
    return null
  }

  const auth = searchParams.get(SSH_PARAMS.auth)

  return {
    auth: SSH_AUTH_METHODS.find((method) => method === auth) ?? 'agent',
    host,
    keyPath: searchParams.get(SSH_PARAMS.keyPath) ?? '',
    passphrase: searchParams.get(SSH_PARAMS.passphrase) ?? '',
    password: searchParams.get(SSH_PARAMS.password) ?? '',
    port: searchParams.get(SSH_PARAMS.port) ?? '',
    privateKey: searchParams.get(SSH_PARAMS.privateKey) ?? '',
    user: searchParams.get(SSH_PARAMS.user) ?? '',
  }
}

export const deleteSshParams = (searchParams: URLSearchParams) => {
  for (const param of Object.values(SSH_PARAMS)) {
    searchParams.delete(param)
  }
}

export const AUTH_PARAMS: Record<SshAuth, (keyof SshTunnel)[]> = {
  agent: [],
  key: ['privateKey', 'passphrase'],
  keyPath: ['keyPath', 'passphrase'],
  password: ['password'],
}

export const setSshParams = (
  searchParams: URLSearchParams,
  tunnel: SshTunnel
) => {
  for (const key of [
    'host',
    'auth',
    'port',
    'user',
    ...AUTH_PARAMS[tunnel.auth],
  ] as const) {
    if (tunnel[key]) {
      searchParams.set(SSH_PARAMS[key], tunnel[key])
    }
  }
}
