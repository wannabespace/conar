import { orpc } from '~/orpc'
import { sync as chatsSync } from './chats'
import { sync as chatsMessagesSync } from './chats-messages'
import { sync as databasesSync } from './databases'
import { sync as queriesSync } from './queries'

export const sync = orpc.router({
  chats: chatsSync,
  chatsMessages: chatsMessagesSync,
  databases: databasesSync,
  queries: queriesSync,
})
