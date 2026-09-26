import type * as ClickHouse from '@clickhouse/client'

export const killQuery = async (
  client: ClickHouse.ClickHouseClient,
  queryId: string,
  controller: AbortController
) => {
  try {
    await client.command({
      query: 'KILL QUERY WHERE query_id = {id:String}',
      query_params: { id: queryId },
    })
  } finally {
    controller.abort()
  }
}
