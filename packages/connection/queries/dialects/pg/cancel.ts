import type { Pool, PoolClient } from 'pg'

import { pg } from './client'

const backendPids = new WeakMap<PoolClient, number>()

export const backendPid = async (client: PoolClient) => {
  const cached = backendPids.get(client)
  if (cached !== undefined) {
    return cached
  }
  const { rows } = await client.query<{ pid: number }>(
    'SELECT pg_backend_pid() AS pid'
  )
  const pid = rows[0]?.pid
  if (pid !== undefined) {
    backendPids.set(client, pid)
  }
  return pid
}

export const cancelBackend = async (pool: Pool, pid?: number) => {
  if (pid === undefined) {
    return
  }
  const canceller = new pg.Client(pool.options)
  await canceller.connect()
  try {
    await canceller.query('SELECT pg_cancel_backend($1)', [pid])
  } finally {
    await canceller.end()
  }
}
