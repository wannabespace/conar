import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { tryCatch } from '@tamery/shared/utils'

import { guessAdo } from './ado'
import { guessCli } from './cli'
import { guessEnv } from './env'
import { fixParts } from './fixes'
import { guessHost } from './host'
import { hostHintOf, TYPE_OF_PORT } from './hosts'
import { guessJson } from './json'
import { guessKeyValue } from './key-value'
import { mergeParts } from './parts'
import { guessSsh, throughForwards } from './ssh'
import type { ConnectionGuess } from './types'
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
const CLICKHOUSE_HTTP_PORT_OF_NATIVE: Record<string, string> = {
  9000: '8123',
  9440: '8443',
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
    const type = parts.type ?? hint?.type ?? TYPE_OF_PORT[parts.port ?? '']
    const port = parts.port || hint?.port || ''
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
