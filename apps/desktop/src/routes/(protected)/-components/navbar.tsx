import { Badge } from '@connnect/ui/components/badge'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@connnect/ui/components/command'
import { useKeyboardEvent } from '@react-hookz/web'
import { RiArrowLeftLine, RiArrowRightLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { databasesQuery } from '~/queries/databases'
import { UserButton } from './user-button'

function Connections({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const { data: databases } = useQuery({
    ...databasesQuery(),
    select: data => Object.entries(Object.groupBy(data, db => db.type)),
  })

  return (
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
  )
}

export function Navbar() {
  const [openConnections, setOpenConnections] = useState(false)
  const { data: databases } = useQuery(databasesQuery())
  const router = useRouter()

  useKeyboardEvent(e => e.key === 'l' && e.metaKey, () => {
    if (!databases || databases.length === 0)
      return

    setOpenConnections(open => !open)
  })

  return (
    <>
      <div className="h-10" />
      <div className="fixed top-0 inset-x-0 z-50 flex items-center h-10 justify-between pe-2">
        <div className="w-22 h-full [app-region:drag]" />
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1.5 rounded-md hover:bg-accent cursor-pointer"
            disabled={!router.history.canGoBack()}
            onClick={() => router.history.back()}
          >
            <RiArrowLeftLine className="size-3 opacity-50" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-md hover:bg-accent cursor-pointer"
            disabled={router.history.length <= 1}
            onClick={() => router.history.forward()}
          >
            <RiArrowRightLine className="size-3 opacity-50" />
          </button>
        </div>
        <div className="flex-1 h-full [app-region:drag]" />
        {databases?.length
          ? (
              <button
                type="button"
                className="flex items-center py-1 gap-2 font-medium rounded-md text-sm cursor-pointer"
                onClick={() => setOpenConnections(true)}
              >
                Connnect
                <Badge variant="outline" className="ml-2">
                  Postgres
                </Badge>
                <CommandShortcut>⌘L</CommandShortcut>
              </button>
            )
          : <div />}
        <div className="flex-1 h-full [app-region:drag]" />
        <UserButton />
        <Connections open={openConnections} setOpen={setOpenConnections} />
      </div>
    </>
  )
}
