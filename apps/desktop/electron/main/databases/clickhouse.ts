import { createRequire } from 'node:module'
import { memoize } from '@conar/shared/utils/helpers'

const clickhouse = createRequire(import.meta.url)('@clickhouse/client') as typeof import('@clickhouse/client')

export const getClient = memoize((connectionString: string) => {
  let urlStr = connectionString.trim()

  if (/^clickhouse:\/\//i.test(urlStr)) {
    urlStr = urlStr.replace(/^clickhouse:\/\//i, 'http://')
  }
  else if (/^clickhouses:\/\//i.test(urlStr)) {
    urlStr = urlStr.replace(/^clickhouses:\/\//i, 'https://')
  }

  const url = new URL(urlStr)

  return clickhouse.createClient({
    url: url.toString(),
  })
})
