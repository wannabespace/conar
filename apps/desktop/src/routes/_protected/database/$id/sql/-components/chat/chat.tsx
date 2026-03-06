import { useChat } from '@ai-sdk/react'
import { cn } from '@conar/ui/lib/utils'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useSubscription } from '~/entities/user/hooks'
import { Route } from '../..'
import { ChatForm } from './chat-form'
import { ChatHeader } from './chat-header'
import { ChatMessages } from './chat-messages'
import { ChatPlaceholder } from './chat-placeholder'

export function Chat({ className }: { className?: string }) {
  const { chat } = Route.useLoaderData()
  const { connection } = Route.useRouteContext()
  const { messages, error } = useChat({ chat })
  const { subscription } = useSubscription()
  const router = useRouter()
  const elementRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (subscription && chat.messages.at(-1)?.role === 'user' && chat.status !== 'streaming' && chat.status !== 'submitted') {
      chat.regenerate()
    }
  }, [chat, subscription])

  useHotkey('Mod+N', () => {
    router.navigate({
      to: '/database/$id/sql',
      params: { id: connection.id },
      search: { chatId: undefined },
    })
  }, { enabled: isFocused })

  return (
    <div
      key={chat.id}
      className={cn('relative flex flex-col justify-between gap-4 p-4', className)}
      ref={elementRef}
      tabIndex={0}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsFocused(false)
        }
      }}
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
