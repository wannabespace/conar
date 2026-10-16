import type { SqliteLocation } from '@tamery/shared/enums/connection-type'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { ClickHouseIcon } from '@tamery/ui/components/icons/clickhouse'
import { CloudflareD1Icon } from '@tamery/ui/components/icons/cloudflare-d1'
import { MariaDBIcon } from '@tamery/ui/components/icons/mariadb'
import { MSSQLIcon } from '@tamery/ui/components/icons/mssql'
import { MySQLIcon } from '@tamery/ui/components/icons/mysql'
import { PostgresIcon } from '@tamery/ui/components/icons/postgres'
import { SQLiteIcon } from '@tamery/ui/components/icons/sqlite'
import { TursoIcon } from '@tamery/ui/components/icons/turso'
import type { ComponentProps, ReactNode } from 'react'
import { createElement } from 'react'

const iconMap: Record<
  ConnectionType,
  (props: ComponentProps<'svg'>) => ReactNode
> = {
  [ConnectionType.MariaDB]: MariaDBIcon,
  [ConnectionType.Postgres]: PostgresIcon,
  [ConnectionType.MySQL]: MySQLIcon,
  [ConnectionType.ClickHouse]: ClickHouseIcon,
  [ConnectionType.MSSQL]: MSSQLIcon,
  [ConnectionType.SQLite]: SQLiteIcon,
}

const sqliteIcons: Record<
  SqliteLocation,
  (props: ComponentProps<'svg'>) => ReactNode
> = {
  d1: CloudflareD1Icon,
  file: SQLiteIcon,
  libsql: TursoIcon,
}

export const ConnectionIcon = ({
  sqliteLocation = 'file',
  type,
  ...props
}: {
  sqliteLocation?: SqliteLocation
  type: ConnectionType
} & ComponentProps<'svg'>) =>
  createElement(
    type === ConnectionType.SQLite
      ? sqliteIcons[sqliteLocation]
      : iconMap[type],
    props
  )
