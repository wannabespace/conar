import {
  ArrowRight01Icon,
  File01Icon,
  Layers01Icon,
  LayoutTable02Icon,
  PlusSignIcon,
  Refresh01Icon,
  Search01Icon,
  SecurityCheckIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@tamery/ui/components/input-group'
import {
  SidebarGroupLabel,
  SidebarMenuButton,
} from '@tamery/ui/components/sidebar'

const TABLES = [
  { name: 'customers' },
  { name: 'invoices' },
  { name: 'orders', active: true },
  { name: 'products' },
  { name: 'sessions', secured: true },
  { name: 'users', secured: true },
]

export const Navigator = () => (
  <div className="text-foreground flex h-full w-52 shrink-0 flex-col pr-1.5">
    <div className="shrink-0 pt-0.5 pb-1.5 pl-2">
      <SidebarMenuButton>
        <span className="flex w-full items-center gap-2">
          <HugeiconsIcon
            icon={Layers01Icon}
            strokeWidth={2}
            className="text-muted-foreground"
          />
          Schema
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="text-muted-foreground/60 ml-auto size-3.5!"
          />
        </span>
      </SidebarMenuButton>
    </div>
    <div className="flex shrink-0 items-center gap-1 pb-1.5 pl-2">
      <InputGroup size="sm">
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search" readOnly />
      </InputGroup>
      <Button variant="outline-muted" size="icon-sm">
        <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} />
      </Button>
    </div>
    <div className="flex min-h-0 flex-1 flex-col gap-0.5 pl-2">
      <SidebarGroupLabel className="mb-1">
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={2}
          className="rotate-90"
        />
        <span className="text-2xs text-foreground font-semibold tracking-wider uppercase">
          public
        </span>
      </SidebarGroupLabel>
      {TABLES.map((table) => (
        <SidebarMenuButton key={table.name} isActive={table.active}>
          <HugeiconsIcon
            icon={LayoutTable02Icon}
            strokeWidth={2}
            className="text-primary/75"
          />
          <span className="flex min-w-0 flex-1 items-center gap-1">
            <span className="truncate">{table.name}</span>
            {table.secured && (
              <HugeiconsIcon
                icon={SecurityCheckIcon}
                strokeWidth={2}
                className="text-muted-foreground size-3!"
              />
            )}
          </span>
        </SidebarMenuButton>
      ))}
      <SidebarMenuButton>
        <HugeiconsIcon
          icon={ViewIcon}
          strokeWidth={2}
          className="text-primary/75"
        />
        <span>revenue_daily</span>
      </SidebarMenuButton>
    </div>
    <div className="flex shrink-0 flex-col gap-0.5 pt-1.5 pb-0.5 pl-2">
      <SidebarMenuButton>
        <HugeiconsIcon
          icon={PlusSignIcon}
          strokeWidth={2}
          className="text-muted-foreground"
        />
        <span>New query</span>
      </SidebarMenuButton>
      <SidebarMenuButton>
        <HugeiconsIcon
          icon={File01Icon}
          strokeWidth={2}
          className="text-muted-foreground"
        />
        <span>Query logger</span>
      </SidebarMenuButton>
    </div>
  </div>
)
