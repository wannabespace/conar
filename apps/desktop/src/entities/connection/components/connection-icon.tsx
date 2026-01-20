import type { ComponentProps, JSX } from 'react'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { createElement } from 'react'
import { ClickHouseIcon } from '~/icons/clickhouse'
import { MSSQLIcon } from '~/icons/mssql'
import { MySQLIcon } from '~/icons/mysql'
import { PostgresIcon } from '~/icons/postgres'

const iconMap: Record<ConnectionType, (props: ComponentProps<'svg'>) => JSX.Element> = {
  [ConnectionType.Postgres]: PostgresIcon,
  [ConnectionType.MySQL]: MySQLIcon,
  [ConnectionType.ClickHouse]: ClickHouseIcon,
  [ConnectionType.MSSQL]: MSSQLIcon,
}

export function ConnectionIcon({ type, ...props }: { type: ConnectionType } & ComponentProps<'svg'>) {
  return createElement(iconMap[type], props)
}
