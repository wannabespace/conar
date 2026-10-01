import { RefreshButton } from '@tamery/ui/components/custom/refresh-button'

import { resolveTab } from '~/core/tabs/kinds'
import { workspaceModules } from '~/lib/workspace-modules'

export const TabRefresh = ({ tabId }: { tabId: string | undefined }) => {
  const resolved = tabId ? resolveTab(tabId) : null
  const view = resolved && workspaceModules.tabs[resolved.kind.type]

  if (resolved && view?.Refresh) {
    return <view.Refresh params={resolved.params} />
  }

  return (
    <RefreshButton
      variant="ghost-muted"
      size="icon-xs"
      aria-label="Refresh"
      iconClassName="size-3.5"
      refreshing={false}
      disabled
    />
  )
}
