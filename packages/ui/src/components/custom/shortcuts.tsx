import {
  ArrowDown02Icon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  ArrowUp02Icon,
  ArrowUpBigIcon,
  CommandIcon,
  CornerDownLeftIcon,
  DeletePutBackIcon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { getOS } from '@tamery/shared/os'
import { cn } from '@tamery/ui/lib/utils'
import type { Hotkey } from '@tanstack/react-hotkeys'
import { parseHotkey } from '@tanstack/react-hotkeys'
import type { ComponentProps } from 'react'

import { Kbd } from '../kbd'

export const Ctrl = ({
  className,
  userAgent,
}: {
  className?: string
  userAgent: string
}) => {
  const os = getOS(userAgent)

  return os.type === 'macos' ? (
    <HugeiconsIcon
      icon={CommandIcon}
      strokeWidth={2}
      className={cn('size-3', className)}
    />
  ) : (
    'Ctrl'
  )
}

export const EnterIcon = ({ className }: { className?: string }) => (
  <HugeiconsIcon
    icon={CornerDownLeftIcon}
    strokeWidth={2}
    className={cn('size-3', className)}
  />
)

const GLYPHS: Partial<Record<string, IconSvgElement>> = {
  ArrowDown: ArrowDown02Icon,
  ArrowLeft: ArrowLeft02Icon,
  ArrowRight: ArrowRight02Icon,
  ArrowUp: ArrowUp02Icon,
  Backspace: DeletePutBackIcon,
  Enter: CornerDownLeftIcon,
  Meta: CommandIcon,
  Shift: ArrowUpBigIcon,
}

const LABELS: Partial<Record<string, string>> = {
  Control: 'Ctrl',
  Escape: 'Esc',
}

export const KbdHotkey = ({
  hotkey,
  userAgent,
  ...props
}: ComponentProps<typeof Kbd> & { hotkey: Hotkey; userAgent: string }) => {
  const { key, modifiers } = parseHotkey(
    hotkey,
    getOS(userAgent).type === 'macos' ? 'mac' : 'windows'
  )

  return (
    <Kbd {...props}>
      {[...modifiers, key].map((part) => {
        const glyph = GLYPHS[part]
        return glyph ? (
          <HugeiconsIcon key={part} icon={glyph} strokeWidth={2} />
        ) : (
          <span key={part}>{LABELS[part] ?? part}</span>
        )
      })}
    </Kbd>
  )
}
