import type { ComponentRef } from 'react'
import { Separator } from '@conar/ui/components/separator'
import { Tabs, TabsList, TabsTrigger } from '@conar/ui/components/tabs'
import { useLiveQuery } from '@tanstack/react-db'
import { AnimatePresence } from 'motion/react'
import { useRef, useState } from 'react'
import { connectionsCollection } from '~/entities/connection/sync'
import { useLastOpenedConnections } from '~/entities/connection/utils'
import { ConnectionCard } from './connection-card'
import { EmptyConnection } from './empty-connection'
import { LastOpenedConnections } from './last-opened-connections'
import { RemoveConnectionDialog } from './remove-connection-dialog'
import { RenameConnectionDialog } from './rename-connection-dialog'

export function ConnectionsList() {
  const { data: connections } = useLiveQuery(q => q
    .from({ connections: connectionsCollection })
    .orderBy(({ connections }) => connections.createdAt, 'desc'))
  const renameDialogRef = useRef<ComponentRef<typeof RenameConnectionDialog>>(null)
  const removeDialogRef = useRef<ComponentRef<typeof RemoveConnectionDialog>>(null)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [lastOpenedConnections, setLastOpenedConnections] = useLastOpenedConnections()

  const availableLabels = Array.from(new Set(connections.map(connection => connection.label).filter(Boolean) as string[])).sort()

  const filteredConnections = selectedLabel
    ? connections.filter(connection => connection.label === selectedLabel)
    : connections

  const hasLastOpened = lastOpenedConnections.length > 0

  return (
    <div className="flex flex-col gap-6">
      <RemoveConnectionDialog ref={removeDialogRef} />
      <RenameConnectionDialog ref={renameDialogRef} />
      {hasLastOpened && (
        <LastOpenedConnections
          onRemove={(connection) => {
            removeDialogRef.current?.remove(connection)
          }}
          onRename={(connection) => {
            renameDialogRef.current?.rename(connection)
          }}
          onClose={(connection) => {
            setLastOpenedConnections(prev => prev.filter(id => id !== connection.id))
          }}
        />
      )}
      {hasLastOpened && (
        <Separator />
      )}
      {availableLabels.length > 0 && (
        <Tabs
          value={selectedLabel === null ? 'all' : selectedLabel}
          onValueChange={value => setSelectedLabel(value === 'all' ? null : value)}
        >
          <TabsList>
            <TabsTrigger value="all">
              All
            </TabsTrigger>
            {availableLabels.map(label => (
              <TabsTrigger key={label} value={label}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      <div className="flex flex-col gap-2">
        {filteredConnections.length > 0
          ? (
              <AnimatePresence initial={false} mode="popLayout">
                {filteredConnections.map(connection => (
                  <ConnectionCard
                    key={connection.id}
                    connection={connection}
                    onRemove={() => {
                      removeDialogRef.current?.remove(connection)
                    }}
                    onRename={() => {
                      renameDialogRef.current?.rename(connection)
                    }}
                  />
                ))}
              </AnimatePresence>
            )
          : <EmptyConnection />}
      </div>
    </div>
  )
}
