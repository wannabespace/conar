import type { ComponentRef } from 'react'
import type { databases } from '~/drizzle'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { ButtonGroup } from '@conar/ui/components/button-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowDownSLine, RiArrowUpSLine, RiDatabase2Line, RiDeleteBinLine, RiEditLine, RiFileCopyLine, RiLoader4Line, RiMoreLine } from '@remixicon/react'
import { useLiveQuery } from '@tanstack/react-db'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { cloneConnectionForDatabase, DatabaseIcon, databasesCollection, useDatabaseLinkParams, useServerDatabases } from '~/entities/database'
import { RemoveConnectionDialog } from './remove-connection-dialog'
import { RenameConnectionDialog } from './rename-connection-dialog'

function DatabaseCard({ database, onRemove, onRename }: { database: typeof databases.$inferSelect, onRemove: () => void, onRename: () => void }) {
  const url = new SafeURL(database.connectionString)

  if (database.isPasswordExists || url.password) {
    url.password = '*'.repeat(url.password.length || 6)
  }

  const connectionString = url.toString()

  const params = useDatabaseLinkParams(database.id)

  const { databasesList, isLoading, isExpanded, toggleExpand } = useServerDatabases(database)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.75 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col gap-1"
    >
      <Link
        className={cn(
          'relative flex items-center justify-between gap-4',
          'rounded-lg p-5 bg-muted/30 border overflow-hidden border-border/50 border-l-4 group',
          database.color
            ? 'hover:border-(--color)/60 border-l-(--color)/60'
            : 'hover:border-primary/60',
        )}
        style={database.color ? { '--color': database.color } : {}}
        preload={false}
        {...params}
      >
        <div className="size-12 shrink-0 rounded-lg p-3 bg-muted/70">
          <DatabaseIcon
            type={database.type}
            className="size-full"
          />
        </div>
        <div className="flex flex-1 flex-col min-w-0">
          <div className="font-medium tracking-tight truncate flex items-center gap-2">
            <span className={database.color ? 'text-(--color) group-hover:text-(--color)/80' : ''}>
              {database.name}
            </span>
            {database.label && (
              <Badge variant="secondary">
                {database.label}
              </Badge>
            )}
          </div>
          <div data-mask className="text-xs text-muted-foreground font-mono truncate">{connectionString.replaceAll('*', '•')}</div>
        </div>
        <div className="flex items-center gap-1 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleExpand()
            }}
          >
            {isExpanded ? <RiArrowUpSLine className="size-4" /> : <RiArrowDownSLine className="size-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-md p-2 hover:bg-accent-foreground/5">
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
                className="text-destructive focus:text-destructive"
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
        </div>
      </Link>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border bg-muted/30 p-2 ml-4 flex flex-col gap-1 max-h-60 overflow-y-auto">
              {isLoading
                ? (
                    <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                      <RiLoader4Line className="size-4 animate-spin" />
                      Loading databases...
                    </div>
                  )
                : databasesList.length > 0
                  ? (
                      databasesList.map(dbName => (
                        <div
                          key={dbName}
                          role="button"
                          onKeyDown={() => {}}
                          tabIndex={0}
                          className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer border border-transparent hover:border-border text-sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()

                            const newConnection = cloneConnectionForDatabase(database, dbName)
                            databasesCollection.insert(newConnection)
                          }}
                        >
                          <RiDatabase2Line className="size-4 text-muted-foreground" />
                          <span>{dbName}</span>
                        </div>
                      ))
                    )
                  : (
                      <div className="p-2 text-sm text-muted-foreground">
                        No other databases found.
                      </div>
                    )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function Empty() {
  return (
    <div className="text-center bg-card border-2 border-dashed border-border/50 rounded-xl p-14 w-full m-auto group">
      <h2 className="text-foreground font-medium mt-6">
        No connections found
      </h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4 whitespace-pre-line">
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

export function DatabasesList() {
  const { data: databases } = useLiveQuery(q => q
    .from({ databases: databasesCollection })
    .orderBy(({ databases }) => databases.createdAt, 'desc'))
  const renameDialogRef = useRef<ComponentRef<typeof RenameConnectionDialog>>(null)
  const removeDialogRef = useRef<ComponentRef<typeof RemoveConnectionDialog>>(null)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)

  const availableLabels = Array.from(new Set(databases.map(db => db.label).filter(Boolean) as string[])).sort()

  const filteredDatabases = selectedLabel
    ? databases.filter(db => db.label === selectedLabel)
    : databases

  return (
    <div className="flex flex-col gap-6">
      <RemoveConnectionDialog ref={removeDialogRef} />
      <RenameConnectionDialog ref={renameDialogRef} />
      {availableLabels.length > 0 && (
        <ButtonGroup>
          <Button
            variant="outline"
            className={selectedLabel === null ? 'bg-primary!' : ''}
            size="xs"
            onClick={() => setSelectedLabel(null)}
          >
            All
          </Button>
          {availableLabels.map(label => (
            <Button
              key={label}
              variant="outline"
              className={selectedLabel === label ? 'bg-primary!' : ''}
              size="xs"
              onClick={() => setSelectedLabel(label)}
            >
              {label}
            </Button>
          ))}
        </ButtonGroup>
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
