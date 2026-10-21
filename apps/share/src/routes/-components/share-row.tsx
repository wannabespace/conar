import { Alert02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { shareRefreshLabels } from '@tamery/shared/enums/share-refresh'
import { SettingsRow } from '@tamery/ui/components/custom/settings-group'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import { format } from 'date-fns'
import type { ReactNode } from 'react'

import type { MyShare } from '~/lib/account'

export const ShareRow = ({
  children,
  share,
}: {
  children: ReactNode
  share: MyShare
}) => (
  <SettingsRow
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
        [
          shareRefreshLabels[share.refresh],
          share.expiresAt && `Expires ${format(share.expiresAt, 'PP')}`,
          share.hasPassword && 'Password',
        ]
          .filter(Boolean)
          .join(' · ')
      )
    }
  >
    {children}
  </SettingsRow>
)
