import { orpc } from '~/orpc'
import { get } from './get'
import { list } from './list'
import { remove } from './remove'

export const chats = orpc.router({
  list,
  remove,
  get,
})
