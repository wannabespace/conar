import {
  RiArrowUpLine,
  RiCommandLine,
  RiCornerDownLeftLine,
} from '@remixicon/react'
import { getOS } from '@tamery/shared/utils/os'
import type { ComponentProps } from 'react'

import { Kbd } from '../kbd'

export const Ctrl = ({ userAgent }: { userAgent: string }) => {
  const os = getOS(userAgent)

  return os.type === 'macos' ? <RiCommandLine className="size-3" /> : 'Ctrl'
}

export const EnterIcon = () => <RiCornerDownLeftLine className="size-3" />

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
    <RiArrowUpLine className="size-3" />
    <RiCornerDownLeftLine className="size-3" />
  </Kbd>
)

export const KbdShiftCtrlLetter = ({
  userAgent,
  letter,
  ...props
}: ComponentProps<typeof Kbd> & { userAgent: string; letter: string }) => (
  <Kbd {...props}>
    <Ctrl userAgent={userAgent} />
    <RiArrowUpLine className="size-3" />
    {letter}
  </Kbd>
)
