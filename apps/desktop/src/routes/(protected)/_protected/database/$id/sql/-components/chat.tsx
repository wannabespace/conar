import type { ComponentProps } from 'react'
import { useChat } from '@ai-sdk/react'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { cn } from '@conar/ui/lib/utils'
import { useEffect } from 'react'
import { Route } from '..'
import { chatMessages } from '../-chat'
import { ChatForm } from './chat-form'
import { ChatHeader } from './chat-header'
import { ChatMessages } from './chat-messages'
import { ChatPlaceholder } from './chat-placeholder'

export function Chat({ className, ...props }: ComponentProps<'div'>) {
  const { chat } = Route.useLoaderData()
  const { messages, error, regenerate } = useChat({ chat })

  useMountedEffect(() => {
    chatMessages.set(chat.id, messages)
  }, [messages])

  useEffect(() => {
    if (messages.at(-1)?.role === 'user') {
      regenerate()
    }
  }, [])

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
