import type { PoolOptions } from 'pg'

export const defaultSSLConfig: PoolOptions['ssl'] = {
  rejectUnauthorized: false,
}

const SSL_MODES_WITHOUT_VERIFY = new Set(['prefer', 'no-verify'])

const buildCertificateSslConfig = (
  searchParams: URLSearchParams,
  sslMode: string | null,
  hasMainSSLParams: boolean
): NonNullable<PoolOptions['ssl']> => {
  const sslCert = searchParams.get('sslcert')
  const sslKey = searchParams.get('sslkey')
  const sslRootCert = searchParams.get('sslrootcert')
  const sslPassword = searchParams.get('sslpassword')
  const sslServername = searchParams.get('sslservername')

  const shouldDisableVerification =
    !!sslMode &&
    (SSL_MODES_WITHOUT_VERIFY.has(sslMode) ||
      (sslMode === 'require' && !sslRootCert && !hasMainSSLParams))

  return {
    ...(shouldDisableVerification ? { rejectUnauthorized: false } : {}),
    ...(sslCert ? { cert: sslCert } : {}),
    ...(sslKey ? { key: sslKey } : {}),
    ...(sslRootCert ? { ca: sslRootCert } : {}),
    ...(sslPassword ? { passphrase: sslPassword } : {}),
    ...(sslServername ? { servername: sslServername } : {}),
  }
}

const parseSslModeOnly = (sslMode: string): PoolOptions['ssl'] | undefined => {
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

const parseSslFlag = (ssl: string | null): PoolOptions['ssl'] | undefined => {
  if (ssl === '1' || ssl?.toLowerCase() === 'true') {
    return true
  }
  if (ssl === '0' || ssl?.toLowerCase() === 'false') {
    return false
  }
}

export const parseSSLConfig = (
  searchParams: URLSearchParams
): PoolOptions['ssl'] => {
  const sslMode = searchParams.get('sslmode')
  const ssl = searchParams.get('ssl')
  const hasMainSSLParams = !!(
    searchParams.get('sslcert') ||
    searchParams.get('sslkey') ||
    searchParams.get('sslrootcert') ||
    searchParams.get('sslpassword') ||
    searchParams.get('sslservername')
  )

  if (sslMode || hasMainSSLParams) {
    if (sslMode === 'disable' && hasMainSSLParams) {
      throw new Error(
        'sslmode=disable cannot be used with SSL certificate parameters (sslcert, sslkey, sslrootcert, sslpassword, sslservername)'
      )
    }

    if (sslMode && !hasMainSSLParams) {
      const modeOnly = parseSslModeOnly(sslMode)
      if (modeOnly !== undefined) {
        return modeOnly
      }
    }

    return buildCertificateSslConfig(searchParams, sslMode, hasMainSSLParams)
  }

  return parseSslFlag(ssl)
}
