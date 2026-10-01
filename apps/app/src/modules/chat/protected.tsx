import { AiChat01Icon } from '@hugeicons/core-free-icons'

import { hasSubscription } from '~/core/user/use-subscription'
import type { ProtectedModule } from '~/lib/module'

import { toggleChat } from './chat-toggle'

export default {
  commands: ({ current }) =>
    current
      ? [
          {
            action: () =>
              toggleChat(current.connectionResource.id, hasSubscription()),
            group: 'View',
            icon: AiChat01Icon,
            keywords: ['assistant', 'ai', 'panel'],
            shortcut: 'L',
            value: 'Toggle AI chat',
          },
        ]
      : [],
} satisfies ProtectedModule
