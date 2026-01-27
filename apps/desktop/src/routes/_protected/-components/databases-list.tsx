import type { ComponentRef } from 'react'
import type { connections } from '~/drizzle'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@conar/ui/components/tabs'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiCloseLine, RiDeleteBinLine, RiEditLine, RiFileCopyLine, RiMoreLine } from '@remixicon/react'
import { useLiveQuery } from '@tanstack/react-db'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { ConnectionIcon } from '~/entities/connection/components'
import { useConnectionLinkParams } from '~/entities/connection/hooks'
import { connectionsCollection } from '~/entities/connection/sync'
import { useLastOpenedConnections } from '~/entities/connection/utils'
import { RemoveConnectionDialog } from './remove-connection-dialog'
import { RenameConnectionDialog } from './rename-connection-dialog'

interface ConnectionCardProps {
  connection: typeof connections.$inferSelect
  onRemove: VoidFunction
  onRename: VoidFunction
  onRemoveFromRecent?: VoidFunction
}

function ConnectionCard({ connection, onRemove, onRename, onRemoveFromRecent }: ConnectionCardProps) {
  const url = new SafeURL(connection.connectionString)

  if (connection.isPasswordExists || url.password) {
    url.password = '*'.repeat(url.password.length || 6)
  }

  const connectionString = url.toString()

  const params = useConnectionLinkParams(connection.id)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.75 }}
      transition={{ duration: 0.15 }}
    >
      <Link
        className={cn(
          `
            group relative flex items-center justify-between gap-4
            overflow-visible rounded-lg border border-l-4 border-border/50
            bg-muted/30 p-5
          `,
          connection.color
            ? `
              border-l-(--color)/60
              hover:border-(--color)/60
            `
            : 'hover:border-primary/60',
        )}
        style={connection.color ? { '--color': connection.color } : {}}
        preload={false}
        {...params}
      >
        {onRemoveFromRecent && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="
              absolute -top-1.5 -right-1.5 z-10 rounded-full
              bg-muted/80 backdrop-blur-sm shadow-sm
              opacity-0 scale-90 transition-all duration-200 ease-out
              group-hover:opacity-100 group-hover:scale-100
              hover:bg-muted hover:shadow-md hover:scale-105
              active:scale-95 active:shadow-sm
              focus-visible:opacity-100 focus-visible:scale-100
              focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
            "
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemoveFromRecent?.()
            }}
            aria-label="Remove from recent"
          >
            <RiCloseLine className="size-3.5 transition-transform duration-150 group-hover:rotate-90" />
          </Button>
        )}
        <div className="size-12 shrink-0 rounded-lg bg-muted/70 p-3">
          <ConnectionIcon
            type={connection.type}
            className="size-full"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className={`
            flex items-center gap-2 truncate font-medium tracking-tight
          `}
          >
            <span className={connection.color
              ? `
                text-(--color)
                group-hover:text-(--color)/80
              `
              : ''}
            >
              {connection.name}
            </span>
            {connection.label && (
              <Badge variant="secondary">
                {connection.label}
              </Badge>
            )}
          </div>
          <div
            data-mask
            className="truncate font-mono text-xs text-muted-foreground"
          >
            {connectionString.replaceAll('*', '•')}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className={`
            rounded-md p-2
            hover:bg-accent-foreground/5
          `}
          >
            <RiMoreLine className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                copy(connection.connectionString, 'Connection string copied to clipboard')
              }}
            >
              <RiFileCopyLine className="size-4 opacity-50" />
              Copy Connection String
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onRename()
              }}
            >
              <RiEditLine className="size-4 opacity-50" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className={`
                text-destructive
                focus:text-destructive
              `}
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
            >
              <RiDeleteBinLine className="size-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Link>
    </motion.div>
  )
}

export function Empty() {
  return (
    <div className={`
      group m-auto w-full rounded-xl border-2 border-dashed border-border/50
      bg-card p-14 text-center
    `}
    >
      <h2 className="mt-6 font-medium text-foreground">
        No connections found
      </h2>
      <p className="mt-1 mb-4 text-sm whitespace-pre-line text-muted-foreground">
        Create a new connection to get started.
      </p>
      <Button asChild>
        <Link to="/create">
          Create a new connection
        </Link>
      </Button>
    </div>
  )
}

interface LastOpenedConnectionsProps {
  onRemove: (connection: typeof connections.$inferSelect) => void
  onRename: (connection: typeof connections.$inferSelect) => void
  onRemoveFromRecent: (connection: typeof connections.$inferSelect) => void
}

function LastOpenedConnections({ onRemove, onRename, onRemoveFromRecent }: LastOpenedConnectionsProps) {
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
            onRemoveFromRecent={() => onRemoveFromRecent(connection)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

export function DatabasesList() {
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
          onRemoveFromRecent={(connection) => {
            setLastOpenedConnections(prev => prev.filter(id => id !== connection.id))
          }}
        />
      )}
      {hasLastOpened && (
        <div className="border-t border-border/50" />
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
          : <Empty />}
      </div>
    </div>
  )
}
