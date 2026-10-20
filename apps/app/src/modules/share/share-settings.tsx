import { Unlink01Icon } from '@hugeicons/core-free-icons'
import { cardClass } from '@tamery/ui/components/card.utils'
import { IconButton } from '@tamery/ui/components/custom/icon-button'
import { SettingsGroup } from '@tamery/ui/components/custom/settings-group'
import { ShareRow } from '@tamery/ui/components/custom/share-row'
import { SharesEmpty } from '@tamery/ui/components/custom/shares-empty'
import { StopSharingDialog } from '@tamery/ui/components/custom/stop-sharing-dialog'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { orpc } from '~/lib/orpc'
import { queryClient } from '~/lib/query-client'

import { ShareLinkActions } from './share-link'
import type { Share } from './shares-query'
import { sharesQueryOptions } from './shares-query'

export const ShareSettings = () => {
  const { data: shares } = useQuery(sharesQueryOptions)
  const [stopping, setStopping] = useState<Share | null>(null)
  const stop = useMutation({
    meta: { event: 'share_removed' },
    mutationFn: (id: string) => orpc.shares.remove.call({ id }),
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: sharesQueryOptions.queryKey,
      })
      setStopping(null)
    },
  })

  if (!shares) {
    return null
  }

  if (shares.length === 0) {
    return (
      <div className={cardClass}>
        <SharesEmpty />
      </div>
    )
  }

  return (
    <>
      <SettingsGroup title="Shared tables">
        {shares.map((share) => (
          <ShareRow key={share.id} share={share}>
            <ShareLinkActions shareId={share.id} />
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
      <StopSharingDialog
        share={stopping}
        pending={stop.isPending}
        onClose={() => setStopping(null)}
        onStop={(id) => stop.mutate(id)}
      />
    </>
  )
}
