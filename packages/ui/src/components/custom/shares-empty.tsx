import { Share08Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'

export const SharesEmpty = () => (
  <Empty size="sm">
    <EmptyHeader>
      <EmptyMedia variant="muted">
        <HugeiconsIcon icon={Share08Icon} strokeWidth={2} />
      </EmptyMedia>
      <EmptyTitle>No shared tables</EmptyTitle>
      <EmptyDescription>
        Open a table and set up the filters and columns you want seen, then
        choose Share in its ⋯ menu. Only connections synced with Full can be
        shared.
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
)
