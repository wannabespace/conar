import { Search01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandPrimitive,
} from '@tamery/ui/components/command'
import { KbdHotkey } from '@tamery/ui/components/custom/shortcuts'
import { Spinner } from '@tamery/ui/components/spinner'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useRouter } from '@tanstack/react-router'
import { useFetchSearch } from 'fumadocs-core/search/client'
import { useState, useSyncExternalStore } from 'react'

import { docsLinkProps } from './docs-link'

const emptySubscribe = () => () => false

const useUserAgent = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => navigator.userAgent,
    () => ''
  )

const rowsOf = (
  items: NonNullable<ReturnType<typeof useFetchSearch>['data']>['items']
) => items.flatMap((item) => (item.type === 'table' ? item.rows : [item]))

export const Search = () => {
  const [open, setOpen] = useState(false)
  const userAgent = useUserAgent()
  const router = useRouter()
  const { data, isLoading, onSearchChange, search } = useFetchSearch()
  const rows = data ? rowsOf(data.items).slice(0, 20) : []

  useHotkey('Mod+K', (event) => {
    event.preventDefault()
    setOpen((current) => !current)
  })

  return (
    <>
      <Button
        aria-label="Search"
        onClick={() => setOpen(true)}
        variant="outline"
      >
        {userAgent ? (
          <KbdHotkey hotkey="Mod+K" userAgent={userAgent} />
        ) : (
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
        )}
      </Button>
      <CommandDialog
        description="Search the documentation"
        onOpenChange={setOpen}
        open={open}
        title="Search docs"
      >
        <Command className="min-h-0" shouldFilter={false} variant="transparent">
          <div className="flex shrink-0 items-center gap-3 border-b px-4">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="text-muted-foreground size-4 shrink-0"
            />
            <CommandPrimitive.Input
              data-slot="command-input"
              className="placeholder:text-muted-foreground h-12 min-w-0 flex-1 bg-transparent text-sm outline-hidden"
              onValueChange={onSearchChange}
              placeholder="Search docs"
              value={search}
            />
          </div>
          <CommandList>
            {!isLoading && search.length === 0 && (
              <p className="text-muted-foreground px-4 py-6 text-sm">
                Search pages and headings
              </p>
            )}
            {isLoading && (
              <div className="flex justify-center py-6">
                <Spinner className="text-muted-foreground" />
              </div>
            )}
            {!isLoading && search.length > 0 && rows.length === 0 && (
              <CommandEmpty>No results</CommandEmpty>
            )}
            {rows.length > 0 && (
              <CommandGroup>
                {rows.map((row) => (
                  <CommandItem
                    key={row.id}
                    onSelect={() => {
                      setOpen(false)
                      void router.navigate(docsLinkProps(row.url))
                    }}
                    value={row.id}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{row.content}</span>
                      {row.breadcrumbs && row.breadcrumbs.length > 0 && (
                        <span className="text-muted-foreground truncate text-xs">
                          {row.breadcrumbs.join(' · ')}
                        </span>
                      )}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
