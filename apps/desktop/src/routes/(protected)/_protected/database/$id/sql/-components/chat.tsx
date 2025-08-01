import type { ComponentProps } from 'react'
import { useChat } from '@ai-sdk/react'
import { cn } from '@conar/ui/lib/utils'
import { ChatForm } from './chat-form'
import { ChatHeader } from './chat-header'
import { ChatMessages } from './chat-messages'
import { ChatPlaceholder } from './chat-placeholder'
import { useChatContext } from './chat-provider'

export function Chat({ className, ...props }: ComponentProps<'div'>) {
  const chat = useChatContext()
  const { messages, error } = useChat({ chat })

  return (
    <div className={cn('relative flex flex-col justify-between gap-4 p-4', className)} {...props}>
      <ChatHeader />
      {messages.length === 0 && !error && (
        <ChatPlaceholder />
      )}
      <ChatMessages className="flex-1" />
      <ChatForm />
    </div>
  )
}
