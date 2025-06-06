import type { ComponentProps } from 'react'
import { useChat } from '@ai-sdk/react'
import { useAsyncEffect } from '@conar/ui/hookas/use-async-effect'
import { cn } from '@conar/ui/lib/utils'
import { databaseContextQuery } from '~/entities/database'
import { queryClient } from '~/main'
import { pageStore, Route } from '..'
import { chatInput } from '../-lib'
import { ChatForm } from './chat-form'
import { ChatHeader } from './chat-header'
import { ChatMessages } from './chat-messages'
import { ChatPlaceholder } from './chat-placeholder'

export function Chat({ className, ...props }: ComponentProps<'div'>) {
  const { id } = Route.useParams()
  const { initialMessages, database } = Route.useLoaderData()

  const {
    messages,
    setMessages,
    error,
    append,
    status,
    stop,
    reload,
    input,
    setInput,
  } = useChat({
    id,
    api: `${import.meta.env.VITE_PUBLIC_API_URL}/ai/sql-chat`,
    initialInput: chatInput.get(id),
    initialMessages,
    experimental_prepareRequestBody(options) {
      return {
        id: options.id,
        messages: options.messages,
        type: database.type,
        model: pageStore.state.model,
        currentQuery: pageStore.state.query,
        ...options.requestBody,
      }
    },
  })

  async function handleReload() {
    await reload({
      body: {
        context: await queryClient.ensureQueryData(databaseContextQuery(database)),
      },
    })
  }

  useAsyncEffect(async () => {
    if (initialMessages.at(-1)?.role === 'user') {
      handleReload()
    }
  }, [initialMessages])

  return (
    <div className={cn('relative flex flex-col justify-between gap-4 p-4', className)} {...props}>
      <ChatHeader
        messages={messages}
        setMessages={setMessages}
      />
      {messages.length === 0 && !error && (
        <ChatPlaceholder />
      )}
      <ChatMessages
        className="flex-1"
        messages={messages}
        status={status}
        error={error}
        onReload={handleReload}
      />
      <ChatForm
        database={database}
        append={append}
        stop={stop}
        status={status}
        input={input}
        setInput={setInput}
      />
    </div>
  )
}
