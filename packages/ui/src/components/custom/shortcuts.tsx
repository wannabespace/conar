import {
  ArrowUp02Icon,
  CommandIcon,
  CornerDownLeftIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { getOS } from '@tamery/shared/os'
import { cn } from '@tamery/ui/lib/utils'
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

export const KbdCtrlEnter = ({
  userAgent,
  ...props
}: ComponentProps<typeof Kbd> & { userAgent: string }) => (
  <Kbd {...props}>
    <Ctrl userAgent={userAgent} />
    <EnterIcon />
  </Kbd>
)

export const KbdCtrlLetter = ({
  userAgent,
  letter,
  ...props
}: ComponentProps<typeof Kbd> & { userAgent: string; letter: string }) => (
  <Kbd {...props}>
    <Ctrl userAgent={userAgent} />
    <span>{letter}</span>
  </Kbd>
)

export const KbdShiftCtrlEnter = ({
  userAgent,
  ...props
}: ComponentProps<typeof Kbd> & { userAgent: string }) => (
  <Kbd {...props}>
    <Ctrl userAgent={userAgent} />
    <HugeiconsIcon icon={ArrowUp02Icon} strokeWidth={2} className="size-3" />
    <HugeiconsIcon
      icon={CornerDownLeftIcon}
      strokeWidth={2}
      className="size-3"
    />
  </Kbd>
)
