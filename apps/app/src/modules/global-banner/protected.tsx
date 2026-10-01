import type { ProtectedModule } from '~/lib/module'

import { GlobalBanner } from './global-banner'

export default {
  banners: [{ Component: GlobalBanner, order: 0 }],
} satisfies ProtectedModule
