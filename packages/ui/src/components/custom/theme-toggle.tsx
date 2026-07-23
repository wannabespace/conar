import { RiComputerLine, RiMoonLine, RiSunLine } from '@remixicon/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import { themeStore } from '@tamery/ui/theme-store'
import type { ComponentProps } from 'react'

export function ThemeToggle({
  side = 'right',
  ...props
}: ComponentProps<typeof DropdownMenuTrigger> & { side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger {...props} />
      <DropdownMenuContent side={side} className="min-w-32">
        <DropdownMenuItem onClick={() => themeStore.set('light')}>
          <RiSunLine aria-hidden="true" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => themeStore.set('dark')}>
          <RiMoonLine aria-hidden="true" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => themeStore.set('system')}>
          <RiComputerLine aria-hidden="true" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
