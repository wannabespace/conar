import type { ComponentRef } from 'react'
import type { databases } from '~/drizzle'
import { parseUrl } from '@conar/shared/utils/url'
import { Button } from '@conar/ui/components/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { Skeleton } from '@conar/ui/components/skeleton'
import { copy } from '@conar/ui/lib/copy'
import { RiDeleteBinLine, RiEditLine, RiFileCopyLine, RiMoreLine } from '@remixicon/react'
import { Link, useRouter } from '@tanstack/react-router'
import { useMemo, useRef } from 'react'
import { DatabaseIcon, useDatabasesLive } from '~/entities/database'
import { useLastOpenedTable } from '../database/$id/table/-lib'
import { RemoveDatabaseDialog } from './remove-database-dialog'
import { RenameDatabaseDialog } from './rename-database-dialog'

function DatabaseCard({ database, onRemove, onRename }: { database: typeof databases.$inferSelect, onRemove: () => void, onRename: () => void }) {
  const connectionString = useMemo(() => {
    const url = parseUrl(database.connectionString)

    if (database.isPasswordExists || url.password) {
      url.password = '*'.repeat(url.password.length || 6)
    }

    return url.toString()
  }, [database.connectionString])

  const [lastOpenedTable] = useLastOpenedTable(database.id)

  return (
    <Link
      className="relative flex items-center justify-between gap-4 rounded-lg bg-muted/30 p-5 border border-border/50 hover:border-primary transition-all duration-150"
      to="/database/$id/table"
      params={{ id: database.id }}
      search={lastOpenedTable ? { schema: lastOpenedTable.schema, table: lastOpenedTable.table } : undefined}
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
  const router = useRouter()

  return (
    <div className="text-center bg-card border-2 border-dashed border-border/50 rounded-xl p-14 w-full m-auto group">
      <h2 className="text-foreground font-medium mt-6">
        No connections found
      </h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4 whitespace-pre-line">
        Create a new connection to get started.
      </p>
      <Button onClick={() => router.navigate({ to: '/create' })}>
        Create a new connection
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
  const { data: databases } = useDatabasesLive()
  const renameDialogRef = useRef<ComponentRef<typeof RenameDatabaseDialog>>(null)
  const removeDialogRef = useRef<ComponentRef<typeof RemoveDatabaseDialog>>(null)

  return (
    <div className="flex flex-col gap-6">
      <RemoveDatabaseDialog ref={removeDialogRef} />
      <RenameDatabaseDialog ref={renameDialogRef} />
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
