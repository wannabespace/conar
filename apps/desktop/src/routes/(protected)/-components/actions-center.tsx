import { getOS } from '@connnect/shared/utils/os'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@connnect/ui/components/command'
import { useKeyboardEvent } from '@react-hookz/web'
import { RiAddLine, RiDashboardLine } from '@remixicon/react'
import { useRouter } from '@tanstack/react-router'
import { Store, useStore } from '@tanstack/react-store'
import { DatabaseIcon, ensureDatabaseCore, useDatabases } from '~/entities/database'
import { trackEvent } from '~/lib/events'

const os = getOS()

export const actionsCenterStore = new Store({
  isOpen: false,
})

function setIsOpen(isOpen: boolean) {
  actionsCenterStore.setState(state => ({ ...state, isOpen }))
}

export function ActionsCenter() {
  const { data: databases } = useDatabases()
  const isOpen = useStore(actionsCenterStore, state => state.isOpen)
  const router = useRouter()

  useKeyboardEvent(e => e.key === 'p' && (os === 'macos' ? e.metaKey : e.ctrlKey), () => {
    if (!databases || databases.length === 0)
      return

    setIsOpen(!isOpen)
    trackEvent('actions_center_open_shortcut')
  })

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput placeholder="Type a command..." />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        <CommandGroup heading="Commands">
          <CommandItem
            onSelect={() => {
              setIsOpen(false)
              router.navigate({ to: '/' })
            }}
          >
            <RiDashboardLine className="size-4 shrink-0 opacity-60" />
            Dashboard
          </CommandItem>
        </CommandGroup>
        {!!databases?.length && (
          <CommandGroup heading="Databases">
            {databases.map(database => (
              <CommandItem
                key={database.id}
                onSelect={() => {
                  setIsOpen(false)
                  router.navigate({ to: '/database/$id/tables', params: { id: database.id } })
                }}
                onMouseOver={() => ensureDatabaseCore(database)}
              >
                <DatabaseIcon type={database.type} className="size-4 shrink-0" />
                {database.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              setIsOpen(false)
              router.navigate({ to: '/create' })
            }}
          >
            <RiAddLine className="size-4 shrink-0 opacity-60" />
            Add New Connection...
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
