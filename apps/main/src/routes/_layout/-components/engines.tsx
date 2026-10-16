import {
  ConnectionType,
  connectionTypeLabels,
} from '@tamery/shared/enums/connection-type'
import { CloudflareD1Icon } from '@tamery/ui/components/icons/cloudflare-d1'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import { TursoIcon } from '@tamery/ui/components/icons/turso'

import { Reveal } from '~/components/reveal'

/** Turso and D1 are SQLite in another place, not engines of their own, so they follow it. */
const ENGINES = [
  ...Object.values(ConnectionType).map((type) => ({
    icon: <ConnectionIcon type={type} className="size-6" />,
    label: connectionTypeLabels[type],
  })),
  { icon: <TursoIcon className="size-6" />, label: 'Turso' },
  { icon: <CloudflareD1Icon className="size-6" />, label: 'Cloudflare D1' },
]

export const Engines = () => (
  <section
    aria-label="Supported databases"
    className="mx-auto max-w-6xl px-4 pt-12 pb-8 sm:px-6"
  >
    <Reveal className="text-muted-foreground flex flex-wrap justify-center gap-x-12 gap-y-6 sm:grid sm:grid-cols-4 sm:justify-items-center">
      {ENGINES.map(({ icon, label }) => (
        <span
          key={label}
          className="flex items-center justify-center gap-2.5 text-base font-medium"
        >
          {icon}
          {label}
        </span>
      ))}
    </Reveal>
  </section>
)
