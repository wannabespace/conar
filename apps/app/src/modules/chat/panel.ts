import type { Panel } from '~/lib/panels'

import { ChatPanel } from './chat-panel'
import { chatOpen } from './stores'

export const chatPanel: Panel = {
  Component: ChatPanel,
  defaultSize: 380,
  id: 'chat',
  label: 'chat',
  maxSize: '50%',
  minSize: 300,
  open: chatOpen,
  region: 'right',
}
