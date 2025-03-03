import type { Connection } from '~/lib/indexeddb'
import { useConnectionTree } from '~/entities/connection'

export function ConnectionTree({ connection }: { connection: Connection }) {
  const { data: list } = useConnectionTree(connection)

  if (!connection)
    return null

  return (
    <>
      {JSON.stringify(list, null, 2)}
    </>
  )
}
