import { Ctrl } from '@tamery/ui/components/custom/shortcuts'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { isMac } from '@tamery/ui/lib/os'
import { useKeyHold } from '@tanstack/react-hotkeys'
import {
  AnimatePresence,
  motion,
  useAnimate,
  useReducedMotion,
} from 'motion/react'
import { useEffect } from 'react'

import type { FormMode } from '../lib/form-mode'
import type { PasteFlash } from '../lib/use-paste-connection'
import { PASTE_FORMATS } from '../lib/use-paste-connection'
import { AgentButton } from './agent-button'
import { Keycap } from './keycap'

const ROLL = {
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '-100%' },
  initial: { opacity: 0, y: '100%' },
  transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] },
} as const

const EDIT_SUBTITLES = {
  all: 'Edit it or paste a new one.',
  credentials: 'Fill in what’s missing here.',
  details: 'Add its server details here.',
}

const FLASH_COPY = {
  hit: { subtitle: 'Review and save.', title: 'Got it.' },
  miss: { subtitle: 'Try another URL.', title: 'That’s not a connection.' },
}

export const PasteHero = ({
  flash,
  mode,
  onAgent,
  onClipboard,
}: {
  flash: PasteFlash
  mode: FormMode
  onAgent: () => void
  onClipboard: () => void
}) => {
  const reduceMotion = useReducedMotion()
  const modifierHeld = useKeyHold(isMac ? 'Meta' : 'Control')
  const pasteHeld = useKeyHold('V') && modifierHeld
  const [shakeScope, shake] = useAnimate<HTMLDivElement>()
  const pasteable = mode.kind === 'create' || mode.scope !== 'credentials'

  // Shakes in place rather than re-keying the block, which would remount the focused clipboard keys and drop focus out of the page.
  useEffect(() => {
    if (flash.count && flash.result === 'miss' && !reduceMotion) {
      void shake(
        shakeScope.current,
        { x: [0, -6, 6, -3, 0] },
        { duration: 0.3 }
      )
    }
  }, [flash.count, flash.result, reduceMotion, shake, shakeScope])

  return (
    <div className="flex flex-col gap-7 lg:sticky lg:top-16 lg:col-span-2 lg:self-start">
      <div ref={shakeScope} className="flex flex-col gap-7">
        <h1 className="relative h-18 overflow-hidden text-3xl font-semibold tracking-tight">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={flash.shown ? flash.result : 'prompt'}
              className="block"
              {...ROLL}
            >
              {flash.shown && FLASH_COPY[flash.result].title}
              {!flash.shown &&
                (mode.kind === 'edit' ? (
                  <span data-mask className="block truncate">
                    {mode.name}
                  </span>
                ) : (
                  'Paste anything.'
                ))}
              <span className="text-muted-foreground block">
                {flash.shown && FLASH_COPY[flash.result].subtitle}
                {!flash.shown &&
                  (mode.kind === 'edit'
                    ? EDIT_SUBTITLES[mode.scope]
                    : 'We’ll figure it out.')}
              </span>
            </motion.span>
          </AnimatePresence>
        </h1>
        {pasteable && (
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label="Paste from clipboard"
                    className="focus-visible:focus-ring flex gap-1.5 rounded-xl outline-none"
                    onClick={onClipboard}
                  />
                }
              >
                <Keycap pressed={modifierHeld}>
                  <Ctrl userAgent={navigator.userAgent} />
                </Keycap>
                <Keycap pressed={pasteHeld}>V</Keycap>
              </TooltipTrigger>
              <TooltipContent>Paste from clipboard</TooltipContent>
            </Tooltip>
            <span className="text-muted-foreground text-sm">
              or drop a file on the window
            </span>
          </div>
        )}
      </div>
      {pasteable && (
        <p className="text-muted-foreground text-sm text-pretty">
          {PASTE_FORMATS}
        </p>
      )}
      {window.electron && mode.kind === 'create' && (
        <AgentButton onClick={onAgent} />
      )}
    </div>
  )
}
