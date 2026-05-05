import type { ConnectionType } from '@conar/shared/enums/connection-type'
import { log, select, spinner, text } from '@clack/prompts'
import { apiClient, proxyClient } from '~/orpc'

export async function query() {
  const s = spinner()
  s.start('Loading connections...')

  let connections: Awaited<ReturnType<typeof apiClient.connections.list>>

  try {
    connections = await apiClient.connections.list()
    s.stop('Connections loaded.')
  }
  catch (error) {
    s.stop('Failed to load connections.')
    throw error
  }

  if (connections.length === 0) {
    log.warn('No connections found. Create one in the Conar app first.')
    return
  }

  const connectionId = await select({
    message: 'Choose a connection:',
    options: connections.map(c => ({
      value: c.id,
      label: `${c.name} (${c.type})`,
    })),
  })

  if (typeof connectionId !== 'string') {
    return
  }

  const connection = connections.find(c => c.id === connectionId)

  if (!connection) {
    return
  }

  const sql = await text({
    message: 'Enter SQL query:',
    placeholder: 'SELECT 1',
    validate(value) {
      if (!value.trim())
        return 'Query cannot be empty.'
    },
  })

  if (typeof sql !== 'string') {
    return
  }

  const executor = proxyClient.query[connection.type as ConnectionType]

  s.start('Executing query...')

  try {
    const result = await executor.execute({
      connectionId,
      query: sql,
    })

    s.stop(`Query completed in ${Math.round(result.duration)}ms.`)
    log.message(JSON.stringify(result.result, null, 2))
  }
  catch (error) {
    s.stop('Query failed.')
    throw error
  }
}
