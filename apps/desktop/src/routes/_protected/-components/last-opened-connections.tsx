import type { connections } from '~/drizzle'
import { useLiveQuery } from '@tanstack/react-db'
import { AnimatePresence } from 'motion/react'
import { connectionsCollection } from '~/entities/connection/sync'
import { useLastOpenedConnections } from '~/entities/connection/utils'
import { ConnectionCard } from './connection-card'

export function LastOpenedConnections({ onRemove, onRename }: { onRemove: (connection: typeof connections.$inferSelect) => void, onRename: (connection: typeof connections.$inferSelect) => void }) {
  const { data: connections } = useLiveQuery(q => q
    .from({ connections: connectionsCollection })
    .orderBy(({ connections }) => connections.createdAt, 'desc'))
  const [lastOpenedConnections] = useLastOpenedConnections()
  const filteredConnections = (connections?.filter(connection => lastOpenedConnections.includes(connection.id)) ?? [])
    .toSorted((a, b) => lastOpenedConnections.indexOf(a.id) - lastOpenedConnections.indexOf(b.id))

  if (filteredConnections.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-muted-foreground">Last Opened</h3>
      <AnimatePresence initial={false} mode="popLayout">
        {filteredConnections.map(connection => (
          <ConnectionCard
            key={connection.id}
            connection={connection}
            onRemove={() => onRemove(connection)}
            onRename={() => onRename(connection)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
