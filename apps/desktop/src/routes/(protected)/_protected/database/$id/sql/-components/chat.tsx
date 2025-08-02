import type { ComponentProps } from 'react'
import { useChat } from '@ai-sdk/react'
import { cn } from '@conar/ui/lib/utils'
import { Route } from '..'
import { ChatForm } from './chat-form'
import { ChatHeader } from './chat-header'
import { ChatMessages } from './chat-messages'
import { ChatPlaceholder } from './chat-placeholder'

export function Chat({ className, ...props }: ComponentProps<'div'>) {
  const { chatId } = Route.useSearch()
  const { chat } = Route.useLoaderData()
  const { messages, error } = useChat({ chat })

  // key needed to force re-render because AI SDK Chat didn't restore the Chat instance
  // and have message stream after rerender
  return (
    <div key={chatId} className={cn('relative flex flex-col justify-between gap-4 p-4', className)} {...props}>
      <ChatHeader />
      {messages.length === 0 && !error && (
        <ChatPlaceholder />
      )}
      <ChatMessages className="flex-1" />
      <ChatForm />
    </div>
  )
}
