import {
  ArrowRight01Icon,
  CommandIcon,
  UnfoldMoreIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { AppLogo } from '@tamery/ui/components/brand/app-logo'
import { Button } from '@tamery/ui/components/button'
import { UserAvatar } from '@tamery/ui/components/custom/user-avatar'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import type { ReactNode } from 'react'

import { WindowButtons } from '~/components/product/window-buttons'

const DEMO_USER = { email: 'demo@tamery.app' }

const Crumb = () => (
  <HugeiconsIcon
    icon={ArrowRight01Icon}
    strokeWidth={2}
    className="text-muted-foreground/40 size-3.5 shrink-0"
  />
)

const Switcher = ({ children }: { children: ReactNode }) => (
  <Button variant="ghost" size="sm">
    {children}
    <HugeiconsIcon
      icon={UnfoldMoreIcon}
      strokeWidth={2}
      className="text-muted-foreground/70 size-3 shrink-0"
    />
  </Button>
)

export const TitleBar = () => (
  <div className="border-b-border bg-card flex h-10 shrink-0 items-center gap-1.5 border-b px-2">
    <WindowButtons className="px-2" />
    <span className="shrink-0 rounded-md p-1.5">
      <AppLogo className="text-primary size-4" />
    </span>
    <Crumb />
    <Switcher>
      <span className="bg-muted text-2xs text-accent-foreground flex size-4 shrink-0 items-center justify-center rounded font-medium">
        P
      </span>
      Personal workspace
    </Switcher>
    <Crumb />
    <Switcher>
      <ConnectionIcon type={ConnectionType.Postgres} className="size-4" />
      storefront
    </Switcher>
    <Crumb />
    <Switcher>
      <span className="text-muted-foreground">production</span>
    </Switcher>
    <div className="ml-auto flex h-full shrink-0 items-center gap-1">
      <Button variant="ghost" size="icon-sm">
        <HugeiconsIcon icon={CommandIcon} strokeWidth={2} />
      </Button>
      <span className="bg-border mx-1 h-4 w-px shrink-0 self-center" />
      <UserAvatar user={DEMO_USER} className="size-5" />
    </div>
  </div>
)
