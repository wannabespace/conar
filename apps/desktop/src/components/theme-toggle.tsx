import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { useTheme } from '@conar/ui/theme-observer'
import { RiComputerLine, RiMoonLine, RiSunLine } from '@remixicon/react'

export function ThemeToggle({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" className="min-w-32">
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
