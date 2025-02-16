import type { ComponentProps, JSX } from 'react'
import { ConnectionType } from '@connnect/shared/enums/connection-type'
import { createElement } from 'react'
import { PostgresIcon } from '~/icons/postgres'

const iconMap: Record<ConnectionType, (props: ComponentProps<'svg'>) => JSX.Element> = {
  [ConnectionType.Postgres]: PostgresIcon,
}

export function ConnectionIcon({ type, ...props }: { type: ConnectionType } & ComponentProps<'svg'>) {
  return createElement(iconMap[type], props)
}
