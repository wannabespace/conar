import type { Database } from '~/lib/indexeddb'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@connnect/ui/components/command'
import { Separator } from '@connnect/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { cn } from '@connnect/ui/lib/utils'
import { useKeyboardEvent } from '@react-hookz/web'
import { RiAddLine, RiArrowLeftSLine, RiArrowRightSLine, RiHomeLine, RiMoonLine, RiSunLine } from '@remixicon/react'
import { useParams, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { DatabaseIcon, databaseQuery, useDatabase, useDatabases } from '~/entities/database'
import { queryClient } from '~/main'
import { UpdatesButton } from '~/updates-provider'
import { ThemeToggle } from './theme-toggle'
import { UserButton } from './user-button'

function Connections({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const { data: databases } = useDatabases()
  const router = useRouter()

  function onSelect(databases: Database) {
    setOpen(false)
    if (databases.type === 'postgres')
      router.navigate({ to: '/database/$id', params: { id: databases.id } })
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
        {!!databases?.length && (
          <CommandGroup heading="Databases">
            {databases.map(databases => (
              <CommandItem
                key={databases.id}
                onSelect={() => onSelect(databases)}
                onMouseOver={() => queryClient.prefetchQuery(databaseQuery(databases.id))}
              >
                <DatabaseIcon type={databases.type} className="size-4 shrink-0" />
                {databases.name}
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

function DatabaseName({ className, id }: { className?: string, id: string }) {
  const { data: database } = useDatabase(id)

  return (
    <div className={cn('flex items-center py-1 gap-2 font-medium rounded-md text-sm cursor-pointer', className)}>
      <DatabaseIcon type={database.type} className="size-4" />
      {database.name}
      <CommandShortcut>⌘L</CommandShortcut>
    </div>
  )
}

function NavbarButton({ children, ...props }: React.ComponentProps<'button'>) {
  return (
    <button type="button" className="p-1.5 rounded-md hover:bg-muted cursor-pointer [&>*]:opacity-70 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" {...props}>
      {children}
    </button>
  )
}

export function Navbar() {
  const router = useRouter()
  const params = useParams({ strict: false })
  const [openConnections, setOpenConnections] = useState(false)
  const { data: databases } = useDatabases()

  useKeyboardEvent(e => e.key === 'd' && e.metaKey, () => {
    router.navigate({ to: '/' })
  })

  useKeyboardEvent(e => e.key === 'ArrowRight' && e.metaKey, () => {
    if (router.history.length > 1) {
      router.history.forward()
    }
  })

  useKeyboardEvent(e => e.key === 'ArrowLeft' && e.metaKey, () => {
    if (router.history.length > 1) {
      router.history.back()
    }
  })

  useKeyboardEvent(e => e.key === 'l' && e.metaKey, () => {
    if (!databases || databases.length === 0)
      return

    setOpenConnections(open => !open)
  })

  return (
    <>
      <div className="h-10" />
      <Connections open={openConnections} setOpen={setOpenConnections} />
      <div className="fixed top-0 inset-x-0 z-50 flex items-center h-10 justify-between pe-3">
        <div className="w-20 h-full [app-region:drag]" />
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <NavbarButton
                  disabled={!router.history.canGoBack()}
                  onClick={() => router.history.back()}
                >
                  <RiArrowLeftSLine className="size-4" />
                </NavbarButton>
              </TooltipTrigger>
              <TooltipContent>
                <CommandShortcut>⌘←</CommandShortcut>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <NavbarButton
                  disabled={router.history.length <= 1}
                  onClick={() => router.history.forward()}
                >
                  <RiArrowRightSLine className="size-4" />
                </NavbarButton>
              </TooltipTrigger>
              <TooltipContent>
                <CommandShortcut>⌘→</CommandShortcut>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Separator orientation="vertical" className="h-4 mx-2" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <NavbarButton onClick={() => router.navigate({ to: '/' })}>
                  <RiHomeLine className="size-4" />
                </NavbarButton>
              </TooltipTrigger>
              <TooltipContent>
                <CommandShortcut>⌘D</CommandShortcut>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {params.id && (
          <DatabaseName
            id={params.id}
            className="absolute z-20 left-1/2 -translate-x-1/2"
          />
        )}
        <div className="flex-1 h-full [app-region:drag]" />
        <div className="flex items-center gap-2">
          <UpdatesButton />
          <Separator orientation="vertical" className="h-4 mx-2" />
          <ThemeToggle>
            <NavbarButton>
              <RiSunLine className="size-4 dark:hidden" />
              <RiMoonLine className="size-4 hidden dark:block" />
              <span className="sr-only">Toggle theme</span>
            </NavbarButton>
          </ThemeToggle>
          <Separator orientation="vertical" className="h-4 mx-2" />
          <UserButton />
        </div>
      </div>
    </>
  )
}
