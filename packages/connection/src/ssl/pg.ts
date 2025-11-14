import type { PoolOptions } from 'pg'

export function parseSSLConfig(searchParams: URLSearchParams): PoolOptions['ssl'] {
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

    const sslConfig: NonNullable<PoolOptions['ssl']> = {
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
