import type { ReactNode } from 'react'
import { RefreshButton } from '@conar/ui/components/custom/refresh-button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'

export function DefinitionsHeader({
  children,
  onRefresh,
  isRefreshing,
  dataUpdatedAt,
}: {
  children: ReactNode
  onRefresh: () => void
  isRefreshing: boolean
  dataUpdatedAt: number
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-2xl font-bold">
        {children}
      </h2>
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <RefreshButton
                variant="outline"
                size="icon"
                onClick={onRefresh}
                refreshing={isRefreshing}
              />
            </TooltipTrigger>
            <TooltipContent side="left">
              Refresh
              <p className="text-xs text-muted-foreground">
                Last updated:
                {' '}
                {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'never'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
