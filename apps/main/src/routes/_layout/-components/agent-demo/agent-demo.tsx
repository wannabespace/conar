import { useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { APPROVAL_STEP } from './script'
import { TameryWindow } from './tamery-window'
import { Terminal } from './terminal'

const STEP_MS = [900, 700, 900, 600, 2200, 350, 900, 4200]

const useStep = (playing: boolean) => {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!playing) {
      return
    }
    const timeout = setTimeout(
      () => setStep((step + 1) % STEP_MS.length),
      STEP_MS[step]
    )
    return () => clearTimeout(timeout)
  }, [playing, step])

  return step
}

export const AgentDemo = () => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.5 })
  const reduceMotion = useReducedMotion()
  const playingStep = useStep(inView && !reduceMotion)
  const step = reduceMotion ? APPROVAL_STEP : playingStep

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
