import type { MDXProps } from 'mdx/types'
import type { ComponentType } from 'react'

import ConnectToClickhouse from './content/connect-to-clickhouse.mdx'
import ConnectToCloudflareD1 from './content/connect-to-cloudflare-d1.mdx'
import ConnectToMysql from './content/connect-to-mysql.mdx'
import ConnectToOracle from './content/connect-to-oracle.mdx'
import ConnectToPostgresql from './content/connect-to-postgresql.mdx'
import ConnectToSqlServer from './content/connect-to-sql-server.mdx'
import ConnectToSqlite from './content/connect-to-sqlite.mdx'
import ConnectToTurso from './content/connect-to-turso.mdx'

export const postBodies: Record<string, ComponentType<MDXProps>> = {
  'connect-to-clickhouse': ConnectToClickhouse,
  'connect-to-cloudflare-d1': ConnectToCloudflareD1,
  'connect-to-mysql': ConnectToMysql,
  'connect-to-oracle': ConnectToOracle,
  'connect-to-postgresql': ConnectToPostgresql,
  'connect-to-sql-server': ConnectToSqlServer,
  'connect-to-sqlite': ConnectToSqlite,
  'connect-to-turso': ConnectToTurso,
}
