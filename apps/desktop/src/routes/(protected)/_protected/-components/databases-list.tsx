import type { ComponentRef } from 'react'
import type { databases } from '~/drizzle'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { ButtonGroup } from '@conar/ui/components/button-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiDeleteBinLine, RiEditLine, RiFileCopyLine, RiMoreLine } from '@remixicon/react'
import { useLiveQuery } from '@tanstack/react-db'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { DatabaseIcon, databasesCollection, useDatabaseLinkParams } from '~/entities/database'
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
          'rounded-lg p-5 bg-muted/30 border overflow-hidden border-border/50 border-l-4 group',
          database.color
            ? 'hover:border-(--color)/60 border-l-(--color)/60'
            : 'hover:border-primary/60',
        )}
        style={database.color ? { '--color': database.color } : {}}
        {...params}
      >
        <div
          className={cn(
            'size-12 shrink-0 rounded-lg p-3',
            'bg-muted/70',
          )}
        >
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
      </Link>
    </motion.div>
  )
}

export function Empty() {
  return (
    <div className="text-center bg-card border-2 border-dashed border-border/50 rounded-xl p-14 w-full m-auto group">
      <h2 className="text-foreground font-medium mt-6">
        No connections match this filter
      </h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4 whitespace-pre-line">
        Create a new connection to get started
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
            variant={selectedLabel === null ? 'default' : 'outline'}
            size="xs"
            onClick={() => setSelectedLabel(null)}
            className="border!"
          >
            All
          </Button>
          {availableLabels.map(label => (
            <Button
              key={label}
              variant={selectedLabel === label ? 'default' : 'outline'}
              size="xs"
              onClick={() => setSelectedLabel(label)}
              className="border!"
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
