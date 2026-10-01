import { appModules } from '~/lib/modules'

import type { ConnectionTab } from './types'

export const resolveTab = (id: string) => {
  for (const kind of appModules.tabs) {
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
