import { Share08Icon, Unlink01Icon, ViewIcon } from '@hugeicons/core-free-icons'
import { CopyIconButton } from '@tamery/ui/components/custom/copy-button'
import { IconButton } from '@tamery/ui/components/custom/icon-button'
import { SettingsGroup } from '@tamery/ui/components/custom/settings-group'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { EmptyState } from '~/components/empty-state'
import { ShareRow } from '~/components/share-row'
import { SharesFrame } from '~/components/shares-frame'
import { SharesSkeleton } from '~/components/shares-skeleton'
import { StopSharingDialog } from '~/components/stop-sharing-dialog'
import type { MyShare } from '~/lib/account'
import { getMyShares, stopSharing } from '~/lib/account'

const SharesPage = () => {
  const router = useRouter()
  const { viewer } = Route.useRouteContext()
  const shares = Route.useLoaderData()
  const [stopping, setStopping] = useState<MyShare | null>(null)
  const stop = useMutation({
    meta: { event: 'share_removed' },
    mutationFn: (id: string) => stopSharing({ data: { id } }),
    onSuccess: async () => {
      await router.invalidate()
      setStopping(null)
    },
  })

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
      {shares && (
        <SettingsGroup>
          {shares.length === 0 && (
            <EmptyState
              size="sm"
              icon={Share08Icon}
              title="No shared tables"
              description="Open a table and set up the filters and columns you want seen, then choose Share in its ⋯ menu. Only connections synced with Full can be shared."
            />
          )}
          {shares.map((share) => (
            <ShareRow key={share.id} share={share}>
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
            </ShareRow>
          ))}
        </SettingsGroup>
      )}
      <StopSharingDialog
        share={stopping}
        pending={stop.isPending}
        onClose={() => setStopping(null)}
        onStop={(id) => stop.mutate(id)}
      />
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
