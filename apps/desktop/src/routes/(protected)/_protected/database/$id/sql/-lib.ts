import type { Message } from '@ai-sdk/react'
import { indexedDb } from '~/lib/indexeddb'

export const chatQuery = {
  get(id: string) {
    return localStorage.getItem(`sql-${id}`) || '-- Write your SQL query here\n'
      + '\n'
      + '-- Please write your own queries based on your database schema\n'
      + '-- The examples below are for reference only and may not work with your database\n'
      + '\n'
      + '-- Example 1: Basic query with limit\n'
      + '-- SELECT * FROM users LIMIT 10;\n'
      + '\n'
      + '-- Example 2: Query with filtering\n'
      + '-- SELECT id, name, email FROM users WHERE created_at > \'2025-01-01\' ORDER BY name;\n'
      + '\n'
      + '-- Example 3: Join example\n'
      + '-- SELECT u.id, u.name, p.title FROM users u\n'
      + '-- JOIN posts p ON u.id = p.user_id\n'
      + '-- WHERE p.published = true\n'
      + '-- LIMIT 10;\n'
      + '\n'
      + '-- TIP: You can run multiple queries at once by separating them with semicolons'
  },
  set(id: string, query: string) {
    localStorage.setItem(`sql-${id}`, query)
  },
}

export const chatInput = {
  get(id: string) {
    const data = JSON.parse(sessionStorage.getItem(`sql-chat-input-${id}`) || '""')

    return typeof data === 'string' ? data : ''
  },
  set(id: string, input: string) {
    sessionStorage.setItem(`sql-chat-input-${id}`, JSON.stringify(input))
  },
}

export const chatMessages = {
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
