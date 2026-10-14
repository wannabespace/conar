import { getOS } from '@tamery/shared/os'
import { Ctrl } from '@tamery/ui/components/custom/shortcuts'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useKeyHold } from '@tanstack/react-hotkeys'
import {
  AnimatePresence,
  motion,
  useAnimate,
  useReducedMotion,
} from 'motion/react'
import { useEffect } from 'react'

import { AgentButton } from './agent-button'
import { Keycap } from './keycap'

const ROLL = {
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '-100%' },
  initial: { opacity: 0, y: '100%' },
  transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] },
} as const

export interface PasteFlash {
  count: number
  result: 'hit' | 'miss'
  shown: boolean
}

const FLASH_COPY = {
  hit: { subtitle: 'Review and save.', title: 'Got it.' },
  miss: { subtitle: 'Try another URL.', title: 'That’s not a connection.' },
}

export const isMac = getOS(navigator.userAgent).type === 'macos'

export const PASTE_FORMATS =
  'Connection URLs, .env files, JDBC strings, and psql, mysql or ssh commands.'

export const PasteHero = ({
  editingName,
  flash,
  onAgent,
  onClipboard,
}: {
  editingName?: string
  flash: PasteFlash
  onAgent: () => void
  onClipboard: () => void
}) => {
  const reduceMotion = useReducedMotion()
  const modifierHeld = useKeyHold(isMac ? 'Meta' : 'Control')
  const pasteHeld = useKeyHold('V') && modifierHeld
  const [shakeScope, shake] = useAnimate<HTMLDivElement>()

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
                (editingName ? (
                  <span data-mask className="block truncate">
                    {editingName}
                  </span>
                ) : (
                  'Paste anything.'
                ))}
              <span className="text-muted-foreground block">
                {flash.shown && FLASH_COPY[flash.result].subtitle}
                {!flash.shown &&
                  (editingName
                    ? 'Edit it or paste a new one.'
                    : 'We’ll figure it out.')}
              </span>
            </motion.span>
          </AnimatePresence>
        </h1>
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
      </div>
      <p className="text-muted-foreground text-sm text-pretty">
        {PASTE_FORMATS}
      </p>
      {window.electron && !editingName && <AgentButton onClick={onAgent} />}
    </div>
  )
}
