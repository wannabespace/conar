import type { ComponentProps } from 'react'
import { getOS } from '@conar/shared/utils/os'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowUpLine, RiCommandLine, RiCornerDownLeftLine } from '@remixicon/react'

export function Ctrl({ userAgent }: { userAgent: string }) {
  const os = getOS(userAgent)

  return os.type === 'macos' ? <RiCommandLine className="size-3" /> : 'Ctrl'
}

export function Enter() {
  return <RiCornerDownLeftLine className="size-3" />
}

export function CtrlEnter({ userAgent, className, ...props }: ComponentProps<'kbd'> & { userAgent: string }) {
  return (
    <kbd
      className={cn('flex items-center text-xs', className)}
      {...props}
    >
      <Ctrl userAgent={userAgent} />
      <Enter />
    </kbd>
  )
}

export function CtrlLetter({ userAgent, letter, className, ...props }: ComponentProps<'kbd'> & { userAgent: string, letter: string }) {
  return (
    <kbd className={cn('flex items-center text-xs', className)} {...props}>
      <Ctrl userAgent={userAgent} />
      {letter}
    </kbd>
  )
}

export function ShiftCtrlEnter({ userAgent, className, ...props }: ComponentProps<'kbd'> & { userAgent: string }) {
  return (
    <kbd className={cn('flex items-center text-xs', className)} {...props}>
      <Ctrl userAgent={userAgent} />
      <RiArrowUpLine className="size-3" />
      <RiCornerDownLeftLine className="size-3" />
    </kbd>
  )
}
