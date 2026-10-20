import { Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ConnectionType, Provider } from '@tamery/shared/enums/connection-type'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import { motion } from 'motion/react'

import { ProductCrop } from './product-crop'
import { appear, pop, rise, vanish } from './variants'

const ROWS_AT = 0.2
const ARRIVE_STEP = 0.18

const CONNECTIONS = [
  {
    label: 'production',
    name: 'storefront',
    sync: 'Full',
    type: ConnectionType.Postgres,
  },
  {
    label: 'analytics',
    name: 'events',
    sync: 'No password',
    type: ConnectionType.ClickHouse,
  },
  {
    label: 'staging',
    name: 'billing',
    sync: 'Full',
    type: ConnectionType.MySQL,
  },
  {
    label: 'edge',
    name: 'cache',
    provider: Provider.Turso,
    sync: 'Metadata only',
    type: ConnectionType.SQLite,
  },
]

const SYNCED_AT = ROWS_AT + (CONNECTIONS.length + 1) * ARRIVE_STEP

export const SyncIllustration = () => (
  <ProductCrop className="min-w-0">
    <div className="text-muted-foreground flex h-8 items-center border-b px-3 text-xs font-medium">
      Connections
      <span className="relative ml-auto flex items-center">
        <motion.span variants={vanish(SYNCED_AT)} className="absolute right-0">
          Syncing…
        </motion.span>
        <motion.span
          variants={appear(SYNCED_AT)}
          className="flex items-center gap-1"
        >
          <HugeiconsIcon
            icon={Tick02Icon}
            strokeWidth={2}
            className="text-primary size-3.5"
          />
          Up to date
        </motion.span>
      </span>
    </div>
    {CONNECTIONS.map(
      ({ label, name, provider, sync, type: connectionType }, index) => (
        <motion.div
          key={name}
          variants={rise(ROWS_AT + index * ARRIVE_STEP)}
          className="flex h-11 items-center gap-2.5 border-b px-3 text-sm"
        >
          <ConnectionIcon
            type={connectionType}
            provider={provider}
            className="size-4 shrink-0"
          />
          <span className="font-medium">{name}</span>
          <span className="text-muted-foreground">{label}</span>
          <motion.span
            variants={pop(ROWS_AT + 0.15 + index * ARRIVE_STEP, 0)}
            className="bg-secondary text-muted-foreground text-2xs ml-auto rounded-md px-1.5 py-0.5"
          >
            {sync}
          </motion.span>
        </motion.div>
      )
    )}
  </ProductCrop>
)
