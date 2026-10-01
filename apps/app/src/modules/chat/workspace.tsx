import type { WorkspaceModule } from '~/lib/module'

import { ChatPanel } from './chat-panel'
import { ChatToggle } from './chat-toggle'
import { chatOpen } from './stores'

export default {
  panels: [
    {
      Component: ChatPanel,
      defaultSize: 380,
      id: 'chat',
      label: 'chat',
      maxSize: '50%',
      minSize: 300,
      open: chatOpen,
      region: 'right',
    },
  ],
  tabBarEnd: [{ Component: ChatToggle, order: 10 }],
} satisfies WorkspaceModule
