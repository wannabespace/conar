import {
  SettingsGroup,
  SettingsRow,
} from '@tamery/ui/components/custom/settings-group'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { cn } from '@tamery/ui/lib/utils'

import { SharesFrame } from './shares-frame'

const ROWS = [0, 1, 2]

export const SharesSkeleton = () => (
  <SharesFrame description={<Skeleton className="h-4 w-64" />}>
    <SettingsGroup>
      {ROWS.map((row) => (
        <SettingsRow
          key={row}
          title={
            <Skeleton
              className={cn(
                'h-4',
                row === 0 && 'w-40',
                row === 1 && 'w-56',
                row === 2 && 'w-32'
              )}
            />
          }
          description={<Skeleton className="mt-1 h-3 w-24" />}
        />
      ))}
    </SettingsGroup>
  </SharesFrame>
)
