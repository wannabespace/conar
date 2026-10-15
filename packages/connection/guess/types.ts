import type { ConnectionFlavor } from '@tamery/shared/enums/connection-type'

import type { ConnectionParts } from '../connection-parts'
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

export type ServerField = Exclude<
  keyof ConnectionParts,
  'https' | 'options' | 'ssh' | 'type'
>

export type GuessedParts = Partial<ConnectionParts> & {
  flavor?: ConnectionFlavor | null
}

export interface ConnectionGuess extends DatabaseGuess {
  /** Changes made to a string that would connect but break a database client; the form tells the user about each. */
  fixes: GuessFix[]
}

/** Parts may hold empty strings and nulls; `guessConnection` drops them. */
export interface DatabaseGuess {
  format: GuessFormat
  parts: GuessedParts
}
