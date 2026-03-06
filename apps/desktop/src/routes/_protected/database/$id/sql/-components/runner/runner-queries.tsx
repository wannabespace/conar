import type { ComponentProps, ComponentRef } from 'react'
import { Button } from '@conar/ui/components/button'
import { CardTitle } from '@conar/ui/components/card'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Separator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiCheckLine, RiDeleteBin7Line, RiFileCopyLine, RiPlayListAddLine, RiSaveLine } from '@remixicon/react'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useRef, useState } from 'react'
import { queriesCollection } from '~/entities/query/sync'
import { Route } from '../..'
import { runnerHooks } from '../../-page'
import { RemoveQueryDialog } from './remove-query-dialog'

export function RunnerQueries({ className, ...props }: ComponentProps<'div'>) {
  const { connection } = Route.useRouteContext()
  const { data } = useLiveQuery(q => q
    .from({ queries: queriesCollection })
    .where(({ queries }) => eq(queries.connectionId, connection.id))
    .orderBy(({ queries }) => queries.createdAt, 'desc'))
  const [movedId, setMovedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const removeQueryDialogRef = useRef<ComponentRef<typeof RemoveQueryDialog>>(null)

  return (
    <div className={cn('flex h-full flex-col', className)} {...props}>
      <RemoveQueryDialog ref={removeQueryDialogRef} />
      <CardTitle className="px-4 py-2">
        Saved Queries
      </CardTitle>
      <Separator />
      <ScrollArea className="flex-1 py-2">
        {data.length > 0
          ? (
              <div className="space-y-1">
                {data.map(query => (
                  <div
                    key={query.id}
                    className="flex w-full items-center gap-2 px-4 py-1"
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => {
                              runnerHooks.callHook('appendToBottomAndFocus', `-- ${query.name}\n${query.query}`)
                              setMovedId(query.id)
                            }}
                          >
                            <ContentSwitch
                              active={movedId === query.id}
                              activeContent={(
                                <RiCheckLine className="size-4 text-success" />
                              )}
                              onSwitchEnd={() => {
                                setMovedId(null)
                              }}
                            >
                              <RiPlayListAddLine className="size-4" />
                            </ContentSwitch>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          Append to bottom of runner
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="truncate text-sm font-medium">{query.name}</div>
                      <div
                        data-mask
                        className={`
                          max-w-full truncate text-xs text-muted-foreground
                        `}
                        title={query.query}
                      >
                        {query.query}
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              copy(query.query)
                              setCopiedId(copiedId === query.id ? null : query.id)
                            }}
                          >
                            <ContentSwitch
                              active={copiedId === query.id}
                              activeContent={(
                                <RiCheckLine className="size-4 text-success" />
                              )}
                              onSwitchEnd={() => setCopiedId(null)}
                            >
                              <RiFileCopyLine className="size-4" />
                            </ContentSwitch>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy Query</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            className={`
                              -mr-1 transition-none
                              group-hover:opacity-100
                              hover:text-destructive
                            `}
                            size="icon-sm"
                            onClick={() => {
                              removeQueryDialogRef.current?.remove(query)
                            }}
                            data-variant="destructive"
                          >
                            <RiDeleteBin7Line className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Query</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            )
          : (
              <div className={`
                mx-auto flex h-full max-w-56 flex-col items-center
                justify-center px-6 py-12 text-center
              `}
              >
                <span className="mb-2">No saved queries found.</span>
                <span className="text-xs text-muted-foreground">
                  You can add a new query by pressing the
                  {' '}
                  <RiSaveLine className="inline-block size-4" />
                  {' '}
                  button.
                </span>
              </div>
            )}
      </ScrollArea>
    </div>
  )
}
