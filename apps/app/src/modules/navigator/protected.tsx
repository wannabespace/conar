import {
  FolderAddIcon,
  PlusSignIcon,
  SidebarLeftIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import type { CommandEntry, ProtectedModule } from '~/lib/module'

import { createSchemaDialogRef } from './create-schema-dialog'
import { createTableDialogRef } from './create-table-dialog'
import { createViewDialogRef } from './create-view-dialog'
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
            order: 10,
            value: 'New table…',
          },
          {
            action: () => createViewDialogRef.current?.create(),
            group: 'Database',
            icon: ViewIcon,
            keywords: ['create', 'add', 'view', 'materialized'],
            order: 15,
            value: 'New view…',
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
                  order: 20,
                  value: 'New schema…',
                } satisfies CommandEntry,
              ]
            : []),
          {
            action: () => navigatorOpenValue.set((open) => !open),
            group: 'View',
            icon: SidebarLeftIcon,
            keywords: ['navigator', 'panel', 'hide', 'show'],
            order: 10,
            shortcut: 'B',
            value: 'Toggle sidebar',
          },
        ]
      : [],
} satisfies ProtectedModule
