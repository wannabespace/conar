import type { RouterClient } from '@orpc/server'
import * as account from './account'
import * as ai from './ai'
import { banner } from './banner'
import * as chats from './chats'
import * as chatsMessages from './chats-messages'
import * as connections from './connections'
import { contact } from './contact'
import * as queries from './queries'
import { releases } from './releases'
import { repo } from './repo'
import * as webhooks from './webhooks'

export const router = {
  contact,
  ai,
  chats,
  chatsMessages,
  queries,
  connections,
  // TODO: remove this in the future
  databases: connections,
  banner,
  account,
  webhooks,
  repo,
  releases,
}

export type ORPCRouter = RouterClient<typeof router>
