import { Share08Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { DropdownMenuItem } from '@tamery/ui/components/dropdown-menu'

import { useTableShare } from './use-table-share'

export const ShareMenuItem = ({
  onOpen,
  schema,
  table,
}: {
  onOpen: () => void
  schema: string
  table: string
}) => {
  const { loaded, synced } = useTableShare(schema, table)

  return (
    <DropdownMenuItem disabled={!synced || !loaded} onClick={onOpen}>
      <HugeiconsIcon icon={Share08Icon} strokeWidth={2} />
      Share
      {!synced && (
        <span className="text-muted-foreground ml-auto text-xs">
          Needs Full sync
        </span>
      )}
    </DropdownMenuItem>
  )
}
