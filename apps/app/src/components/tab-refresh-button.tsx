import { RefreshButton } from '@tamery/ui/components/custom/refresh-button'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'

export const TabRefreshButton = ({
  label,
  refreshing,
  onRefresh,
}: {
  label: string
  refreshing: boolean
  onRefresh: () => void
}) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <RefreshButton
          variant="ghost-muted"
          size="icon-xs"
          aria-label="Refresh"
          iconClassName="size-3.5"
          refreshing={refreshing}
          onClick={onRefresh}
        />
      }
    />
    <TooltipContent side="bottom">
      {label}
      {window.electron && (
        <KbdCtrlLetter userAgent={navigator.userAgent} letter="R" />
      )}
    </TooltipContent>
  </Tooltip>
)
