import type { ComponentRef } from 'react'
import type { databases } from '~/drizzle'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { Button } from '@conar/ui/components/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { Skeleton } from '@conar/ui/components/skeleton'
import { copy } from '@conar/ui/lib/copy'
import { RiDeleteBinLine, RiEditLine, RiFileCopyLine, RiMoreLine } from '@remixicon/react'
import { useLiveQuery } from '@tanstack/react-db'
import { Link } from '@tanstack/react-router'
import { useMemo, useRef } from 'react'
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
      className="relative flex items-center justify-between gap-4 rounded-lg bg-muted/30 p-5 border border-border/50 hover:border-primary transition-all duration-150"
      {...params}
    >
      <div className="size-12 shrink-0 rounded-lg bg-muted/70 p-3">
        <DatabaseIcon type={database.type} className="size-full text-primary" />
      </div>
      <div className="flex flex-1 flex-col min-w-0">
        <div className="font-medium tracking-tight truncate flex items-center gap-2">
          {database.name}
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

  return (
    <div className="flex flex-col gap-6">
      <RemoveConnectionDialog ref={removeDialogRef} />
      <RenameConnectionDialog ref={renameDialogRef} />
      <div className="flex flex-col gap-2">
        {!databases
          ? (
              <>
                <DatabaseCardSkeleton />
                <DatabaseCardSkeleton />
                <DatabaseCardSkeleton />
              </>
            )
          : databases?.length
            ? databases.map(database => (
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
            : <Empty />}
      </div>
    </div>
  )
}
