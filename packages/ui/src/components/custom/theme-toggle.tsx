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
          <DropdownMenuRadioItem value="light" closeOnClick>
            <HugeiconsIcon
              icon={Sun03Icon}
              strokeWidth={2}
              aria-hidden="true"
            />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" closeOnClick>
            <HugeiconsIcon
              icon={Moon02Icon}
              strokeWidth={2}
              aria-hidden="true"
            />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" closeOnClick>
            <HugeiconsIcon
              icon={ComputerIcon}
              strokeWidth={2}
              aria-hidden="true"
            />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
