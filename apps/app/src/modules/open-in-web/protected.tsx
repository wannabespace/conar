import type { ProtectedModule } from '~/lib/module'

import { OpenInWeb } from './open-in-web'

export default {
  titlebar: [{ Component: OpenInWeb, order: 40 }],
} satisfies ProtectedModule
