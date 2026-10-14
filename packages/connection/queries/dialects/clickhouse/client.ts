// oxlint-disable-next-line unicorn/prefer-node-protocol -- ClickHouse types `http_agent` with `http`, which this program's two @types/node copies (ssh2's and bun's) keep apart from `node:http`
import http from 'http'
import https from 'node:https'
import { createRequire } from 'node:module'
import tls from 'node:tls'

import type * as ClickHouse from '@clickhouse/client'
import { SafeURL } from '@tamery/shared/safe-url'
import { memoize } from 'memoza'

import { sshForwarding } from '../../../ssh/forwarding'
import { deleteSshParams } from '../../../ssh/params'

const clickhouse = createRequire(import.meta.url)(
  '@clickhouse/client'
) as typeof ClickHouse

export const getClient = memoize(async (connectionString: string) => {
  const url = new SafeURL(connectionString.replace(/^clickhouse/u, 'http'))
  const tunnel = await sshForwarding.of(connectionString)
  deleteSshParams(url.searchParams)

  return clickhouse.createClient({
    clickhouse_settings: { date_time_output_format: 'iso' },
    ...(tunnel && {
      http_agent:
        url.protocol === 'https:'
          ? Object.assign(new https.Agent({ keepAlive: true }), {
              createConnection: (options: tls.ConnectionOptions) =>
                tls.connect({ ...options, socket: tunnel.socket() }),
            })
          : Object.assign(new http.Agent({ keepAlive: true }), {
              createConnection: () => tunnel.socket(),
            }),
    }),
    request_timeout: 0,
    url: url.toString(),
  })
})
