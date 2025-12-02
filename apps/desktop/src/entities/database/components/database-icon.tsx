import type { ComponentProps, JSX } from 'react'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { createElement } from 'react'
import { ClickHouseIcon } from '~/icons/clickhouse'
import { MySQLIcon } from '~/icons/mysql'
import { PostgresIcon } from '~/icons/postgres'

const iconMap: Record<DatabaseType, (props: ComponentProps<'svg'>) => JSX.Element> = {
  [DatabaseType.Postgres]: PostgresIcon,
  [DatabaseType.MySQL]: MySQLIcon,
  [DatabaseType.ClickHouse]: ClickHouseIcon,
}

export function DatabaseIcon({ type, ...props }: { type: DatabaseType } & ComponentProps<'svg'>) {
  return createElement(iconMap[type], props)
}
