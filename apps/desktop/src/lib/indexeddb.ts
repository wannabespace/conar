import type { DatabaseType } from '@conar/shared/enums/database-type'
import type { EntityTable } from 'dexie'
import Dexie from 'dexie'

export interface Database {
  id: string
  name: string
  type: DatabaseType
  createdAt: Date
  connectionString: string
  isPasswordExists: boolean
  isPasswordPopulated: boolean
}

export interface DatabaseChat {
  id: string
  databaseId: string
  messages: {
    id: string
    role: 'user' | 'assistant'
    parts: (
      {
        type: 'text'
        text: string
      }
      | {
        type: 'file'
        url: string
        mediaType: string
      }
    )[]
  }[]
}

export const indexedDb = new Dexie('conar') as Dexie & {
  databases: EntityTable<Database, 'id'>
  databaseChats: EntityTable<DatabaseChat, 'id'>
}

export function clearIndexedDb() {
  indexedDb.databases.clear()
  indexedDb.databaseChats.clear()
}

indexedDb.version(1).stores({
  databases: '++id, name, type, createdAt, connectionString, isPasswordExists, isPasswordPopulated',
})

indexedDb.version(2).stores({
  databases: '++id, name, type, createdAt, connectionString, isPasswordExists, isPasswordPopulated',
  databaseChats: '++id, databaseId, messages',
})

indexedDb.version(3).stores({
  databases: '++id, name, type, createdAt, connectionString, isPasswordExists, isPasswordPopulated',
  databaseChats: '++id, databaseId, messages',
}).upgrade((tx) => {
  tx.table('databaseChats').toCollection().modify((chat) => {
    chat.messages = chat.messages.map((message: {
      id: string
      content: string
      createdAt?: Date
      experimental_attachments?: {
        name: string
        contentType: string
        url: string
      }[]
      role: 'user' | 'assistant'
      parts?: { type: 'text', text: string }[]
    }) => ({
      id: message.id,
      role: message.role,
      parts: [
        {
          type: 'text',
          text: message.content,
        },
        ...(message.experimental_attachments?.map(attachment => ({
          type: 'file',
          url: attachment.url,
          mediaType: attachment.contentType,
        })) ?? []),
      ],
    }))
  })
})
