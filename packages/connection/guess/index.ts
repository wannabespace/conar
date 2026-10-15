import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { tryCatch } from '@tamery/shared/utils'

import { CLICKHOUSE_HTTP_PORT_OF_NATIVE } from '../connection-parts'
import { hostHintOf, TYPE_OF_PORT } from '../hosts'
import { guessAdo } from './ado'
import { guessCli } from './cli'
import { guessEnv } from './env'
import { fixParts } from './fixes'
import { guessHost, guessPgpass } from './host'
import { guessJson } from './json'
import { guessKeyValue } from './key-value'
import { mergeParts } from './parts'
import { guessSsh, throughForwards } from './ssh'
import type { ConnectionGuess, DatabaseGuess } from './types'
import { guessGoDsn, guessUrl, guessWebUrl } from './url'

export type { GuessFix } from './fixes'
export type { ConnectionGuess, GuessFormat } from './types'

const DETECTORS = [
  guessCli,
  guessJson,
  guessUrl,
  guessGoDsn,
  guessAdo,
  guessKeyValue,
  guessEnv,
  guessWebUrl,
  guessPgpass,
  guessHost,
]
const LINE_CONTINUATION = /\\\r?\n/gu

const credentialsBeside = (
  database: DatabaseGuess | null | undefined,
  text: string
) => {
  if (database?.format !== 'url' && database?.format !== 'jdbc') {
    return {}
  }
  const { password, user } = guessEnv(text)?.parts ?? {}
  return { password, user }
}

/** Never throws: it reads anything the user pastes or drops. */
export const guessConnection = (text: string): ConnectionGuess | null =>
  tryCatch(() => {
    const { forwards, rest, tunnel } = guessSsh(
      text.replaceAll(LINE_CONTINUATION, ' ')
    )
    const database = DETECTORS.values()
      .map((detect) => detect(rest))
      .find(Boolean)
    if (!database && !tunnel) {
      return null
    }

    const parts = throughForwards(
      mergeParts(
        { ssh: tunnel },
        database?.parts ?? {},
        credentialsBeside(database, rest)
      ),
      forwards
    )
    const hint = hostHintOf(parts.host ?? '')
    const port = parts.port || hint?.port || ''
    const engine = parts.engine ?? TYPE_OF_PORT[port] ?? hint?.type
    const httpPort =
      engine === ConnectionType.ClickHouse
        ? CLICKHOUSE_HTTP_PORT_OF_NATIVE[port]
        : undefined
    return {
      ...fixParts(mergeParts({ ...parts, engine, port: httpPort ?? port })),
      format: database?.format ?? 'ssh',
    }
  }).data
