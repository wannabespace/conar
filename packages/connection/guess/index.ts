import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { tryCatch } from '@tamery/shared/utils'

import { CLICKHOUSE_HTTP_PORT_OF_NATIVE } from '../connection-parts'
import { hostHintOf, TYPE_OF_PORT } from '../hosts'
import { guessAdo } from './ado'
import { guessCli } from './cli'
import { guessEnv } from './env'
import { fixParts } from './fixes'
import { guessHost } from './host'
import { guessJson } from './json'
import { guessKeyValue } from './key-value'
import { mergeParts } from './parts'
import { guessSsh, throughForwards } from './ssh'
import type { ConnectionGuess, GuessFormat } from './types'
import { guessUrl, guessWebUrl } from './url'

export type { GuessFix } from './fixes'
export type { ConnectionGuess, GuessFormat } from './types'

const DETECTORS = [
  guessCli,
  guessJson,
  guessUrl,
  guessAdo,
  guessKeyValue,
  guessEnv,
  guessWebUrl,
  guessHost,
]
/** The engine a format means when neither the text, the port nor the host names one. */
const TYPE_OF_FORMAT: Partial<Record<GuessFormat, ConnectionType>> = {
  ado: ConnectionType.MSSQL,
}
const LINE_CONTINUATION = /\\\r?\n/gu

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
      mergeParts(tunnel ? { ssh: tunnel } : {}, database?.parts ?? {}),
      forwards
    )
    const hint = hostHintOf(parts.host ?? '')
    const port = parts.port || hint?.port || ''
    const type =
      parts.type ??
      TYPE_OF_PORT[port] ??
      hint?.type ??
      (database && TYPE_OF_FORMAT[database.format])
    return {
      ...fixParts(
        mergeParts(
          {
            port:
              type === ConnectionType.ClickHouse
                ? CLICKHOUSE_HTTP_PORT_OF_NATIVE[port]
                : undefined,
            type,
          },
          { ...parts, port }
        )
      ),
      format: database?.format ?? 'ssh',
    }
  }).data
