import { RefreshButton } from '@conar/ui/components/custom/refresh-button'
import { Input } from '@conar/ui/components/input'
import { ScrollArea } from '@conar/ui/components/scroll-area'
import { Skeleton } from '@conar/ui/components/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'

export function RedisKeyList({
  keys,
  keysLoading,
  keysFetching,
  keysUpdatedAt,
  pattern,
  setPattern,
  selectedKey,
  setSelectedKey,
  refetchKeys,
}: {
  keys: string[]
  keysLoading: boolean
  keysFetching: boolean
  keysUpdatedAt?: number
  pattern: string
  setPattern: (v: string) => void
  selectedKey: string | null
  setSelectedKey: (k: string) => void
  refetchKeys: () => void
}) {
  return (
    <div className="flex h-full flex-col border-r">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <Input
          placeholder="Pattern (e.g. * or user:*)"
          value={pattern}
          onChange={e => setPattern(e.target.value)}
          className="h-9 min-w-0 flex-1 font-mono text-xs"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <RefreshButton
                variant="outline"
                size="icon"
                className="size-9 shrink-0 rounded-md"
                onClick={refetchKeys}
                refreshing={keysFetching}
              />
            </TooltipTrigger>
            <TooltipContent side="right">
              Refresh keys
              <p className="text-xs text-muted-foreground">
                Last updated:
                {' '}
                {keysUpdatedAt && keysUpdatedAt > 0 ? new Date(keysUpdatedAt).toLocaleTimeString() : 'never'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <ScrollArea className="flex-1">
        {keysLoading
          ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            )
          : keys.length === 0
            ? (
                <div className="
                  flex flex-col items-center justify-center p-6 text-center
                "
                >
                  <span className="text-sm font-medium text-muted-foreground">No keys found</span>
                  <span className="mt-1 text-xs text-muted-foreground/70">Try a different pattern</span>
                </div>
              )
            : (
                <div className="space-y-0.5 p-2">
                  {keys.map(k => (
                    <button
                      key={k}
                      type="button"
                      className={cn(
                        `
                          w-full truncate rounded-md px-2.5 py-2 text-left
                          font-mono text-xs transition-colors duration-200
                        `,
                        'hover:bg-accent hover:text-accent-foreground',
                        selectedKey === k && 'bg-accent text-accent-foreground',
                      )}
                      onClick={() => setSelectedKey(k)}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              )}
      </ScrollArea>
    </div>
  )
}
