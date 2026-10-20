import { Share08Icon } from '@hugeicons/core-free-icons'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { IconButton } from '@tamery/ui/components/custom/icon-button'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'

import { checkOrUpgrade } from '~/core/user/permissions'

import type { TableView } from './share-dialog'
import { ShareDialog } from './share-dialog'
import { sharesQueryOptions } from './shares-query'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const ShareButton = ({
  schema,
  table,
  view,
}: {
  schema: string
  table: string
  view: TableView
}) => {
  const { connection, connectionResource } = useRouteContext()
  const [open, setOpen] = useState(false)
  const { data: shares = [] } = useQuery(sharesQueryOptions)
  const share =
    shares.find(
      (entry) =>
        entry.connectionResourceId === connectionResource.id &&
        entry.schema === schema &&
        entry.table === table
    ) ?? null
  const synced = connection.syncType === SyncType.Cloud

  return (
    <>
      <IconButton
        icon={Share08Icon}
        label={
          synced
            ? 'Share table'
            : 'Only a connection synced with Full can be shared.'
        }
        variant="outline"
        size="icon"
        side="bottom"
        disabled={!synced}
        focusableWhenDisabled
        onClick={() => {
          if (
            share ||
            checkOrUpgrade('share.create', { count: shares.length })
          ) {
            setOpen(true)
          }
        }}
      />
      <ShareDialog
        open={open}
        onOpenChange={setOpen}
        schema={schema}
        share={share}
        table={table}
        view={view}
      />
    </>
  )
}
