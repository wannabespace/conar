import { uppercaseFirst } from '@tamery/shared/utils/helpers'

import type { ConnectionTab } from './types'

export const tabTitle = (tab: ConnectionTab) => {
  switch (tab.type) {
    case 'table': {
      return tab.table
    }
    case 'definitions': {
      return uppercaseFirst(tab.section)
    }
    case 'runner': {
      return 'SQL Runner'
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
