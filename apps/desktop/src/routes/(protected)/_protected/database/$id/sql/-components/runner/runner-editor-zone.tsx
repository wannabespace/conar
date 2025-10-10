import type { databases } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { Checkbox } from '@conar/ui/components/checkbox'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiCheckLine, RiFileCopyLine, RiSaveLine } from '@remixicon/react'
import { useIsFetching } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useState } from 'react'
import { queryClient } from '~/main'
import { runnerQueryOptions } from '.'
import { pageStore, queries } from '../../-lib'

export function RunnerEditorZone({
  database,
  onRun,
  onSave,
  onCopy,
  lineNumber,
}: {
  database: typeof databases.$inferSelect
  onRun: (index: number) => void
  onSave: () => void
  onCopy: () => void
  lineNumber: number
}) {
  const [isCopying, setIsCopying] = useState(false)
  const isChecked = useStore(pageStore, state => state.selectedLines.includes(lineNumber))
  const startFrom = useStore(queries, (state) => {
    const index = state.findIndex(query => query.lineNumber === lineNumber)
    const queriesBefore = state.slice(0, index).reduce((sum, curr) => sum + curr.queries.length, 0)
    return queriesBefore + 1
  })
  const queriesAmount = useStore(queries, state => state.find(query => query.lineNumber === lineNumber)?.queries.length || 0)
  const isFetching = useIsFetching(runnerQueryOptions({ database }), queryClient) > 0

  const onCheckedChange = () => {
    pageStore.setState(state => ({
      ...state,
      selectedLines: state.selectedLines.includes(lineNumber)
        ? state.selectedLines.filter(l => l !== lineNumber)
        : [...state.selectedLines, lineNumber].toSorted((a, b) => a - b),
    }))
  }

  return (
    <div className={cn(
      'flex gap-2 items-center justify-between h-full',
      'px-2 pr-6 py-1 border-y',
    )}
    >
      <div className="flex-1 flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            className="focus:outline-none!"
            checked={isChecked}
            onCheckedChange={() => onCheckedChange()}
          />
          Query
          {' '}
          {queriesAmount === 1 ? startFrom : `${startFrom} - ${startFrom + queriesAmount - 1}`}
        </label>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon-xs"
                  className="focus:outline-none!"
                  onClick={() => onSave()}
                >
                  <RiSaveLine />
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
                  variant="secondary"
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
                    <RiFileCopyLine />
                  </ContentSwitch>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Copy
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {Array.from({ length: queriesAmount }).map((_, index) => (
            <Button
              key={index}
              size="xs"
              className="focus:outline-none!"
              disabled={isFetching}
              onClick={() => onRun(index)}
            >
              Run
              {' '}
              {queriesAmount === 1 ? '' : index + 1}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
