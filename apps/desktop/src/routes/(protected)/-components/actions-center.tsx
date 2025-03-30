import type { Database } from '~/lib/indexeddb'
import { getOS } from '@connnect/shared/utils/os'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@connnect/ui/components/command'
import { useKeyboardEvent } from '@react-hookz/web'
import { RiAddLine } from '@remixicon/react'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { DatabaseIcon, prefetchDatabaseCore, useDatabases } from '~/entities/database'

const os = getOS()

export function ActionsCenter() {
  const { data: databases } = useDatabases()
  const [openConnections, setOpenConnections] = useState(false)
  const router = useRouter()

  useKeyboardEvent(e => e.key === 'l' && (os === 'macos' ? e.metaKey : e.ctrlKey), () => {
    if (!databases || databases.length === 0)
      return

    setOpenConnections(open => !open)
  })

  function onSelect(databases: Database) {
    setOpenConnections(false)

    router.navigate({ to: '/database/$id/tables', params: { id: databases.id } })
  }

  function onAdd() {
    setOpenConnections(false)
    router.navigate({ to: '/create' })
  }

  return (
    <CommandDialog open={openConnections} onOpenChange={setOpenConnections}>
      <CommandInput placeholder="Type a connection name..." />
      <CommandList>
        <CommandEmpty>No connections found.</CommandEmpty>
        {!!databases?.length && (
          <CommandGroup heading="Databases">
            {databases.map(database => (
              <CommandItem
                key={database.id}
                onSelect={() => onSelect(database)}
                onMouseOver={() => prefetchDatabaseCore(database)}
              >
                <DatabaseIcon type={database.type} className="size-4 shrink-0" />
                {database.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={onAdd}>
            <RiAddLine className="size-4 shrink-0 opacity-60" />
            Add New Connection...
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
