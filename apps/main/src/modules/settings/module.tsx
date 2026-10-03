import { Settings01Icon } from '@hugeicons/core-free-icons'

import { SidebarLink } from '~/components/sidebar-button'

export const SettingsLink = () => (
  <SidebarLink to="/account/settings" icon={Settings01Icon}>
    Settings
  </SidebarLink>
)
