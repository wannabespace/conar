import { Settings01Icon } from '@hugeicons/core-free-icons'

import { SidebarLink } from '~/components/sidebar-button'
import type { MainModule } from '~/lib/module'

const SettingsLink = () => (
  <SidebarLink to="/account/settings" icon={Settings01Icon}>
    Settings
  </SidebarLink>
)

export default {
  accountNav: [{ Component: SettingsLink, order: 30 }],
} satisfies MainModule
