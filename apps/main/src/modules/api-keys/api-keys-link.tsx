import { Key01Icon } from '@hugeicons/core-free-icons'

import { SidebarLink } from '~/components/sidebar-button'

export const ApiKeysLink = () => (
  <SidebarLink to="/account/api-keys" icon={Key01Icon}>
    API keys
  </SidebarLink>
)
