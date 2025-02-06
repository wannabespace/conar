import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@connnect/ui/components/command'
import { useKeyboardEvent } from '@react-hookz/web'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { databasesQuery } from '~/queries/databases'
import { UserButton } from './user-button'

export function Navbar() {
  const [open, setOpen] = useState(false)

  useKeyboardEvent(e => e.key === 'l' && e.metaKey, () => setOpen(open => !open))

  const { data: databases } = useQuery({
    ...databasesQuery(),
    select: data => Object.entries(Object.groupBy(data, db => db.type)),
  })

  return (
    <div className="flex items-center h-10 justify-between me-1">
      <div className="flex-1 h-full [app-region:drag]" />
      {databases?.length
        ? (
            <button
              type="button"
              className="flex items-center py-1 gap-2 font-medium rounded-md px-3 text-sm cursor-pointer"
              onClick={() => setOpen(true)}
            >
              Connnect
              <CommandShortcut>⌘L</CommandShortcut>
            </button>
          )
        : <div />}
      <div className="flex-1 h-full [app-region:drag]" />
      <UserButton />
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a connection name..." />
        <CommandList>
          {/* <CommandGroup heading="Actions">
            <CommandItem onSelect={() => setOpen(false)}>
              <RiAddLine className="size-4 shrink-0 opacity-60" />
              Add New Connection...
            </CommandItem>
          </CommandGroup> */}
          <CommandEmpty>No connections found.</CommandEmpty>
          {databases?.map(([type, databases]) => (
            <CommandGroup key={type} heading={type}>
              {databases.map(database => (
                <CommandItem key={database.id}>{database.name}</CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </div>
  )
}
