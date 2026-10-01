import { HierarchyIcon } from '@hugeicons/core-free-icons'

import type { AppModule } from '~/lib/module'

const VISUALIZER_TAB_ID = 'visualizer'

export default {
  schemaItems: [
    {
      group: 'Overview',
      icon: HierarchyIcon,
      label: 'Visualizer',
      order: 0,
      tabId: VISUALIZER_TAB_ID,
    },
  ],
  tabs: [
    {
      icon: HierarchyIcon,
      match: (id) => (id === VISUALIZER_TAB_ID ? {} : null),
      title: () => 'Visualizer',
      type: 'visualizer',
    },
  ],
} satisfies AppModule
