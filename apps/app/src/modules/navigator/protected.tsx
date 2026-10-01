import {
  FolderAddIcon,
  PlusSignIcon,
  SidebarLeftIcon,
} from '@hugeicons/core-free-icons'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import type { CommandEntry, ProtectedModule } from '~/lib/module'

import { createSchemaDialogRef } from './create-schema-dialog'
import { createTableDialogRef } from './create-table-dialog'
import { navigatorOpenValue } from './stores'

export default {
  commands: ({ current }): CommandEntry[] =>
    current
      ? [
          {
            action: () => createTableDialogRef.current?.create(),
            group: 'Database',
            icon: PlusSignIcon,
            keywords: ['create', 'add', 'table'],
            value: 'New table…',
          },
          ...(capabilitiesOf(current.connection.type).schemas
            ? [
                {
                  action: () => createSchemaDialogRef.current?.create(),
                  group: 'Database',
                  icon: FolderAddIcon,
                  keywords: [
                    'create',
                    'add',
                    'schema',
                    'database',
                    'namespace',
                  ],
                  value: 'New schema…',
                } satisfies CommandEntry,
              ]
            : []),
          {
            action: () => navigatorOpenValue.set((open) => !open),
            group: 'View',
            icon: SidebarLeftIcon,
            keywords: ['navigator', 'panel', 'hide', 'show'],
            shortcut: 'B',
            value: 'Toggle sidebar',
          },
        ]
      : [],
} satisfies ProtectedModule
