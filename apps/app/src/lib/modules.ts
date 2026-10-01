import type { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { AppModule } from './module'
import { SCHEMA_GROUPS } from './module'

// Eager on purpose: a module exists iff its folder does. The glob pulls every
// `module.ts` into the entry chunk, so those files must not reach `lib/database`.
const list = Object.values(
  import.meta.glob<AppModule>('/src/modules/*/module.ts', {
    eager: true,
    import: 'default',
  })
)

export const byOrder = <T extends { order: number }>(items: T[]) =>
  items.toSorted((a, b) => a.order - b.order)

const schemaItems = byOrder(list.flatMap((module) => module.schemaItems ?? []))

export const appModules = {
  mounts: list.flatMap((module) => module.mounts ?? []),
  newTabActions: list.flatMap((module) => module.newTabActions ?? []),
  schemaGroups: (connectionType: ConnectionType) =>
    SCHEMA_GROUPS.map((label) => ({
      items: schemaItems.filter(
        (item) =>
          item.group === label && (item.available?.(connectionType) ?? true)
      ),
      label,
    })).filter((group) => group.items.length > 0),
  schemaItems,
  tabs: list.flatMap((module) => module.tabs ?? []),
}
