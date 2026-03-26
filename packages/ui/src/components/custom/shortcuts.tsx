import type { ComponentProps } from 'react'
import { getOS } from '@conar/shared/utils/os'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowUpLine, RiCommandLine, RiCornerDownLeftLine } from '@remixicon/react'

function Ctrl({ userAgent }: { userAgent: string }) {
  const os = getOS(userAgent)

  return os.type === 'macos' ? <RiCommandLine className="size-3" /> : 'Ctrl'
}

export function EnterIcon() {
  return <RiCornerDownLeftLine className="size-3" />
}

export function CtrlEnter({ userAgent, className, ...props }: ComponentProps<'kbd'> & { userAgent: string }) {
  return (
    <kbd
      className={cn('flex items-center gap-1 text-xs', className)}
      {...props}
    >
      <Ctrl userAgent={userAgent} />
      <EnterIcon />
    </kbd>
  )
}

export function CtrlLetter({ userAgent, letter, className, ...props }: ComponentProps<'kbd'> & { userAgent: string, letter: string }) {
  return (
    <kbd className={cn('flex items-center gap-1 text-xs', className)} {...props}>
      <Ctrl userAgent={userAgent} />
      <span>{letter}</span>
    </kbd>
  )
}

export function ShiftCtrlEnter({ userAgent, className, ...props }: ComponentProps<'kbd'> & { userAgent: string }) {
  return (
    <kbd className={cn('flex items-center gap-1 text-xs', className)} {...props}>
      <Ctrl userAgent={userAgent} />
      <RiArrowUpLine className="size-3" />
      <RiCornerDownLeftLine className="size-3" />
    </kbd>
  )
}

export function ShiftCtrlLetter({ userAgent, letter, className, ...props }: ComponentProps<'kbd'> & { userAgent: string, letter: string }) {
  return (
    <kbd className={cn('flex items-center text-xs', className)} {...props}>
      <Ctrl userAgent={userAgent} />
      <RiArrowUpLine className="size-3" />
      {letter}
    </kbd>
  )
}
