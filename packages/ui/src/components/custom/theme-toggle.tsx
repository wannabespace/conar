import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { useTheme } from '@conar/ui/use-theme'
import { RiComputerLine, RiMoonLine, RiSunLine } from '@remixicon/react'

export function ThemeToggle({ children, side = 'right' }: { children: React.ReactNode, side?: 'top' | 'right' | 'bottom' | 'left' }) {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} className="min-w-32">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <RiSunLine aria-hidden="true" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <RiMoonLine aria-hidden="true" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <RiComputerLine aria-hidden="true" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
