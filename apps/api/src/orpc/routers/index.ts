import type { RouterClient } from '@orpc/server'
import * as account from './account'
import * as ai from './ai'
import { banner } from './banner'
import * as chats from './chats'
import * as chatsMessages from './chats-messages'
import { contact } from './contact'
import * as databases from './databases'
import * as queries from './queries'
import * as webhooks from './webhooks'

export const router = {
  contact,
  ai,
  chats,
  chatsMessages,
  queries,
  databases,
  banner,
  account,
  webhooks,
}

export type ORPCRouter = RouterClient<typeof router>
