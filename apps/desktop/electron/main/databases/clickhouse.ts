import { createRequire } from 'node:module'
import { memoize } from '@conar/shared/utils/helpers'

const clickhouse = createRequire(import.meta.url)('@clickhouse/client') as typeof import('@clickhouse/client')

export const getClient = memoize((connectionString: string) => {
  console.log('[ClickHouse] Initializing client with:', connectionString)
  let urlStr = connectionString.trim()

  if (/^clickhouse:\/\//i.test(urlStr)) {
    urlStr = urlStr.replace(/^clickhouse:\/\//i, 'http://')
  }
  else if (/^clickhouses:\/\//i.test(urlStr)) {
    urlStr = urlStr.replace(/^clickhouses:\/\//i, 'https://')
  }

  const url = new URL(urlStr)
  const database = url.pathname.slice(1)
  url.pathname = ''

  return clickhouse.createClient({
    url: url.toString(),
    database: database || undefined,
  })
})
