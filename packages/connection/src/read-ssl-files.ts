import type { SSLConfig } from './parse-connection-string'
import fs from 'node:fs'

export function readSSLFiles(ssl: SSLConfig) {
  if (typeof ssl !== 'object') {
    return ssl
  }

  const cert = typeof ssl.cert === 'string' ? fs.readFileSync(ssl.cert).toString() : undefined
  const key = typeof ssl.key === 'string' ? fs.readFileSync(ssl.key).toString() : undefined
  const ca = typeof ssl.ca === 'string' ? fs.readFileSync(ssl.ca).toString() : undefined

  return {
    ...ssl,
    ...(cert ? { cert } : {}),
    ...(key ? { key } : {}),
    ...(ca ? { ca } : {}),
  }
}
