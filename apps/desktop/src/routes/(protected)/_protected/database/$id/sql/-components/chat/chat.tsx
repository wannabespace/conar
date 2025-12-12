import type { ComponentProps } from 'react'
import { useChat } from '@ai-sdk/react'
import { cn } from '@conar/ui/lib/utils'
import { useEffect, useRef } from 'react'
import { Route } from '../..'
import { ChatForm } from './chat-form'
import { ChatHeader } from './chat-header'
import { ChatMessages } from './chat-messages'
import { ChatPlaceholder } from './chat-placeholder'

export function Chat({ className, ...props }: Omit<ComponentProps<'div'>, 'ref'>) {
  const { chat } = Route.useLoaderData()
  const { messages, error } = useChat({ chat })
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chat.messages.at(-1)?.role === 'user' && chat.status !== 'streaming' && chat.status !== 'submitted') {
      chat.regenerate()
    }
  }, [chat])

  return (
    <div
      key={chat.id}
      className={cn('relative flex flex-col justify-between gap-4 p-4', className)}
      ref={elementRef}
      {...props}
    >
      <ChatHeader chatId={chat.id} />
      {messages.length === 0 && !error && (
        <ChatPlaceholder />
      )}
      <ChatMessages className="flex-1" />
      <ChatForm />
    </div>
  )
}
