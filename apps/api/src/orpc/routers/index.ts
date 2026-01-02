import type { RouterClient } from '@orpc/server'
import { account } from './account'
import { ai } from './ai'
import { banner } from './banner'
import { chats } from './chats'
import { chatsMessages } from './chats-messages'
import { contact } from './contact'
import { databases } from './databases'
import { queries } from './queries'

export const router = {
  contact,
  ai,
  chats,
  chatsMessages,
  queries,
  databases,
  banner,
  account,
}

export type ORPCRouter = RouterClient<typeof router>
