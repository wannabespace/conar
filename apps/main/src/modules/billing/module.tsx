import { File01Icon } from '@hugeicons/core-free-icons'

import { SidebarLink } from '~/components/sidebar-button'

export const BillingLink = () => (
  <SidebarLink to="/account/billing" icon={File01Icon}>
    Billing & Invoices
  </SidebarLink>
)
