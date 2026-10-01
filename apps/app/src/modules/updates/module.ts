import type { AppModule } from '~/lib/module'

import { UpdatesObserver } from './updates-observer'

export default { mounts: [UpdatesObserver] } satisfies AppModule
