import https from 'node:https'
import { createRequire } from 'node:module'

import type * as ClickHouse from '@clickhouse/client'
import { SafeURL } from '@tamery/shared/safe-url'
import { memoize } from 'memoza'

import { SSH_TLS_HOST_PARAM } from '../../../ssh/params'

const clickhouse = createRequire(import.meta.url)(
  '@clickhouse/client'
) as typeof ClickHouse

export const getClient = memoize((connectionString: string) => {
  const url = new SafeURL(connectionString.replace(/^clickhouse/u, 'http'))
  const tlsHost = url.searchParams.get(SSH_TLS_HOST_PARAM)
  url.searchParams.delete(SSH_TLS_HOST_PARAM)

  return clickhouse.createClient({
    clickhouse_settings: { date_time_output_format: 'iso' },
    ...(tlsHost &&
      url.protocol === 'https:' && {
        http_agent: new https.Agent({ keepAlive: true, servername: tlsHost }),
      }),
    request_timeout: 0,
    url: url.toString(),
  })
})
