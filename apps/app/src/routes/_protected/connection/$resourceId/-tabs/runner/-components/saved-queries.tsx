import {
  Delete02Icon,
  PencilEdit02Icon,
  PlayListAddIcon,
  Bookmark02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@tamery/ui/components/command'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import type { ComponentRef } from 'react'
import { useRef } from 'react'

import { useCollections } from '~/entities/collections'
import { openRunnerTab } from '~/entities/connection/store/helpers/tabs'
import type { Query } from '~/entities/query/sync'

import { useRunnerActions } from '../-lib/actions'
import {
  linkSavedQuery,
  runnerPageStore,
  setQuery,
  useRunnerPageStore,
} from '../-lib/store'
import { RemoveQueryDialog } from './remove-query-dialog'

const { useRouteContext } = getRouteApi(
  '/_protected/connection/$resourceId/$tabId'
)

const SEARCH_FROM = 8

export const SavedQueries = ({ onPicked }: { onPicked: () => void }) => {
  const { connectionResource } = useRouteContext()
  const { queriesCollection } = useCollections()
  const router = useRouter()
  const store = useRunnerPageStore()
  const { renameSaved } = useRunnerActions()
  const removeDialogRef = useRef<ComponentRef<typeof RemoveQueryDialog>>(null)
  const { data: queries } = useLiveQuery({
    query: (q) =>
      q
        .from({ queries: queriesCollection })
        .where(({ queries: rows }) =>
          eq(rows.connectionResourceId, connectionResource.id)
        )
        .orderBy(({ queries: rows }) => rows.createdAt, 'desc'),
  })

  const openInNewTab = (query: Query) => {
    const tabId = openRunnerTab(connectionResource.id)
    const tabStore = runnerPageStore({
      resourceId: connectionResource.id,
      tabId,
    })
    setQuery(tabStore, query.query)
    linkSavedQuery(tabStore, query.id)
    onPicked()
    router.navigate({
      params: { resourceId: connectionResource.id, tabId },
      to: '/connection/$resourceId/$tabId',
    })
  }

  const appendHere = (query: Query) => {
    const existing = store.get().query.trimEnd()
    setQuery(store, existing ? `${existing}\n\n${query.query}` : query.query)
    onPicked()
  }

  return (
    <Command loop>
      <RemoveQueryDialog ref={removeDialogRef} />
      {queries.length >= SEARCH_FROM && (
        <CommandInput placeholder="Search saved queries" autoFocus />
      )}
      <CommandList>
        <CommandEmpty className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-xs">
          <HugeiconsIcon
            icon={Bookmark02Icon}
            strokeWidth={2}
            className="size-5"
          />
          {queries.length === 0
            ? 'No saved queries yet'
            : 'No matching queries'}
        </CommandEmpty>
        <CommandGroup>
          {queries.map((query) => (
            <CommandItem
              key={query.id}
              value={query.id}
              keywords={[query.name, query.query]}
              className="pr-14"
              onSelect={() => openInNewTab(query)}
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span data-mask className="truncate">
                  {query.name}
                </span>
                <span
                  data-mask
                  className="text-2xs text-muted-foreground truncate font-mono"
                >
                  {query.query}
                </span>
              </div>
              <div className="absolute inset-y-0 right-1 my-auto flex h-fit items-center">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Append to this tab"
                        tabIndex={-1}
                        className="text-muted-foreground/60 hover:text-foreground"
                        onPointerDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                        }}
                        onClick={(event) => {
                          event.stopPropagation()
                          appendHere(query)
                        }}
                      />
                    }
                  >
                    <HugeiconsIcon icon={PlayListAddIcon} strokeWidth={2} />
                  </TooltipTrigger>
                  <TooltipContent side="top">Append to this tab</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Rename"
                        tabIndex={-1}
                        className="text-muted-foreground/60 hover:text-foreground"
                        onPointerDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                        }}
                        onClick={(event) => {
                          event.stopPropagation()
                          onPicked()
                          renameSaved(query)
                        }}
                      />
                    }
                  >
                    <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
                  </TooltipTrigger>
                  <TooltipContent side="top">Rename</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Delete"
                        tabIndex={-1}
                        className="text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive"
                        onPointerDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                        }}
                        onClick={(event) => {
                          event.stopPropagation()
                          removeDialogRef.current?.remove(query)
                        }}
                      />
                    }
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                  </TooltipTrigger>
                  <TooltipContent side="top">Delete</TooltipContent>
                </Tooltip>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
