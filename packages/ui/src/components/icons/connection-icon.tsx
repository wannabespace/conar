import type { Engine } from '@tamery/shared/enums/connection-type'
import {
  ConnectionFlavor,
  ConnectionType,
} from '@tamery/shared/enums/connection-type'
import { ClickHouseIcon } from '@tamery/ui/components/icons/clickhouse'
import { MariaDBIcon } from '@tamery/ui/components/icons/mariadb'
import { MSSQLIcon } from '@tamery/ui/components/icons/mssql'
import { MySQLIcon } from '@tamery/ui/components/icons/mysql'
import { PostgresIcon } from '@tamery/ui/components/icons/postgres'
import type { ComponentProps, ReactNode } from 'react'
import { createElement } from 'react'

const iconMap: Record<Engine, (props: ComponentProps<'svg'>) => ReactNode> = {
  [ConnectionFlavor.MariaDB]: MariaDBIcon,
  [ConnectionType.Postgres]: PostgresIcon,
  [ConnectionType.MySQL]: MySQLIcon,
  [ConnectionType.ClickHouse]: ClickHouseIcon,
  [ConnectionType.MSSQL]: MSSQLIcon,
}

export const ConnectionIcon = ({
  engine,
  ...props
}: { engine: Engine } & ComponentProps<'svg'>) =>
  createElement(iconMap[engine], props)
