export type SshAuthMethod = 'password' | 'key' | 'agent'

export interface SshConfig {
  host: string
  port: number
  user: string
  auth: SshAuthMethod
  password?: string
  privateKey?: string
  privateKeyPath?: string
  passphrase?: string
}

export const SSH_SECRET_PARAMS: readonly string[] = [
  'ssh_password',
  'ssh_private_key',
  'ssh_passphrase',
]

function parseAuth(value: string | null): SshAuthMethod {
  if (value === 'password' || value === 'key' || value === 'agent') {
    return value
  }
  return 'key'
}

export function parseSshConfig(searchParams: URLSearchParams): SshConfig | null {
  const host = searchParams.get('ssh_host')
  if (!host) {
    return null
  }

  const portStr = searchParams.get('ssh_port')
  const port = portStr ? Number.parseInt(portStr, 10) : 22

  return {
    host,
    port: Number.isFinite(port) ? port : 22,
    user: searchParams.get('ssh_user') ?? '',
    auth: parseAuth(searchParams.get('ssh_auth')),
    password: searchParams.get('ssh_password') ?? undefined,
    privateKey: searchParams.get('ssh_private_key') ?? undefined,
    privateKeyPath: searchParams.get('ssh_private_key_path') ?? undefined,
    passphrase: searchParams.get('ssh_passphrase') ?? undefined,
  }
}
