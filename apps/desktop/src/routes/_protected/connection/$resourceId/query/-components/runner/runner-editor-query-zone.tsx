import type { connectionsResources } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { Checkbox } from '@conar/ui/components/checkbox'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { Separator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiCheckLine, RiFileCopyLine, RiSaveLine } from '@remixicon/react'
import { useIsFetching } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useState } from 'react'
import { connectionResourceStore } from '~/entities/connection/store'
import { queryClient } from '~/main'
import { runnerQueryOptions } from '.'

export function RunnerEditorQueryZone({
  connectionResource,
  onRun,
  onSave,
  onCopy,
  lineNumber,
}: {
  connectionResource: typeof connectionsResources.$inferSelect
  onRun: (index: number) => void
  onSave: () => void
  onCopy: () => void
  lineNumber: number
}) {
  const [isCopying, setIsCopying] = useState(false)
  const isFetching = useIsFetching(runnerQueryOptions(connectionResource), queryClient) > 0

  const store = connectionResourceStore(connectionResource.id)
  const isChecked = useStore(store, state => state.selectedLines.includes(lineNumber))

  const index = useStore(store, state => state.editorQueries.findIndex(query => query.startLineNumber === lineNumber))
  const { queriesLength, queryNumber } = useStore(store, (state) => {
    const queriesBefore = state.editorQueries.slice(0, index).reduce((sum, curr) => sum + curr.queries.length, 0) + 1
    const queriesLength = state.editorQueries[index]?.queries.length ?? 0

    return {
      queriesLength,
      queryNumber: queriesLength === 1 ? queriesBefore : `${queriesBefore} - ${queriesBefore + queriesLength - 1}`,
    }
  })

  const onCheckedChange = () => {
    store.setState(state => ({
      ...state,
      selectedLines: isChecked
        ? state.selectedLines.filter(l => l !== lineNumber)
        : [...state.selectedLines, lineNumber].toSorted((a, b) => a - b),
    } satisfies typeof state))
  }

  return (
    <div className={cn(
      'flex h-full items-center justify-between gap-2',
      'border-y px-2 py-1 pr-6',
    )}
    >
      <div className="flex flex-1 items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs">
            <Checkbox
              className="focus:outline-none!"
              checked={isChecked}
              onCheckedChange={() => onCheckedChange()}
            />
            Query
            {' '}
            {queryNumber}
          </label>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="focus:outline-none!"
                  onClick={() => onSave()}
                >
                  <RiSaveLine className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Save
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="focus:outline-none!"
                  onClick={() => {
                    onCopy()
                    setIsCopying(true)
                  }}
                >
                  <ContentSwitch
                    active={isCopying}
                    activeContent={<RiCheckLine className="text-success" />}
                    onSwitchEnd={() => setIsCopying(false)}
                  >
                    <RiFileCopyLine className="size-3.5" />
                  </ContentSwitch>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Copy
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Separator orientation="vertical" className="mx-1 h-4!" />
          {Array.from({ length: queriesLength }).map((_, idx) => {
            const buttonKey = `query-run-${connectionResource.id}-${lineNumber}-${idx}`
            return (
              <Button
                key={buttonKey}
                size="xs"
                className="focus:outline-none!"
                disabled={isFetching}
                onClick={() => onRun(idx)}
              >
                Run
                {' '}
                {queriesLength === 1 ? '' : idx + 1}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
