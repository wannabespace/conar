import {
  Alert02Icon,
  Share08Icon,
  Unlink01Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { shareRefreshLabels } from '@tamery/shared/enums/share-refresh'
import { CopyIconButton } from '@tamery/ui/components/custom/copy-button'
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
import { createFileRoute, Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { useState } from 'react'

import { SharesFrame } from '~/components/shares-frame'
import { SharesSkeleton } from '~/components/shares-skeleton'
import { StopSharingDialog } from '~/components/stop-sharing-dialog'
import { getMyShares } from '~/lib/account'

type Share = Awaited<ReturnType<typeof getMyShares>>[number]

const shareDetails = (share: Share) =>
  [
    shareRefreshLabels[share.refresh],
    share.expiresAt ? `Expires ${format(share.expiresAt, 'PP')}` : null,
    share.hasPassword ? 'Password' : null,
  ]
    .filter(Boolean)
    .join(' · ')

const SharesPage = () => {
  const { viewer } = Route.useRouteContext()
  const shares = Route.useLoaderData()
  const [stopping, setStopping] = useState<Share | null>(null)

  return (
    <SharesFrame
      description={
        viewer ? (
          <>
            Signed in as <span data-mask>{viewer.email}</span>. Change a share
            from its table in Tamery.
          </>
        ) : (
          'Sign in with your Tamery account to see the tables you share and stop sharing them.'
        )
      }
    >
      {shares && shares.length === 0 && (
        <SettingsGroup>
          <Empty size="sm">
            <EmptyHeader>
              <EmptyMedia variant="muted">
                <HugeiconsIcon icon={Share08Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>No shared tables</EmptyTitle>
              <EmptyDescription>
                Open a table and set up the filters and columns you want seen,
                then choose Share in its ⋯ menu. Only connections synced with
                Full can be shared.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </SettingsGroup>
      )}
      {shares && shares.length > 0 && (
        <SettingsGroup>
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
              <CopyIconButton
                label="Copy link"
                text={() => `${location.origin}/${share.id}`}
              />
              <IconButton
                icon={ViewIcon}
                label="View"
                side="bottom"
                size="icon-xs"
                variant="ghost-muted"
                render={<Link to="/$shareId" params={{ shareId: share.id }} />}
              />
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
      )}
      <StopSharingDialog share={stopping} onClose={() => setStopping(null)} />
    </SharesFrame>
  )
}

export const Route = createFileRoute('/')({
  loader: ({ context }) => (context.viewer ? getMyShares() : null),
  head: () => ({ meta: [{ title: 'Your shared tables · Tamery' }] }),
  pendingComponent: SharesSkeleton,
  pendingMs: 150,
  component: SharesPage,
})
