import { ChartLineData01Icon } from '@hugeicons/core-free-icons'

import { SidebarLink } from '~/components/sidebar-button'
import type { MainModule } from '~/lib/module'

const AiUsageLink = () => (
  <SidebarLink to="/account/ai-usage" icon={ChartLineData01Icon}>
    AI Usage
  </SidebarLink>
)

export default {
  accountNav: [{ Component: AiUsageLink, order: 20 }],
} satisfies MainModule
