import { File01Icon } from '@hugeicons/core-free-icons'

import { SidebarLink } from '~/components/sidebar-button'
import type { MainModule } from '~/lib/module'

const BillingLink = () => (
  <SidebarLink to="/account/billing" icon={File01Icon}>
    Billing & Invoices
  </SidebarLink>
)

export default {
  accountNav: [{ Component: BillingLink, order: 10 }],
} satisfies MainModule
