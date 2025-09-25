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

export function parseConnectionString(connectionString: string): Config {
  const parsed = new SafeURL(connectionString)

  const config: Config = {
    user: parsed.username || undefined,
    password: parsed.password || undefined,
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
    if (sslMode === 'disable' && hasMainSSLParams) {
      throw new Error('sslmode=disable cannot be used with SSL certificate parameters (sslcert, sslkey, sslrootcert, sslpassword, sslservername)')
    }

    if (sslMode && !hasMainSSLParams) {
      if (sslMode === 'disable') {
        return false
      }
      if (sslMode === 'no-verify') {
        return { rejectUnauthorized: false }
      }
      if (sslMode === 'verify') {
        return { rejectUnauthorized: true }
      }
    }

    const sslConfig: SSLConfig = {
      ...(sslMode && (
        ['prefer', 'no-verify'].includes(sslMode)
        || (sslMode === 'require' && !sslRootCert && !hasMainSSLParams)
      )
        ? {
            rejectUnauthorized: false,
          }
        : {}),
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
