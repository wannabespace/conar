import { ConnectionType, Provider } from '@tamery/shared/enums/connection-type'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import { motion } from 'motion/react'

import { ProductCrop } from './product-crop'
import { pop, rise } from './variants'

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

export const SyncIllustration = () => (
  <ProductCrop className="min-w-0">
    <div className="text-muted-foreground flex h-8 items-center border-b px-3 text-xs font-medium">
      Connections
    </div>
    {CONNECTIONS.map(
      ({ label, name, provider, sync, type: connectionType }, index) => (
        <motion.div
          key={name}
          variants={rise(0.1 + index * 0.06)}
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
            variants={pop(0.4 + index * 0.06, 0)}
            className="bg-secondary text-muted-foreground text-2xs ml-auto rounded-md px-1.5 py-0.5"
          >
            {sync}
          </motion.span>
        </motion.div>
      )
    )}
  </ProductCrop>
)
