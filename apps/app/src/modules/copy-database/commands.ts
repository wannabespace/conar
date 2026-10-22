import { DatabaseExportIcon } from '@hugeicons/core-free-icons'
import { getDialect } from '@tamery/shared/enums/connection-type'

import { getCapabilities } from '~/core/catalog/capabilities'
import type {
  CommandContext,
  CommandEntry,
} from '~/modules/actions-center/types'

import { copyDatabaseDialogRef } from './copy-database-dialog'

export const copyDatabaseCommands = ({
  current,
}: CommandContext): CommandEntry[] =>
  window.electron &&
  current &&
  getCapabilities(getDialect(current.connection.type)).copyDatabase
    ? [
        {
          action: () =>
            copyDatabaseDialogRef.current?.open({
              connection: current.connection,
              resource: current.connectionResource,
            }),
          group: 'Database',
          icon: DatabaseExportIcon,
          keywords: ['copy', 'sync', 'migrate', 'clone', 'dump', 'restore'],
          order: 30,
          value: 'Copy database…',
        },
      ]
    : []
