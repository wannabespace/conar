import {
  AppWindowIcon,
  Copy01Icon,
  Delete02Icon,
  Refresh01Icon,
  SquareUnlock01Icon,
} from '@hugeicons/core-free-icons'
import { SyncType } from '@tamery/shared/enums/sync-type'

import type { AppMenuNode } from '~/components/app-menu'
import type { Connection } from '~/core/connection/sync'

export const buildConnectionMenuItems = ({
  canSend,
  connection,
  isPasswordPopulated,
  onClearPassword,
  onCopy,
  onOpenInNewWindow,
  onRefresh,
  onRemove,
}: {
  canSend: boolean
  connection: Connection
  isPasswordPopulated?: boolean
  onClearPassword: () => void
  onCopy: () => void
  onOpenInNewWindow: (() => void) | null
  onRefresh: () => void
  onRemove: VoidFunction
}): AppMenuNode[] => [
  {
    label: 'Open in New Window',
    icon: AppWindowIcon,
    disabled: !onOpenInNewWindow,
    onSelect: () => onOpenInNewWindow?.(),
  },
  { type: 'separator' },
  {
    label: 'Refresh',
    icon: Refresh01Icon,
    disabled: !canSend,
    onSelect: onRefresh,
  },
  {
    label: 'Copy connection string',
    icon: Copy01Icon,
    onSelect: onCopy,
  },
  ...(connection.syncType === SyncType.CloudWithoutPassword
    ? ([
        {
          label: 'Clear password',
          icon: SquareUnlock01Icon,
          className: 'whitespace-nowrap',
          disabled: !isPasswordPopulated,
          onSelect: onClearPassword,
        },
      ] satisfies AppMenuNode[])
    : []),
  { type: 'separator' },
  {
    label: 'Remove',
    icon: Delete02Icon,
    variant: 'destructive',
    onSelect: onRemove,
  },
]
