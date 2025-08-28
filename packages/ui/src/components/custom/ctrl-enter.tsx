import { getOS } from '@conar/shared/utils/os'
import { RiArrowUpLine, RiCommandLine, RiCornerDownLeftLine } from '@remixicon/react'

export function CtrlEnter({ userAgent }: { userAgent: string }) {
  const os = getOS(userAgent)

  return (
    <kbd className="flex items-center text-xs">
      {os.type === 'macos' ? <RiCommandLine className="size-2.5" /> : 'Ctrl'}
      <RiCornerDownLeftLine className="size-2.5" />
    </kbd>
  )
}

export function ShiftCtrlEnter({ userAgent }: { userAgent: string }) {
  const os = getOS(userAgent)

  return (
    <kbd className="flex items-center text-xs">
      {os.type === 'macos' ? <RiCommandLine className="size-2.5" /> : 'Ctrl'}
      <RiArrowUpLine className="size-3" />
      <RiCornerDownLeftLine className="size-2.5" />
    </kbd>
  )
}
