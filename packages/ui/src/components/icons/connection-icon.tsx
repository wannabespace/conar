import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { ClickHouseIcon } from '@tamery/ui/components/icons/clickhouse'
import { MSSQLIcon } from '@tamery/ui/components/icons/mssql'
import { MySQLIcon } from '@tamery/ui/components/icons/mysql'
import { PostgresIcon } from '@tamery/ui/components/icons/postgres'
import type { ComponentProps, ReactNode } from 'react'
import { createElement } from 'react'

const iconMap: Record<
  ConnectionType,
  (props: ComponentProps<'svg'>) => ReactNode
> = {
  [ConnectionType.Postgres]: PostgresIcon,
  [ConnectionType.MySQL]: MySQLIcon,
  [ConnectionType.ClickHouse]: ClickHouseIcon,
  [ConnectionType.MSSQL]: MSSQLIcon,
}

export const ConnectionIcon = ({
  type,
  ...props
}: { type: ConnectionType } & ComponentProps<'svg'>) =>
  createElement(iconMap[type], props)
