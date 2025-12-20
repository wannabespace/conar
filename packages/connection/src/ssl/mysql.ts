import type { SslOptions } from 'mysql2'

export const defaultSSLConfig: SslOptions = {
  rejectUnauthorized: false,
}

export function parseSSLConfig(searchParams: URLSearchParams): SslOptions | undefined {
  const ssl = searchParams.get('ssl')
  const sslCa = searchParams.get('sslca')
  const sslCert = searchParams.get('sslcert')
  const sslKey = searchParams.get('sslkey')
  const sslPassphrase = searchParams.get('sslpassphrase') || searchParams.get('sslpassword')
  const sslRejectUnauthorized = searchParams.get('sslrejectunauthorized')
  const sslCiphers = searchParams.get('sslciphers')
  const sslMinVersion = searchParams.get('sslminversion')
  const sslMaxVersion = searchParams.get('sslmaxversion')
  const sslPfx = searchParams.get('sslpfx')

  const hasSSLParams =
    sslCa ||
    sslCert ||
    sslKey ||
    sslPassphrase ||
    sslCiphers ||
    sslMinVersion ||
    sslMaxVersion ||
    sslPfx ||
    sslRejectUnauthorized

  if (ssl === '0' || ssl?.toLowerCase() === 'false') {
    if (hasSSLParams) {
      throw new Error('ssl=false cannot be used with SSL certificate parameters')
    }
    return undefined
  }

  if (ssl === '1' || ssl?.toLowerCase() === 'true' || hasSSLParams) {
    const sslConfig: SslOptions = {}

    if (sslCa) {
      sslConfig.ca = sslCa
    }

    if (sslCert) {
      sslConfig.cert = sslCert
    }

    if (sslKey) {
      sslConfig.key = sslKey
    }

    if (sslPassphrase) {
      sslConfig.passphrase = sslPassphrase
    }

    if (sslCiphers) {
      sslConfig.ciphers = sslCiphers
    }

    if (sslMinVersion) {
      sslConfig.minVersion = sslMinVersion
    }

    if (sslMaxVersion) {
      sslConfig.maxVersion = sslMaxVersion
    }

    if (sslPfx) {
      sslConfig.pfx = sslPfx
    }

    if (sslRejectUnauthorized !== null) {
      if (sslRejectUnauthorized === '0' || sslRejectUnauthorized?.toLowerCase() === 'false') {
        sslConfig.rejectUnauthorized = false
      } else if (sslRejectUnauthorized === '1' || sslRejectUnauthorized?.toLowerCase() === 'true') {
        sslConfig.rejectUnauthorized = true
      }
    }

    return sslConfig
  }
}
