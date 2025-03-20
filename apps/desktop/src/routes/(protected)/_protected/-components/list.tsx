import type { Database } from '~/lib/indexeddb'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@connnect/ui/components/alert-dialog'
import { Button } from '@connnect/ui/components/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@connnect/ui/components/dropdown-menu'
import { Skeleton } from '@connnect/ui/components/skeleton'
import { RiDeleteBinLine, RiMoreLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DatabaseIcon, databaseQuery, databasesQuery, databaseTablesQuery, removeDatabase, useDatabases } from '~/entities/database'
import { queryClient } from '~/main'

function DatabaseCard({ database, onRemove }: { database: Database, onRemove: () => void }) {
  const connectionString = useMemo(() => {
    const url = new URL(database.connectionString)

    if (database.isPasswordExists || url.password) {
      url.password = '*'.repeat(url.password.length || 6)
    }

    return url.toString()
  }, [database.connectionString])

  return (
    <Link
      className="relative flex items-center justify-between gap-4 rounded-lg bg-background p-5 border border-border transition-all duration-150 hover:border-primary/50 hover:shadow-xl shadow-black/3"
      to="/database/$id"
      params={{ id: database.id }}
      onMouseOver={() => {
        queryClient.ensureQueryData(databaseQuery(database.id))
        queryClient.ensureQueryData(databaseTablesQuery(database))
      }}
    >
      <div className="size-14 shrink-0 rounded-full bg-element p-3">
        <DatabaseIcon type={database.type} className="size-full text-primary" />
      </div>
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="font-medium tracking-tight truncate">{database.name}</div>
        <div className="text-sm text-muted-foreground truncate">{connectionString.replaceAll('*', '•')}</div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-md p-2 hover:bg-accent-foreground/5">
          <RiMoreLine className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.preventDefault()
              onRemove()
            }}
          >
            <RiDeleteBinLine className="mr-2 size-4" />
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
    <div className="text-center bg-background border-2 border-dashed border-foreground/10 rounded-xl p-14 w-full m-auto group">
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
    <div className="relative flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-5">
      <Skeleton className="size-14 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}

function RemoveDatabaseDialog({ id, open, onOpenChange }: { id: string | null, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { mutate: removeDatabaseMutation, isPending } = useMutation({
    mutationFn: async () => {
      if (!id)
        return

      await removeDatabase(id)
    },
    onSuccess: () => {
      toast.success('Database removed successfully')
      onOpenChange(false)
      queryClient.invalidateQueries({ queryKey: databasesQuery().queryKey })
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove database</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this database
            and remove all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              loading={isPending}
              variant="destructive"
              onClick={(e) => {
                e.preventDefault()
                removeDatabaseMutation()
              }}
            >
              Remove
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function List() {
  const { data: databases, isPending } = useDatabases()
  const [selected, setSelected] = useState<string | null>(null)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <RemoveDatabaseDialog id={selected} open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen} />
      <div className="flex flex-col gap-2">
        {isPending
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
                    setSelected(database.id)
                    setIsRemoveDialogOpen(true)
                  }}
                />
              ))
            : <Empty />}
      </div>
    </div>
  )
}
