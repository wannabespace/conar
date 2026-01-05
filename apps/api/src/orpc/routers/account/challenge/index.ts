import { EventPublisher } from '@orpc/server'
import { listen } from './listen'
import { store } from './store'

export const codeChallengePublisher = new EventPublisher<Record<string, { token: string, newUser?: boolean }>>()

export const challenge = {
  store,
  listen,
}
