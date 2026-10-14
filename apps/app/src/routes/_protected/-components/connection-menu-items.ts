import {
  AppWindowIcon,
  Copy01Icon,
  Delete02Icon,
  PencilEdit01Icon,
  Refresh01Icon,
  SquareUnlock01Icon,
} from '@hugeicons/core-free-icons'
import { SyncType } from '@tamery/shared/enums/sync-type'

import type { AppMenuNode } from '~/components/app-menu'
import type { Connection } from '~/core/connection/sync'

export const buildConnectionMenuItems = ({
  canSend,
  connection,
  onClearPassword,
  onCopy,
  onEdit,
  onOpenInNewWindow,
  onRefresh,
  onRemove,
}: {
  canSend: boolean
  connection: Connection
  onClearPassword: () => void
  onCopy: () => void
  onEdit: () => void
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
    label: 'Edit',
    icon: PencilEdit01Icon,
    onSelect: onEdit,
  },
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
  ...(connection.syncType === SyncType.CloudWithoutSecrets
    ? ([
        {
          label: 'Clear saved credentials',
          icon: SquareUnlock01Icon,
          className: 'whitespace-nowrap',
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
