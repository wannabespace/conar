import type { SslOptions } from 'mysql2'

export const defaultSSLConfig: SslOptions = {
  rejectUnauthorized: false,
}

const applyCertParams = (
  sslConfig: SslOptions,
  params: {
    sslCa: string | null
    sslCert: string | null
    sslKey: string | null
    sslPassphrase: string | null
    sslCiphers: string | null
    sslMinVersion: string | null
    sslMaxVersion: string | null
    sslPfx: string | null
  }
) => {
  if (params.sslCa) {
    sslConfig.ca = params.sslCa
  }
  if (params.sslCert) {
    sslConfig.cert = params.sslCert
  }
  if (params.sslKey) {
    sslConfig.key = params.sslKey
  }
  if (params.sslPassphrase) {
    sslConfig.passphrase = params.sslPassphrase
  }
  if (params.sslCiphers) {
    sslConfig.ciphers = params.sslCiphers
  }
  if (params.sslMinVersion) {
    sslConfig.minVersion = params.sslMinVersion
  }
  if (params.sslMaxVersion) {
    sslConfig.maxVersion = params.sslMaxVersion
  }
  if (params.sslPfx) {
    sslConfig.pfx = params.sslPfx
  }
}

const applyRejectUnauthorized = (
  sslConfig: SslOptions,
  sslRejectUnauthorized: string | null
) => {
  if (sslRejectUnauthorized === null) {
    return
  }
  if (
    sslRejectUnauthorized === '0' ||
    sslRejectUnauthorized.toLowerCase() === 'false'
  ) {
    sslConfig.rejectUnauthorized = false
    return
  }
  if (
    sslRejectUnauthorized === '1' ||
    sslRejectUnauthorized.toLowerCase() === 'true'
  ) {
    sslConfig.rejectUnauthorized = true
  }
}

export const parseSSLConfig = (
  searchParams: URLSearchParams
): SslOptions | undefined => {
  const ssl = searchParams.get('ssl')
  const sslCa = searchParams.get('sslca')
  const sslCert = searchParams.get('sslcert')
  const sslKey = searchParams.get('sslkey')
  const sslPassphrase =
    searchParams.get('sslpassphrase') || searchParams.get('sslpassword')
  const sslRejectUnauthorized = searchParams.get('sslrejectunauthorized')
  const sslCiphers = searchParams.get('sslciphers')
  const sslMinVersion = searchParams.get('sslminversion')
  const sslMaxVersion = searchParams.get('sslmaxversion')
  const sslPfx = searchParams.get('sslpfx')

  const hasSSLParams = Boolean(
    sslCa ||
    sslCert ||
    sslKey ||
    sslPassphrase ||
    sslCiphers ||
    sslMinVersion ||
    sslMaxVersion ||
    sslPfx ||
    sslRejectUnauthorized
  )

  if (ssl === '0' || ssl?.toLowerCase() === 'false') {
    if (hasSSLParams) {
      throw new Error(
        'ssl=false cannot be used with SSL certificate parameters'
      )
    }
    return undefined
  }

  if (ssl === '1' || ssl?.toLowerCase() === 'true' || hasSSLParams) {
    const sslConfig: SslOptions = {}
    applyCertParams(sslConfig, {
      sslCa,
      sslCert,
      sslCiphers,
      sslKey,
      sslMaxVersion,
      sslMinVersion,
      sslPassphrase,
      sslPfx,
    })
    applyRejectUnauthorized(sslConfig, sslRejectUnauthorized)
    return sslConfig
  }
}
