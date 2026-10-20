import { LinkSquare02Icon } from '@hugeicons/core-free-icons'
import { CopyIconButton } from '@tamery/ui/components/custom/copy-button'
import { IconButton } from '@tamery/ui/components/custom/icon-button'

import { shareUrl } from '~/lib/urls'

export const ShareLinkActions = ({ shareId }: { shareId: string }) => (
  <>
    <CopyIconButton label="Copy link" text={shareUrl(shareId)} />
    <IconButton
      icon={LinkSquare02Icon}
      label="Open link"
      side="bottom"
      size="icon-xs"
      variant="ghost-muted"
      onClick={() => window.open(shareUrl(shareId), '_blank')}
    />
  </>
)
