import { create } from './create'
import { list } from './list'
import { remove } from './remove'
import { sync } from './sync'
import { update } from './update'

export const databases = {
  sync,
  create,
  list,
  remove,
  update,
}
