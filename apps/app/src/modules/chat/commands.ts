import { AiChat01Icon } from '@hugeicons/core-free-icons'

import type {
  CommandContext,
  CommandEntry,
} from '~/modules/actions-center/types'

import { toggleChat } from './chat-toggle'

export const chatCommands = ({ current }: CommandContext): CommandEntry[] =>
  current
    ? [
        {
          action: () => toggleChat(current.connectionResource.id),
          group: 'View',
          icon: AiChat01Icon,
          keywords: ['assistant', 'ai', 'panel'],
          order: 20,
          shortcut: 'L',
          value: 'Toggle AI chat',
        },
      ]
    : []
