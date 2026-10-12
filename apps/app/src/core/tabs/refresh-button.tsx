import { RefreshButton } from '@tamery/ui/components/custom/refresh-button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'

import { ShortcutKbd } from '~/core/keyboard/shortcut-kbd'

export const TabRefreshButton = ({
  label,
  refreshing,
  onRefresh,
}: {
  label: string
  refreshing: boolean
  onRefresh: () => void
}) => (
  <Tooltip shortcut={!!window.electron && <ShortcutKbd shortcut="refresh" />}>
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
    <TooltipContent side="bottom">{label}</TooltipContent>
  </Tooltip>
)
