import {
  ConnectionType,
  connectionTypeLabels,
} from '@tamery/shared/enums/connection-type'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'

import { Reveal } from '~/components/reveal'

export const Engines = () => (
  <section
    aria-label="Supported databases"
    className="mx-auto max-w-6xl px-4 pt-12 pb-8 sm:px-6"
  >
    <Reveal className="text-muted-foreground flex flex-wrap justify-center gap-x-12 gap-y-6">
      {Object.values(ConnectionType).map((type) => (
        <span
          key={type}
          className="flex items-center justify-center gap-2.5 text-base font-medium"
        >
          <ConnectionIcon type={type} className="size-6" />
          {connectionTypeLabels[type]}
        </span>
      ))}
    </Reveal>
  </section>
)
