import { ComputerIcon, Moon02Icon, Sun03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import { themeStore } from '@tamery/ui/theme-store'
import type { ComponentProps } from 'react'

export const ThemeToggle = ({
  side = 'right',
  ...props
}: ComponentProps<typeof DropdownMenuTrigger> & {
  side?: 'top' | 'right' | 'bottom' | 'left'
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger {...props} />
    <DropdownMenuContent side={side} className="min-w-32">
      <DropdownMenuItem onClick={() => themeStore.set('light')}>
        <HugeiconsIcon icon={Sun03Icon} strokeWidth={2} aria-hidden="true" />
        Light
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => themeStore.set('dark')}>
        <HugeiconsIcon icon={Moon02Icon} strokeWidth={2} aria-hidden="true" />
        Dark
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => themeStore.set('system')}>
        <HugeiconsIcon icon={ComputerIcon} strokeWidth={2} aria-hidden="true" />
        System
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)
