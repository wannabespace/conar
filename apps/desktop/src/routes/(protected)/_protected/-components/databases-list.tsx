import type { ComponentRef } from 'react'
import type { databases } from '~/drizzle'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { ButtonGroup } from '@conar/ui/components/button-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { Skeleton } from '@conar/ui/components/skeleton'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiDeleteBinLine, RiEditLine, RiFileCopyLine, RiMoreLine } from '@remixicon/react'
import { useLiveQuery } from '@tanstack/react-db'
import { Link } from '@tanstack/react-router'
import { useMemo, useRef, useState } from 'react'
import { DatabaseIcon, databasesCollection, useDatabaseLinkParams } from '~/entities/database'
import { RemoveConnectionDialog } from './remove-connection-dialog'
import { RenameConnectionDialog } from './rename-connection-dialog'

function DatabaseCard({ database, onRemove, onRename }: { database: typeof databases.$inferSelect, onRemove: () => void, onRename: () => void }) {
  const connectionString = useMemo(() => {
    const url = new SafeURL(database.connectionString)

    if (database.isPasswordExists || url.password) {
      url.password = '*'.repeat(url.password.length || 6)
    }

    return url.toString()
  }, [database.connectionString, database.isPasswordExists])

  const params = useDatabaseLinkParams(database.id)

  return (
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
  )
}

export function Empty({ isFiltered }: { isFiltered?: boolean }) {
  return (
    <div className="text-center bg-card border-2 border-dashed border-border/50 rounded-xl p-14 w-full m-auto group">
      <h2 className="text-foreground font-medium mt-6">
        {isFiltered ? 'No connections match this filter' : 'No connections found'}
      </h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4 whitespace-pre-line">
        {isFiltered ? 'Try selecting a different label or clear the filter.' : 'Create a new connection to get started.'}
      </p>
      {!isFiltered && (
        <Button asChild>
          <Link to="/create">
            Create a new connection
          </Link>
        </Button>
      )}
    </div>
  )
}

function DatabaseCardSkeleton() {
  return (
    <div className="relative flex items-center justify-between gap-4 rounded-lg bg-card p-5">
      <Skeleton className="size-14 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
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

  const availableLabels = databases
    ? Array.from(new Set(databases.map(db => db.label).filter(Boolean) as string[])).sort()
    : []

  const filteredDatabases = !databases
    ? undefined
    : !selectedLabel
        ? databases
        : databases.filter(db => db.label === selectedLabel)

  return (
    <div className="flex flex-col gap-6">
      <RemoveConnectionDialog ref={removeDialogRef} />
      <RenameConnectionDialog ref={renameDialogRef} />
      {availableLabels.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter by label:</span>
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
        </div>
      )}
      <div className="flex flex-col gap-2">
        {!filteredDatabases
          ? (
              <>
                <DatabaseCardSkeleton />
                <DatabaseCardSkeleton />
                <DatabaseCardSkeleton />
              </>
            )
          : filteredDatabases.length
            ? filteredDatabases.map(database => (
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
              ))
            : <Empty isFiltered={selectedLabel !== null} />}
      </div>
    </div>
  )
}
