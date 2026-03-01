import { memoize } from '@conar/shared/utils/helpers'
import { createClient } from 'redis'

export const getClient = memoize(async (connectionString: string) => {
  const client = createClient({ url: connectionString })
  await client.connect()
  return client
})
