import type { PoolOptions } from 'mysql2'

import { mysql2 } from './client'

/** The pool holds one connection and it is busy, so `KILL QUERY` needs its own. */
export const killQuery = async (conf: PoolOptions, threadId: number) => {
  const killer = await mysql2.createConnection(conf)
  try {
    await killer.query('KILL QUERY ?', [threadId])
  } finally {
    await killer.end()
  }
}
