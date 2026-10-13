import { useRef } from 'react'

import { useLoop } from '../use-loop'
import { APPROVAL_STEP } from './script'
import { TameryWindow } from './tamery-window'
import { Terminal } from './terminal'

const STEP_MS = [900, 700, 900, 600, 2200, 350, 900, 4200]

export const AgentDemo = () => {
  const ref = useRef<HTMLDivElement>(null)
  const step = useLoop(ref, STEP_MS) ?? APPROVAL_STEP

  return (
    // A mask clips to its own box, so it reaches past the windows' shadows; the layout root clips the overflow
    <div className="-mx-20 mask-b-from-85% px-20 sm:mask-b-from-80%">
      <div
        ref={ref}
        inert
        aria-hidden
        className="relative h-152 select-none sm:h-104"
      >
        <Terminal step={step} />
        <TameryWindow step={step} />
      </div>
    </div>
  )
}
