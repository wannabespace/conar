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
  const { database } = Route.useRouteContext()
  const { data } = useLiveQuery(q => q
    .from({ queries: queriesCollection })
    .where(({ queries }) => eq(queries.databaseId, database.id))
    .orderBy(({ queries }) => queries.createdAt, 'desc'))
  const [movedId, setMovedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const removeQueryDialogRef = useRef<ComponentRef<typeof RemoveQueryDialog>>(null)

  return (
    <div className={cn('flex flex-col h-full', className)} {...props}>
      <RemoveQueryDialog ref={removeQueryDialogRef} />
      <CardTitle className="py-2 px-4">
        Saved Queries
      </CardTitle>
      <Separator />
      <ScrollArea className="flex-1 py-2">
        {data.length > 0
          ? (
              <div className="space-y-1">
                {data.map(query => (
                  <div key={query.id} className="w-full flex items-center gap-2 px-4 py-1">
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
                              activeContent={<RiCheckLine className="size-4 text-success" />}
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
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="font-medium truncate text-sm">{query.name}</div>
                      <div
                        data-mask
                        className="text-xs text-muted-foreground max-w-full truncate"
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
                              activeContent={<RiCheckLine className="size-4 text-success" />}
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
              <div className="flex flex-col max-w-56 mx-auto items-center justify-center h-full py-12 px-6 text-center">
                <span className="mb-2">No saved queries found.</span>
                <span className="text-xs text-muted-foreground">
                  You can add a new query by pressing the
                  {' '}
                  <RiSaveLine className="size-4 inline-block" />
                  {' '}
                  button.
                </span>
              </div>
            )}
      </ScrollArea>
    </div>
  )
}
