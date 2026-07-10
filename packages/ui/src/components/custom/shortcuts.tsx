import type { ComponentProps } from 'react'
import { getOS } from '@conar/shared/utils/os'
import { RiArrowUpLine, RiCommandLine, RiCornerDownLeftLine } from '@remixicon/react'
import { Kbd } from '../kbd'

export function Ctrl({ userAgent }: { userAgent: string }) {
  const os = getOS(userAgent)

  return os.type === 'macos' ? <RiCommandLine className="size-3" /> : 'Ctrl'
}

export function EnterIcon() {
  return <RiCornerDownLeftLine className="size-3" />
}

export function KbdCtrlEnter({ userAgent, ...props }: ComponentProps<typeof Kbd> & { userAgent: string }) {
  return (
    <Kbd {...props}>
      <Ctrl userAgent={userAgent} />
      <EnterIcon />
    </Kbd>
  )
}

export function KbdCtrlLetter({ userAgent, letter, ...props }: ComponentProps<typeof Kbd> & { userAgent: string, letter: string }) {
  return (
    <Kbd {...props}>
      <Ctrl userAgent={userAgent} />
      <span>{letter}</span>
    </Kbd>
  )
}

export function KbdShiftCtrlEnter({ userAgent, ...props }: ComponentProps<typeof Kbd> & { userAgent: string }) {
  return (
    <Kbd {...props}>
      <Ctrl userAgent={userAgent} />
      <RiArrowUpLine className="size-3" />
      <RiCornerDownLeftLine className="size-3" />
    </Kbd>
  )
}

export function KbdShiftCtrlLetter({ userAgent, letter, ...props }: ComponentProps<typeof Kbd> & { userAgent: string, letter: string }) {
  return (
    <Kbd {...props}>
      <Ctrl userAgent={userAgent} />
      <RiArrowUpLine className="size-3" />
      {letter}
    </Kbd>
  )
}
