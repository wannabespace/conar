import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@connnect/ui/components/command'
import { Separator } from '@connnect/ui/components/separator'
import { cn } from '@connnect/ui/lib/utils'
import { useKeyboardEvent } from '@react-hookz/web'
import { RiAddLine, RiArrowLeftSLine, RiArrowRightSLine, RiHomeLine } from '@remixicon/react'
import { useParams, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ConnectionIcon } from '~/components/connection-icon'
import { useConnection, useConnections } from '~/entities/connection'
import { UserButton } from './user-button'

function Connections({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const { data: connections } = useConnections()
  const router = useRouter()

  function onSelect(id: string) {
    setOpen(false)
    router.navigate({ to: '/connections/$id', params: { id } })
  }

  function onAdd() {
    setOpen(false)
    router.navigate({ to: '/create' })
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a connection name..." />
      <CommandList>
        <CommandEmpty>No connections found.</CommandEmpty>
        {!!connections?.length && (
          <CommandGroup heading="Connections">
            {connections.map(connection => (
              <CommandItem key={connection.id} onSelect={() => onSelect(connection.id)}>
                <ConnectionIcon type={connection.type} className="size-4 shrink-0" />
                {connection.name}
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

function ConnectionName({ className, id }: { className?: string, id: string }) {
  const { data: connection } = useConnection(id)

  if (!connection)
    return null

  return (
    <div className={cn('flex items-center py-1 gap-2 font-medium rounded-md text-sm cursor-pointer', className)}>
      <ConnectionIcon type={connection.type} className="size-4" />
      {connection.name}
      <CommandShortcut>⌘L</CommandShortcut>
    </div>
  )
}

function NavbarButton({ children, ...props }: React.ComponentPropsWithoutRef<'button'>) {
  return (
    <button type="button" className="p-1.5 rounded-md hover:bg-accent cursor-pointer opacity-70" {...props}>
      {children}
    </button>
  )
}

export function Navbar() {
  const router = useRouter()
  const params = useParams({ strict: false })
  const [openConnections, setOpenConnections] = useState(false)
  const { data: connections } = useConnections()

  useKeyboardEvent(e => e.key === 'l' && e.metaKey, () => {
    if (!connections || connections.length === 0)
      return

    setOpenConnections(open => !open)
  })

  return (
    <>
      <div className="h-10" />
      <Connections open={openConnections} setOpen={setOpenConnections} />
      <div className="fixed top-0 inset-x-0 z-50 flex items-center h-10 justify-between pe-2">
        <div className="w-20 h-full [app-region:drag]" />
        <div className="flex items-center gap-1">
          <NavbarButton
            disabled={!router.history.canGoBack()}
            onClick={() => router.history.back()}
          >
            <RiArrowLeftSLine className="size-4" />
          </NavbarButton>
          <NavbarButton
            disabled={router.history.length <= 1}
            onClick={() => router.history.forward()}
          >
            <RiArrowRightSLine className="size-4" />
          </NavbarButton>
          <Separator orientation="vertical" className="h-4 mx-2" />
          <NavbarButton onClick={() => router.navigate({ to: '/' })}>
            <RiHomeLine className="size-4" />
          </NavbarButton>
        </div>
        {params.id && (
          <ConnectionName
            id={params.id}
            className="absolute z-20 left-1/2 -translate-x-1/2"
          />
        )}
        <div className="flex-1 h-full [app-region:drag]" />
        <UserButton />
      </div>
    </>
  )
}
