import { orpc } from '..'
import { sqlChat } from './ai'

export const router = orpc.router({
  ai: {
    sqlChat,
  },
})
