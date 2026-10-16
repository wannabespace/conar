import { useHotkeys } from '@tanstack/react-hotkeys'
import type { Ref } from 'react'
import { useRef } from 'react'

import { posthog } from '~/lib/posthog'

import { GetStartedStep } from './get-started-step'
import type { GetStartedStep as Step } from './use-get-started-steps'

export const GetStartedList = ({
  actionRef,
  current,
  onRun,
  steps,
}: {
  actionRef: Ref<HTMLButtonElement>
  current: Step
  onRun: () => void
  steps: Step[]
}) => {
  const listRef = useRef<HTMLDivElement>(null)

  const moveFocus = (event: KeyboardEvent, delta: 1 | -1) => {
    const targets = [
      ...(listRef.current?.querySelectorAll<HTMLElement>(
        '[data-step-target]'
      ) ?? []),
    ]
    const next =
      targets[targets.indexOf(document.activeElement as HTMLElement) + delta]
    if (next) {
      event.preventDefault()
      next.focus()
    }
  }
  useHotkeys(
    [
      { callback: (event) => moveFocus(event, 1), hotkey: 'ArrowDown' },
      { callback: (event) => moveFocus(event, -1), hotkey: 'ArrowUp' },
    ],
    { target: listRef }
  )

  return (
    <div ref={listRef} className="-mx-2 -mb-2 flex flex-col gap-0.5">
      {steps.map((step, index) => (
        <GetStartedStep
          key={step.id}
          step={step}
          number={index + 1}
          current={step === current}
          actionRef={actionRef}
          onRun={(run) => {
            posthog.capture('get_started_step_clicked', { step: step.id })
            onRun()
            void run()
          }}
        />
      ))}
    </div>
  )
}
