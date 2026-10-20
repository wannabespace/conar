import { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { DatabaseGuess } from './types'

/** JDBC thin (`jdbc:oracle:thin:@//host:1521/SERVICE`, `@host:1521:SID`) and Easy Connect (`user/pass@host:1521/SERVICE`). */
const ORACLE_ADDRESS =
  /(?<jdbc>jdbc:oracle:thin:)?(?:(?<user>[^\s/@:"'=]+)\/(?<password>[^\s@"']*))?@(?:\/\/)?(?<host>[\w.-]+)(?::(?<port>\d+))?(?:[/:](?<database>[\w.$#-]+))?/giu

export const guessOracle = (text: string): DatabaseGuess | null => {
  const { jdbc, ...parts } =
    text
      .matchAll(ORACLE_ADDRESS)
      .map(({ groups }) => groups ?? {})
      // Without the JDBC prefix only `user/password@host/service` says Oracle: `@host` alone is any email.
      .find((groups) => groups.jdbc || (groups.user && groups.database)) ?? {}
  return parts.host
    ? {
        format: jdbc ? 'jdbc' : 'url',
        parts: { ...parts, type: ConnectionType.Oracle },
      }
    : null
}
