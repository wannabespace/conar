import { HierarchyIcon } from '@hugeicons/core-free-icons'

import type { SchemaItem, TabKind } from '~/core/tabs/types'

const VISUALIZER_TAB_ID = 'visualizer'

export const visualizerSchemaItem: SchemaItem = {
  icon: HierarchyIcon,
  label: 'Visualizer',
  tabId: VISUALIZER_TAB_ID,
}

export const visualizerTab: TabKind = {
  icon: HierarchyIcon,
  match: (id) => (id === VISUALIZER_TAB_ID ? {} : null),
  title: () => 'Visualizer',
  type: 'visualizer',
}
