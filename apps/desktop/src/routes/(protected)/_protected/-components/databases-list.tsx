import type { ComponentRef } from 'react'
import type { databases } from '~/drizzle'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@conar/ui/components/tabs'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiDeleteBinLine, RiEditLine, RiFileCopyLine, RiMoreLine } from '@remixicon/react'
import { useLiveQuery } from '@tanstack/react-db'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { DatabaseIcon, databasesCollection, useDatabaseLinkParams, useLastOpenedDatabases } from '~/entities/database'
import { RemoveConnectionDialog } from './remove-connection-dialog'
import { RenameConnectionDialog } from './rename-connection-dialog'

function DatabaseCard({ database, onRemove, onRename }: { database: typeof databases.$inferSelect, onRemove: () => void, onRename: () => void }) {
  const url = new SafeURL(database.connectionString)

  if (database.isPasswordExists || url.password) {
    url.password = '*'.repeat(url.password.length || 6)
  }

  const connectionString = url.toString()

  const params = useDatabaseLinkParams(database.id)

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
          'relative flex items-center justify-between gap-4',
          `
            group overflow-hidden rounded-lg border border-l-4 border-border/50
            bg-muted/30 p-5
          `,
          database.color
            ? `
              border-l-(--color)/60
              hover:border-(--color)/60
            `
            : 'hover:border-primary/60',
        )}
        style={database.color ? { '--color': database.color } : {}}
        preload={false}
        {...params}
      >
        <div className="size-12 shrink-0 rounded-lg bg-muted/70 p-3">
          <DatabaseIcon
            type={database.type}
            className="size-full"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className={`
            flex items-center gap-2 truncate font-medium tracking-tight
          `}
          >
            <span className={database.color
              ? `
                text-(--color)
                group-hover:text-(--color)/80
              `
              : ''}
            >
              {database.name}
            </span>
            {database.label && (
              <Badge variant="secondary">
                {database.label}
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
                copy(database.connectionString, 'Connection string copied to clipboard')
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

function LastOpenedDatabases({ onRemove, onRename }: { onRemove: (database: typeof databases.$inferSelect) => void, onRename: (database: typeof databases.$inferSelect) => void }) {
  const { data: databases } = useLiveQuery(q => q
    .from({ databases: databasesCollection })
    .orderBy(({ databases }) => databases.createdAt, 'desc'))
  const [lastOpenedDatabases] = useLastOpenedDatabases()
  const filteredDatabases = (databases?.filter(database => lastOpenedDatabases.includes(database.id)) ?? [])
    .toSorted((a, b) => lastOpenedDatabases.indexOf(a.id) - lastOpenedDatabases.indexOf(b.id))

  if (filteredDatabases.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-muted-foreground">Last Opened</h3>
      <AnimatePresence initial={false} mode="popLayout">
        {filteredDatabases.map(database => (
          <DatabaseCard
            key={database.id}
            database={database}
            onRemove={() => onRemove(database)}
            onRename={() => onRename(database)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

export function DatabasesList() {
  const { data: databases } = useLiveQuery(q => q
    .from({ databases: databasesCollection })
    .orderBy(({ databases }) => databases.createdAt, 'desc'))
  const renameDialogRef = useRef<ComponentRef<typeof RenameConnectionDialog>>(null)
  const removeDialogRef = useRef<ComponentRef<typeof RemoveConnectionDialog>>(null)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [lastOpenedDatabases] = useLastOpenedDatabases()

  const availableLabels = Array.from(new Set(databases.map(db => db.label).filter(Boolean) as string[])).sort()

  const filteredDatabases = selectedLabel
    ? databases.filter(db => db.label === selectedLabel)
    : databases

  const hasLastOpened = lastOpenedDatabases.length > 0

  return (
    <div className="flex flex-col gap-6">
      <RemoveConnectionDialog ref={removeDialogRef} />
      <RenameConnectionDialog ref={renameDialogRef} />
      {hasLastOpened && (
        <LastOpenedDatabases
          onRemove={(database) => {
            removeDialogRef.current?.remove(database)
          }}
          onRename={(database) => {
            renameDialogRef.current?.rename(database)
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
        {filteredDatabases.length > 0
          ? (
              <AnimatePresence initial={false} mode="popLayout">
                {filteredDatabases.map(database => (
                  <DatabaseCard
                    key={database.id}
                    database={database}
                    onRemove={() => {
                      removeDialogRef.current?.remove(database)
                    }}
                    onRename={() => {
                      renameDialogRef.current?.rename(database)
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
