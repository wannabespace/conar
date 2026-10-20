import {
  Alert02Icon,
  Share08Icon,
  Unlink01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { shareRefreshLabels } from '@tamery/shared/enums/share-refresh'
import { cardClass } from '@tamery/ui/components/card.utils'
import { IconButton } from '@tamery/ui/components/custom/icon-button'
import {
  SettingsGroup,
  SettingsRow,
} from '@tamery/ui/components/custom/settings-group'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useState } from 'react'

import { ShareLinkActions } from './share-link'
import type { Share } from './shares-query'
import { sharesQueryOptions } from './shares-query'
import { StopSharingDialog } from './stop-sharing-dialog'

const shareDetails = (share: Share) =>
  [
    shareRefreshLabels[share.refresh],
    share.expiresAt ? `Expires ${format(share.expiresAt, 'PP')}` : null,
    share.hasPassword ? 'Password' : null,
  ]
    .filter(Boolean)
    .join(' · ')

export const ShareSettings = () => {
  const { data: shares } = useQuery(sharesQueryOptions)
  const [stopping, setStopping] = useState<Share | null>(null)

  if (!shares) {
    return null
  }

  if (shares.length === 0) {
    return (
      <div className={cardClass}>
        <Empty size="sm">
          <EmptyHeader>
            <EmptyMedia variant="muted">
              <HugeiconsIcon icon={Share08Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>No shared tables</EmptyTitle>
            <EmptyDescription>
              Share a table from the share button in its toolbar.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <>
      <SettingsGroup title="Shared tables">
        {shares.map((share) => (
          <SettingsRow
            key={share.id}
            title={
              <>
                {share.connection && (
                  <ConnectionIcon
                    type={share.connection.type}
                    provider={share.connection.provider}
                    className="size-4"
                  />
                )}
                <span data-mask>{share.name}</span>
                <span data-mask className="text-muted-foreground">
                  {`${share.schema}.${share.table}`}
                </span>
              </>
            }
            description={
              share.failingSince ? (
                <span className="flex items-center gap-1">
                  <HugeiconsIcon
                    icon={Alert02Icon}
                    strokeWidth={2}
                    className="text-destructive size-3.5"
                  />
                  {`Viewers cannot load it since ${format(share.failingSince, 'PPp')}`}
                </span>
              ) : (
                shareDetails(share)
              )
            }
          >
            <ShareLinkActions shareId={share.id} />
            <IconButton
              icon={Unlink01Icon}
              label="Stop sharing"
              side="bottom"
              size="icon-xs"
              variant="ghost-destructive"
              onClick={() => setStopping(share)}
            />
          </SettingsRow>
        ))}
      </SettingsGroup>
      <StopSharingDialog share={stopping} onClose={() => setStopping(null)} />
    </>
  )
}
