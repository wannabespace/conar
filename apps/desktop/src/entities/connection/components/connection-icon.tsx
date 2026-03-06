import type { ComponentProps, ComponentType } from 'react'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { createElement } from 'react'
import { ClickHouseIcon } from '~/icons/clickhouse'
import { MSSQLIcon } from '~/icons/mssql'
import { MySQLIcon } from '~/icons/mysql'
import { PostgresIcon } from '~/icons/postgres'
import { SQLiteIcon } from '~/icons/sqlite'

const iconMap: Record<ConnectionType, ComponentType<ComponentProps<'svg'>>> = {
  [ConnectionType.Postgres]: PostgresIcon,
  [ConnectionType.MySQL]: MySQLIcon,
  [ConnectionType.ClickHouse]: ClickHouseIcon,
  [ConnectionType.MSSQL]: MSSQLIcon,
  [ConnectionType.SQLite]: SQLiteIcon,
}

export function ConnectionIcon({ type, ...props }: { type: ConnectionType } & ComponentProps<'svg'>) {
  return createElement(iconMap[type], props)
}
