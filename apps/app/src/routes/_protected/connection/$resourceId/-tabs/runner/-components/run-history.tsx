import { Delete02Icon, HistoryIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Command,
  CommandEmpty,
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
import { getRouteApi } from '@tanstack/react-router'
import { formatDistanceToNowStrict } from 'date-fns'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'

import { useRunnerActions } from '../-lib/actions'
import { runHistory } from '../-lib/history'
import { setQuery, useRunnerPageStore } from '../-lib/store'

const { useRouteContext } = getRouteApi(
  '/_protected/connection/$resourceId/$tabId'
)

const SEARCH_FROM = 8

/** Statements run against this resource, newest first; picking one appends it to the tab. */
export const RunHistoryButton = () => {
  const { connectionResource } = useRouteContext()
  const store = useRunnerPageStore()
  const { focus } = useRunnerActions()
  const history = useSubscription(runHistory.of(connectionResource.id))
  const [open, setOpen] = useState(false)

  const append = (sql: string) => {
    const existing = store.get().query.trimEnd()
    setQuery(store, existing ? `${existing}\n\n${sql};` : `${sql};`)
    setOpen(false)
    focus()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="ghost" size="sm" />}>
        <HugeiconsIcon icon={HistoryIcon} strokeWidth={2} />
        History
      </PopoverTrigger>
      <PopoverContent align="end" padding="none" className="w-96">
        <Command loop>
          {history.length >= SEARCH_FROM && (
            <CommandInput placeholder="Search history" autoFocus />
          )}
          <CommandList>
            <CommandEmpty className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-xs">
              <HugeiconsIcon
                icon={HistoryIcon}
                strokeWidth={2}
                className="size-5"
              />
              {history.length === 0
                ? 'Statements you run show up here'
                : 'No matching statements'}
            </CommandEmpty>
            <CommandGroup>
              {history.map((entry) => (
                <CommandItem
                  key={entry.id}
                  value={entry.id}
                  keywords={[entry.sql]}
                  onSelect={() => append(entry.sql)}
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span data-mask className="truncate font-mono text-xs">
                      {entry.sql}
                    </span>
                    <span className="text-2xs text-muted-foreground tabular-nums">
                      {formatDistanceToNowStrict(entry.ranAt, {
                        addSuffix: true,
                      })}
                      {' · '}
                      {entry.error === null ? (
                        `${entry.duration.toFixed(0)} ms`
                      ) : (
                        <span className="text-destructive">Failed</span>
                      )}
                    </span>
                  </div>
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
