import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { themeStore } from '@conar/ui/theme-store'
import { RiComputerLine, RiMoonLine, RiSunLine } from '@remixicon/react'

export function ThemeToggle({ children, side = 'right' }: { children: React.ReactNode, side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
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
