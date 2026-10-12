import { ComputerIcon, Moon02Icon, Sun03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import type { Theme } from '@tamery/ui/theme-store'
import { themeStore, useTheme } from '@tamery/ui/theme-store'
import type { ComponentProps } from 'react'

const THEMES = [
  { icon: Sun03Icon, label: 'Light', value: 'light' },
  { icon: Moon02Icon, label: 'Dark', value: 'dark' },
  { icon: ComputerIcon, label: 'System', value: 'system' },
] as const

export const ThemeToggle = ({
  side = 'right',
  ...props
}: ComponentProps<typeof DropdownMenuTrigger> & {
  side?: 'top' | 'right' | 'bottom' | 'left'
}) => {
  const theme = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger {...props} />
      <DropdownMenuContent side={side} className="min-w-32">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value: Theme) => themeStore.set(value)}
        >
          {THEMES.map(({ icon, label, value }) => (
            <DropdownMenuRadioItem key={value} value={value} closeOnClick>
              <HugeiconsIcon icon={icon} strokeWidth={2} aria-hidden="true" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
