import type { Message } from '@ai-sdk/react'
import { useChat } from '@ai-sdk/react'
import { usePromise } from '@connnect/ui/hookas/use-promise'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getDatabaseContext, useDatabase } from '~/entities/database'
import { indexedDb } from '~/lib/indexeddb'

const chatInput = {
  get(id: string) {
    return JSON.parse(localStorage.getItem(`sql-chat-input-${id}`) || '""')
  },
  set(id: string, input: string) {
    localStorage.setItem(`sql-chat-input-${id}`, JSON.stringify(input))
  },
}

// TODO: remove this in future releases
function clearOldInfos() {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('sql-chat-messages')) {
      localStorage.removeItem(key)
    }
  })
}

clearOldInfos()

const chatMessages = {
  async get(id: string) {
    const chat = await indexedDb.databaseChats.get({ databaseId: id })
    return chat?.messages || []
  },
  async set(id: string, messages: Message[]) {
    const chat = await indexedDb.databaseChats.get({ databaseId: id })
    const formattedMessages = messages
      .filter(message => message.role === 'user' || message.role === 'assistant') as Extract<Message, { role: 'system' | 'data' }>[]

    if (chat) {
      await indexedDb.databaseChats.update(chat.id, {
        messages: formattedMessages,
      })
    }
    else {
      await indexedDb.databaseChats.add({
        id: crypto.randomUUID(),
        databaseId: id,
        messages: formattedMessages,
      })
    }
  },
}

export function useDatabaseContext(id: string) {
  const { data: database } = useDatabase(id)

  return useQuery({
    queryKey: ['database-context', id],
    queryFn: () => getDatabaseContext(database),
  })
}

export function useDatabaseChat(id: string) {
  const { data: database } = useDatabase(id)
  const { data: context } = useDatabaseContext(id)

  const initialMessages = usePromise(() => chatMessages.get(id))
  const chat = useChat({
    id,
    api: `${import.meta.env.VITE_PUBLIC_API_URL}/ai/sql-chat`,
    initialMessages: [],
    initialInput: chatInput.get(id),
    body: {
      type: database.type,
      context,
    },
  })

  useEffect(() => {
    if (initialMessages) {
      chat.setMessages(initialMessages)
    }
  }, [initialMessages])

  useEffect(() => {
    chatMessages.set(id, chat.messages)
  }, [id, chat.messages])

  useEffect(() => {
    chatInput.set(id, chat.input)
  }, [id, chat.input])

  return chat
}
