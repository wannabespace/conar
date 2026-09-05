import { uppercaseFirst } from '@tamery/shared/utils/helpers'

import type { ConnectionTab } from './types'

const tabTitle = (tab: ConnectionTab) => {
  switch (tab.type) {
    case 'table': {
      return tab.table
    }
    case 'definitions': {
      return uppercaseFirst(tab.section)
    }
    case 'runner': {
      return 'Query'
    }
    case 'visualizer': {
      return 'Visualizer'
    }
    default: {
      return ''
    }
  }
}

export const tabFullTitle = (tab: ConnectionTab) =>
  tab.type === 'table' ? `${tab.schema}.${tab.table}` : tabTitle(tab)

export const tabLabels = (tabs: ConnectionTab[]) => {
  const tableTabs = tabs.filter((tab) => tab.type === 'table')
  const withSchema = new Set(tableTabs.map((tab) => tab.schema)).size > 1
  const runnerIds = tabs.filter((tab) => tab.type === 'runner').map((t) => t.id)

  return tabs.map((tab) => {
    let defaultLabel: string

    if (tab.type === 'table') {
      defaultLabel = withSchema ? tabFullTitle(tab) : tabTitle(tab)
    } else if (tab.type === 'runner') {
      const num =
        runnerIds.length > 1 ? ` ${runnerIds.indexOf(tab.id) + 1}` : ''

      defaultLabel = `${tabTitle(tab)}${num}`
    } else {
      defaultLabel = tabTitle(tab)
    }

    return { defaultLabel, label: tab.title ?? defaultLabel }
  })
}
