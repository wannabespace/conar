import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@connnect/ui/components/command'
import { ArrowLeftIcon } from '@connnect/ui/icons/arrow-left'
import { ArrowRightIcon } from '@connnect/ui/icons/arrow-right'
import { useKeyboardEvent } from '@react-hookz/web'
import { RiAddLine } from '@remixicon/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ConnectionIcon } from '~/components/connection-icon'
import { connectionQuery, connectionsQuery } from '~/queries/connections'
import { UserButton } from './user-button'

function Connections({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const { data: connections } = useSuspenseQuery(connectionsQuery())

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a connection name..." />
      <CommandList>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => setOpen(false)}>
            <RiAddLine className="size-4 shrink-0 opacity-60" />
            Add New Connection...
          </CommandItem>
        </CommandGroup>
        <CommandEmpty>No connections found.</CommandEmpty>
        <CommandGroup heading="Connections">
          {connections.map(connection => (
            <CommandItem key={connection.id}>
              <ConnectionIcon type={connection.type} className="size-4 shrink-0 opacity-60" />
              {connection.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

function ConnectionName({ id }: { id: string }) {
  const [openConnections, setOpenConnections] = useState(false)
  const { data: connection } = useSuspenseQuery(connectionQuery(id))
  const { data: connections } = useSuspenseQuery(connectionsQuery())

  useKeyboardEvent(e => e.key === 'l' && e.metaKey, () => {
    if (connections.length === 0)
      return

    setOpenConnections(open => !open)
  })

  return (
    <>
      <Connections open={openConnections} setOpen={setOpenConnections} />
      <button
        type="button"
        className="flex items-center py-1 gap-2 font-medium rounded-md text-sm cursor-pointer"
        onClick={() => setOpenConnections(true)}
      >
        <ConnectionIcon type={connection.type} className="size-4" />
        {connection.name}
        <CommandShortcut>⌘L</CommandShortcut>
      </button>
    </>
  )
}

export function Navbar() {
  const router = useRouter()
  const params = useParams({ strict: false })

  return (
    <>
      <div className="h-10" />
      <div className="fixed top-0 border-b border-border bg-background inset-x-0 z-50 flex items-center h-10 justify-between pe-2">
        <div className="w-20 h-full [app-region:drag]" />
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!router.history.canGoBack()}
            onClick={() => router.history.back()}
          >
            <ArrowLeftIcon className="[&>svg]:size-4 p-1.5 rounded-md hover:bg-accent cursor-pointer opacity-70" />
          </button>
          <button
            type="button"
            disabled={router.history.length <= 1}
            onClick={() => router.history.forward()}
          >
            <ArrowRightIcon className="[&>svg]:size-4 p-1.5 rounded-md hover:bg-accent cursor-pointer opacity-70" />
          </button>
        </div>
        <div className="flex-1 h-full [app-region:drag]" />
        {params.id ? <ConnectionName id={params.id} /> : <div />}
        <div className="flex-1 h-full [app-region:drag]" />
        <UserButton />
      </div>
    </>
  )
}
