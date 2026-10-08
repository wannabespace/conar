import type { ConnectionType } from '@tamery/shared/enums/connection-type'

import {
  definitionsSchemaItems,
  definitionsTab,
} from '~/modules/definitions/lib/tab'
import { runnerTab } from '~/modules/runner/lib/tab'
import { tableTab } from '~/modules/table/lib/tab'
import {
  visualizerSchemaItem,
  visualizerTab,
} from '~/modules/visualizer/lib/tab'

import { SCHEMA_GROUPS } from './types'
import type { ConnectionTab, TabKind } from './types'

const TAB_KINDS: TabKind[] = [
  definitionsTab,
  runnerTab,
  tableTab,
  visualizerTab,
]

export const schemaItems = [visualizerSchemaItem, ...definitionsSchemaItems]

export const schemaGroups = (connectionType: ConnectionType) =>
  SCHEMA_GROUPS.map((label) => ({
    items: schemaItems.filter(
      (item) =>
        item.group === label && (item.available?.(connectionType) ?? true)
    ),
    label,
  })).filter((group) => group.items.length > 0)

export const resolveTab = (id: string) => {
  for (const kind of TAB_KINDS) {
    const params = kind.match(id)

    if (params !== null) {
      return { kind, params }
    }
  }

  return null
}

export type ResolvedTab = NonNullable<ReturnType<typeof resolveTab>>

export const tabFullTitle = ({ kind, params }: ResolvedTab) =>
  kind.fullTitle?.(params) ?? kind.title(params)

export const tabLabels = (tabs: ConnectionTab[]) => {
  const resolved = tabs.map((tab) => resolveTab(tab.id))

  return tabs.map((tab, index) => {
    const own = resolved[index]
    const siblings = resolved
      .filter((other) => other?.kind === own?.kind)
      .map((other) => other?.params)
    const defaultLabel = own
      ? (own.kind.label?.(own.params, siblings) ?? own.kind.title(own.params))
      : ''

    return { defaultLabel, label: tab.title ?? defaultLabel }
  })
}
