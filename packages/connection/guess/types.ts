import type { ConnectionParts } from '../connection-parts'
import type { SshTunnel } from '../ssh/params'
import type { GuessFix } from './fixes'

export type GuessFormat =
  | 'url'
  | 'jdbc'
  | 'key-value'
  | 'ado'
  | 'env'
  | 'json'
  | 'cli'
  | 'ssh'
  | 'host'

export type GuessedParts = Partial<Omit<ConnectionParts, 'ssh'>> & {
  ssh?: SshTunnel
}

export interface ConnectionGuess {
  /** Changes made to a string that would connect but break a database client; the form tells the user about each. */
  fixes: GuessFix[]
  format: GuessFormat
  parts: GuessedParts
}

/** Parts may hold empty strings; `guessConnection` drops them. */
export interface DatabaseGuess {
  format: GuessFormat
  parts: GuessedParts
}
