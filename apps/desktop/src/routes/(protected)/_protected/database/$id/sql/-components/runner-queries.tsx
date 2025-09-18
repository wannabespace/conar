import type { ComponentProps, ComponentRef } from 'react'
import { Button } from '@conar/ui/components/button'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowLeftDoubleLine, RiCheckLine, RiDeleteBin7Line, RiFileCopyLine, RiMoreLine, RiSaveLine } from '@remixicon/react'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useRef, useState } from 'react'
import { queriesCollection } from '~/entities/query/sync'
import { Route } from '..'
import { pageStore } from '../-lib'
import { RemoveQueryDialog } from './remove-query-dialog'

export function RunnerQueries({ className, ...props }: ComponentProps<'div'>) {
  const { database } = Route.useRouteContext()
  const { data } = useLiveQuery(q => q
    .from({ queries: queriesCollection })
    .where(({ queries }) => eq(queries.databaseId, database.id))
    .orderBy(({ queries }) => queries.createdAt, 'desc'))
  const [movedId, setMovedId] = useState<string | null>(null)

  const removeQueryDialogRef = useRef<ComponentRef<typeof RemoveQueryDialog>>(null)

  return (
    <div className={cn('flex flex-col h-full', className)} {...props}>
      <RemoveQueryDialog ref={removeQueryDialogRef} />
      <ScrollArea className="flex-1 p-2">
        {data.length > 0
          ? (
              <ul className="space-y-1">
                {data.map(query => (
                  <li
                    key={query.id}
                    className={cn(
                      'group w-full flex items-center gap-2 border border-transparent py-1 px-2 text-sm text-foreground rounded-md hover:bg-accent/60 transition',
                    )}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => {
                              pageStore.setState(state => ({
                                ...state,
                                query: query.query,
                              }))
                              setMovedId(query.id)
                            }}
                          >
                            <ContentSwitch
                              active={movedId === query.id}
                              activeContent={<RiCheckLine className="size-4 text-success" />}
                              onActiveChange={() => {
                                setMovedId(null)
                              }}
                            >
                              <RiArrowLeftDoubleLine className="size-4" />
                            </ContentSwitch>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          Move to runner
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="font-medium truncate">{query.name}</div>
                      <div
                        data-mask
                        className="text-xs text-muted-foreground max-w-full overflow-x-auto truncate"
                        title={query.query}
                      >
                        {query.query}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="opacity-0 group-hover:opacity-100 ml-1 transition-opacity"
                          onClick={e => e.stopPropagation()}
                        >
                          <RiMoreLine className="size-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-40">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            copy(query.query, 'Query successfully copied')
                          }}
                        >
                          <RiFileCopyLine className="size-4" />
                          Copy Query
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeQueryDialogRef.current?.remove(query)
                          }}
                        >
                          <RiDeleteBin7Line className="size-4" />
                          Delete Query
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                ))}
              </ul>
            )
          : (
              <div className="flex flex-col max-w-56 mx-auto items-center justify-center h-full py-12 text-muted-foreground text-center">
                <span className="text-smk mb-2">No saved queries found.</span>
                <span className="text-xs">
                  You can add a new query by pressing the
                  {' '}
                  <RiSaveLine className="size-4 inline-block" />
                  {' '}
                  button at the bottom of the runner.
                </span>
              </div>
            )}
      </ScrollArea>
    </div>
  )
}
