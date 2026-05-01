import fs from 'node:fs'

export interface BaseSSLConfig {
  cert?: unknown
  key?: unknown
  ca?: unknown
}

export function readSSLFiles<T extends BaseSSLConfig>(ssl: T): T {
  const cert = typeof ssl.cert === 'string' ? fs.readFileSync(ssl.cert).toString() : ssl.cert
  const key = typeof ssl.key === 'string' ? fs.readFileSync(ssl.key).toString() : ssl.key
  const ca = typeof ssl.ca === 'string' ? fs.readFileSync(ssl.ca).toString() : ssl.ca

  return {
    ...ssl,
    ...(cert ? { cert } : {}),
    ...(key ? { key } : {}),
    ...(ca ? { ca } : {}),
  }
}
