import { DatabaseExportIcon } from '@hugeicons/core-free-icons'

import type {
  CommandContext,
  CommandEntry,
} from '~/modules/actions-center/types'

import { getCopyDatabaseAction } from './copy-database-dialog'

export const copyDatabaseCommands = ({
  current,
}: CommandContext): CommandEntry[] => {
  const action = getCopyDatabaseAction(
    current
      ? { connection: current.connection, resource: current.connectionResource }
      : null
  )
  return action
    ? [
        {
          action,
          group: 'Database',
          icon: DatabaseExportIcon,
          keywords: ['copy', 'sync', 'migrate', 'clone', 'dump', 'restore'],
          order: 30,
          value: 'Copy database…',
        },
      ]
    : []
}
