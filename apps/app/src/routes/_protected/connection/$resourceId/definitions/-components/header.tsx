import { RefreshButton } from '@tamery/ui/components/custom/refresh-button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import type { ReactNode } from 'react'

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
      <h2 className="text-lg font-semibold">{children}</h2>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <RefreshButton
                variant="outline"
                size="icon"
                onClick={onRefresh}
                refreshing={isRefreshing}
              />
            }
          ></TooltipTrigger>
          <TooltipContent side="left">
            <div className="flex flex-col gap-0.5">
              <span>Refresh</span>
              <span className="opacity-70">
                Last updated:{' '}
                {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'never'}
              </span>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
