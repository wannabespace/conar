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
  | 'path'

export type GuessFix =
  | 'clickhouse-http'
  | 'neon-direct'
  | 'pooler-port'
  | 'prisma-options'
  | 'ssh-forward'

export type ServerField = Exclude<
  keyof ConnectionParts,
  'https' | 'options' | 'ssh' | 'type'
>

export type GuessedParts = Partial<ConnectionParts>

export interface ConnectionGuess extends DatabaseGuess {
  fixes: GuessFix[]
}

export interface DatabaseGuess {
  format: GuessFormat
  parts: GuessedParts
}
