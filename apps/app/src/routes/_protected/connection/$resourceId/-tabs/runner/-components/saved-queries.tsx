import {
  Delete02Icon,
  PencilEdit02Icon,
  PlayListAddIcon,
  Bookmark02Icon,
} from '@hugeicons/core-free-icons'
import {
  CommandGroup,
  CommandItem,
  CommandList,
} from '@tamery/ui/components/command'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import type { ComponentRef } from 'react'
import { useRef } from 'react'

import { useCollections } from '~/entities/collections'
import { openRunnerTab } from '~/entities/connection/store/helpers/tabs'
import type { Query } from '~/entities/query/sync'

import { useRunnerActions } from '../-lib/actions'
import {
  appendQuery,
  runnerPageStore,
  setQuery,
  useRunnerPageStore,
} from '../-lib/store'
import { ListEmpty, PopoverCommand, RowAction } from './popover-list'
import { RemoveQueryDialog } from './remove-query-dialog'

const { useRouteContext } = getRouteApi(
  '/_protected/connection/$resourceId/$tabId'
)

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
    onPicked()
    router.navigate({
      params: { resourceId: connectionResource.id, tabId },
      to: '/connection/$resourceId/$tabId',
    })
  }

  return (
    <>
      <RemoveQueryDialog ref={removeDialogRef} />
      <PopoverCommand
        count={queries.length}
        searchPlaceholder="Search saved queries"
      >
        <CommandList>
          <ListEmpty icon={Bookmark02Icon}>
            {queries.length === 0
              ? 'No saved queries yet'
              : 'No matching queries'}
          </ListEmpty>
          <CommandGroup>
            {queries.map((query) => (
              <CommandItem
                key={query.id}
                value={query.id}
                keywords={[query.name, query.query]}
                onSelect={() => openInNewTab(query)}
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span data-mask className="truncate">
                    {query.name}
                  </span>
                  <span
                    data-mask
                    className="text-2xs text-muted-foreground truncate"
                  >
                    {query.query}
                  </span>
                </div>
                <div className="flex shrink-0 items-center">
                  <RowAction
                    icon={PlayListAddIcon}
                    label="Append to this tab"
                    onClick={() => {
                      appendQuery(store, query.query)
                      onPicked()
                    }}
                  />
                  <RowAction
                    icon={PencilEdit02Icon}
                    label="Rename"
                    onClick={() => {
                      onPicked()
                      renameSaved(query)
                    }}
                  />
                  <RowAction
                    destructive
                    icon={Delete02Icon}
                    label="Delete"
                    onClick={() => removeDialogRef.current?.remove(query)}
                  />
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </PopoverCommand>
    </>
  )
}
