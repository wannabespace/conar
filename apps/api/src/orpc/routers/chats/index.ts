import { create } from './create'
import { get } from './get'
import { list } from './list'
import { remove } from './remove'
import { sync } from './sync'
import { update } from './update'

export const chats = {
  sync,
  list,
  remove,
  get,
  update,
  create,
}
