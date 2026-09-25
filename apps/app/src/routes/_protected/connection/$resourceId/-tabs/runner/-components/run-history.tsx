import {
  Cancel01Icon,
  Delete02Icon,
  HistoryIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@tamery/ui/components/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@tamery/ui/components/popover'
import { cn } from '@tamery/ui/lib/utils'
import { getRouteApi } from '@tanstack/react-router'
import { formatDistanceToNowStrict } from 'date-fns'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'

import { useRunnerActions } from '../-lib/actions'
import { runHistory } from '../-lib/history'
import { appendQuery, useRunnerPageStore } from '../-lib/store'
import { ListEmpty, RowAction, SEARCH_FROM } from './popover-list'

const { useRouteContext } = getRouteApi(
  '/_protected/connection/$resourceId/$tabId'
)

export const RunHistoryButton = () => {
  const { connectionResource } = useRouteContext()
  const store = useRunnerPageStore()
  const { focus } = useRunnerActions()
  const history = useSubscription(runHistory.of(connectionResource.id))
  const [open, setOpen] = useState(false)

  const append = (sql: string) => {
    appendQuery(store, `${sql};`)
    setOpen(false)
    focus()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          />
        }
      >
        <HugeiconsIcon icon={HistoryIcon} strokeWidth={2} />
        History
      </PopoverTrigger>
      <PopoverContent align="end" padding="none" className="w-96">
        <Command loop>
          {history.length >= SEARCH_FROM && (
            <CommandInput placeholder="Search history" autoFocus />
          )}
          <CommandList>
            <ListEmpty icon={HistoryIcon}>
              {history.length === 0
                ? 'Statements you run show up here'
                : 'No matching statements'}
            </ListEmpty>
            <CommandGroup>
              {history.map((entry) => (
                <CommandItem
                  key={entry.id}
                  value={entry.id}
                  keywords={[entry.sql]}
                  onSelect={() => append(entry.sql)}
                >
                  <span
                    className={cn(
                      'mt-1.25 size-1.5 shrink-0 self-start rounded-full',
                      entry.error !== null && 'bg-destructive'
                    )}
                  >
                    {entry.error !== null && (
                      <span className="sr-only">Failed</span>
                    )}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span data-mask className="truncate">
                      {entry.sql}
                    </span>
                    <span className="text-2xs text-muted-foreground tabular-nums">
                      {formatDistanceToNowStrict(entry.ranAt, {
                        addSuffix: true,
                      })}
                      {entry.error === null &&
                        ` · ${entry.duration.toFixed(0)} ms`}
                    </span>
                  </div>
                  <RowAction
                    destructive
                    icon={Cancel01Icon}
                    label="Remove from history"
                    onClick={() =>
                      runHistory.remove(connectionResource.id, entry.id)
                    }
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            {history.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="clear-history"
                    onSelect={() => runHistory.clear(connectionResource.id)}
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                    Clear history
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
