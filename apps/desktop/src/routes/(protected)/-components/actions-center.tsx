import type { databases, databases as databasesTable } from '~/drizzle'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@conar/ui/components/command'
import { useKeyboardEvent } from '@react-hookz/web'
import { RiAddLine, RiDashboardLine, RiTableLine } from '@remixicon/react'
import { useLiveQuery } from '@tanstack/react-db'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from '@tanstack/react-router'
import { Store, useStore } from '@tanstack/react-store'
import { DatabaseIcon, databasesCollection, prefetchDatabaseCore, tablesAndSchemasQuery, useDatabaseLinkParams } from '~/entities/database'
import { trackEvent } from '~/lib/events'

// eslint-disable-next-line react-refresh/only-export-components
export const actionsCenterStore = new Store({
  isOpen: false,
})

function setIsOpen(isOpen: boolean) {
  actionsCenterStore.setState(state => ({ ...state, isOpen }))
}

function ActionsDatabaseTables({ database }: { database: typeof databases.$inferSelect }) {
  const { data: tablesAndSchemas } = useQuery({
    ...tablesAndSchemasQuery({ database }),
    throwOnError: false,
  })
  const router = useRouter()

  if (!tablesAndSchemas)
    return null

  function onTableSelect(schema: string, table: string) {
    setIsOpen(false)
    router.navigate({ to: '/database/$id/table', params: { id: database.id }, search: { schema, table } })
  }

  return (
    <CommandGroup heading={`${database.name} Tables`} value={database.name}>
      {tablesAndSchemas.schemas.map(schema => schema.tables.map(table => (
        <CommandItem
          key={table}
          keywords={[schema.name, table]}
          value={`${schema.name}.${table}`}
          onSelect={() => onTableSelect(schema.name, table)}
        >
          <RiTableLine className="size-4 shrink-0 text-muted-foreground" />
          {schema.name}
          .
          {table}
        </CommandItem>
      )))}
    </CommandGroup>
  )
}

function ActionsDatabase({ database }: { database: typeof databases.$inferSelect }) {
  const router = useRouter()
  const params = useDatabaseLinkParams(database.id)

  function onDatabaseSelect(database: typeof databasesTable.$inferSelect) {
    setIsOpen(false)

    prefetchDatabaseCore(database)
    router.navigate(params)
  }

  return (
    <CommandItem
      key={database.id}
      onSelect={() => onDatabaseSelect(database)}
    >
      <DatabaseIcon type={database.type} className="size-4 shrink-0" />
      {database.name}
    </CommandItem>
  )
}

export function ActionsCenter() {
  const { data: databases } = useLiveQuery(q => q
    .from({ databases: databasesCollection })
    .orderBy(({ databases }) => databases.createdAt, 'desc'))
  const isOpen = useStore(actionsCenterStore, state => state.isOpen)
  const router = useRouter()
  const { id } = useParams({ strict: false })

  useKeyboardEvent(e => e.key === 'p' && (e.metaKey || e.ctrlKey), () => {
    if (!databases || databases.length === 0)
      return

    setIsOpen(!isOpen)
    trackEvent('actions_center_open_shortcut')
  })

  const currentConnection = databases?.find(database => database.id === id)

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput placeholder="Type a command..." />
      <CommandList className="max-h-140">
        <CommandEmpty>No commands found.</CommandEmpty>
        <CommandGroup heading="Commands">
          <CommandItem
            onSelect={() => {
              setIsOpen(false)
              router.navigate({ to: '/' })
            }}
          >
            <RiDashboardLine className="size-4 shrink-0 text-muted-foreground" />
            Dashboard
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setIsOpen(false)
              router.navigate({ to: '/create' })
            }}
          >
            <RiAddLine className="size-4 shrink-0 text-muted-foreground" />
            Add new connection...
          </CommandItem>
        </CommandGroup>
        {!!databases?.length && (
          <CommandGroup heading="Databases">
            {databases.map(database => <ActionsDatabase key={database.id} database={database} />)}
          </CommandGroup>
        )}
        {currentConnection && <ActionsDatabaseTables database={currentConnection} />}
      </CommandList>
    </CommandDialog>
  )
}
