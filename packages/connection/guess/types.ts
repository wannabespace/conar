import type { Engine } from '@tamery/shared/enums/connection-type'

import type { ConnectionParts } from '../connection-parts'

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

export type GuessFix = 'neon-direct' | 'session-pooler'

export type ServerField = Exclude<
  keyof ConnectionParts,
  'https' | 'options' | 'ssh' | 'type'
>

export type GuessedParts = Partial<Omit<ConnectionParts, 'type'>> & {
  engine?: Engine
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
