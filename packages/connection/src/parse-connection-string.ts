// Inspired by https://github.com/brianc/node-postgres/blob/master/packages/pg-connection-string/index.js
import { SafeURL } from '@conar/shared/utils/safe-url'

export type SSLConfig = {
  rejectUnauthorized?: boolean
  cert?: string
  key?: string
  ca?: string
  passphrase?: string
  servername?: string
} | boolean

export interface Config {
  user?: string
  password?: string
  host?: string
  port?: number
  database?: string
  ssl?: SSLConfig
}

function encodeConnectionString(connectionString: string): string {
  let encodedConnectionString = connectionString
  const atIndex = connectionString.lastIndexOf('@')
  if (atIndex > 0) {
    const beforeAt = connectionString.substring(0, atIndex)
    const afterAt = connectionString.substring(atIndex + 1)
    const authMatch = beforeAt.match(/^([^:]+):\/\/([^:]+):(.+)$/)
    if (authMatch) {
      const [, protocol, user, password] = authMatch
      let processedPassword = password
      if (password.includes('%')) {
        processedPassword = decodeURIComponent(password)
        processedPassword = encodeURIComponent(processedPassword)
      }
      else if (/[#@]/.test(password)) {
        processedPassword = encodeURIComponent(password)
      }
      const encodedPassword = processedPassword
      encodedConnectionString = `${protocol}://${user}:${encodedPassword}@${afterAt}`
    }
  }
  return encodedConnectionString
}

export function parseConnectionString(connectionString: string): Config {
  const encodedConnectionString = encodeConnectionString(connectionString)
  const parsed = new SafeURL(encodedConnectionString)

  const config: Config = {
    user: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    host: parsed.hostname,
    port: parsed.port ? Number.parseInt(parsed.port, 10) : undefined,
    database: parsed.pathname && parsed.pathname !== '/' ? parsed.pathname.slice(1) : undefined,
  }

  const ssl = parseSSLConfig(parsed.searchParams)

  return {
    ...config,
    ...(ssl !== undefined && ssl !== null ? { ssl } : {}),
  }
}

export function parseSSLConfig(searchParams: URLSearchParams): Config['ssl'] {
  const sslMode = searchParams.get('sslmode')
  const ssl = searchParams.get('ssl')
  const sslCert = searchParams.get('sslcert')
  const sslKey = searchParams.get('sslkey')
  const sslRootCert = searchParams.get('sslrootcert')
  const sslPassword = searchParams.get('sslpassword')
  const sslServername = searchParams.get('sslservername')

  const hasMainSSLParams = sslCert || sslKey || sslRootCert || sslPassword || sslServername

  if (sslMode || hasMainSSLParams) {
    const validSSLModes = ['disable', 'prefer', 'require', 'verify', 'verify-ca', 'verify-full', 'no-verify']
    if (sslMode && !validSSLModes.includes(sslMode)) {
      throw new Error(`Invalid sslmode value: ${sslMode}. Valid values are: ${validSSLModes.join(', ')}`)
    }

    if (sslMode === 'verify' && !sslRootCert) {
      throw new Error('sslmode=verify requires sslrootcert to be provided')
    }

    if (sslMode === 'verify-ca' && !sslRootCert) {
      throw new Error('sslmode=verify-ca requires sslrootcert to be provided')
    }

    if (sslMode === 'verify-full' && !sslRootCert) {
      throw new Error('sslmode=verify-full requires sslrootcert to be provided')
    }

    if (sslMode === 'disable' && hasMainSSLParams) {
      throw new Error('sslmode=disable cannot be used with SSL certificate parameters (sslcert, sslkey, sslrootcert, sslpassword, sslservername)')
    }

    if (sslMode && !hasMainSSLParams) {
      if (sslMode === 'disable') {
        return false
      }
      if (['prefer', 'require'].includes(sslMode)) {
        return true
      }
      if (sslMode === 'no-verify') {
        return { rejectUnauthorized: false }
      }
      if (sslMode === 'verify') {
        return { rejectUnauthorized: true }
      }
    }

    const sslConfig: SSLConfig = {
      ...(sslMode && (['prefer', 'no-verify'].includes(sslMode) || (sslMode === 'require' && !sslRootCert && !hasMainSSLParams)) ? { rejectUnauthorized: false } : {}),
      ...(sslCert ? { cert: sslCert } : {}),
      ...(sslKey ? { key: sslKey } : {}),
      ...(sslRootCert ? { ca: sslRootCert } : {}),
      ...(sslPassword ? { passphrase: sslPassword } : {}),
      ...(sslServername ? { servername: sslServername } : {}),
    }

    return sslConfig
  }

  if (ssl === '1' || ssl?.toLowerCase() === 'true') {
    return true
  }
  if (ssl === '0' || ssl?.toLowerCase() === 'false') {
    return false
  }
}
