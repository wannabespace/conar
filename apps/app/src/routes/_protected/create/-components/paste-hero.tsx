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
import type { ReactNode } from 'react'
import { useEffect } from 'react'

import { AgentButton } from './agent-button'

const EASE = [0.32, 0.72, 0, 1] as const

const ROLL = {
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '-100%' },
  initial: { opacity: 0, y: '100%' },
  transition: { duration: 0.25, ease: EASE },
}

export interface Miss {
  count: number
  shown: boolean
}

export const isMac = getOS(navigator.userAgent).type === 'macos'

export const PASTE_FORMATS =
  'Connection URLs, .env files, JDBC strings, and psql, mysql or ssh commands.'

const Keycap = ({
  children,
  pressed,
}: {
  children: ReactNode
  pressed: boolean
}) => (
  <motion.span
    data-pressed={pressed || undefined}
    className="bg-input ring-foreground/4 flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-base font-medium shadow-md ring transition-shadow duration-100 data-pressed:shadow-xs [&_svg]:size-4"
    animate={pressed ? { scale: 0.95, y: 2 } : { scale: 1, y: 0 }}
    transition={{ duration: 0.1, ease: EASE }}
  >
    {children}
  </motion.span>
)

export const PasteHero = ({
  editing,
  miss,
  onAgent,
  onClipboard,
}: {
  /** The name of the connection being edited; absent on a new one. */
  editing?: string
  miss: Miss
  onAgent: () => void
  onClipboard: () => void
}) => {
  const reduceMotion = useReducedMotion()
  const modifierHeld = useKeyHold(isMac ? 'Meta' : 'Control')
  const pasteHeld = useKeyHold('V') && modifierHeld
  const [shakeScope, shake] = useAnimate<HTMLDivElement>()

  // Shakes in place rather than re-keying the block, which would remount the focused clipboard keys and drop focus out of the page.
  useEffect(() => {
    if (miss.count && !reduceMotion) {
      void shake(
        shakeScope.current,
        { x: [0, -6, 6, -3, 0] },
        { duration: 0.3 }
      )
    }
  }, [miss.count, reduceMotion, shake, shakeScope])

  return (
    <div className="flex flex-col gap-7 lg:sticky lg:top-16 lg:col-span-2 lg:self-start">
      <div ref={shakeScope} className="flex flex-col gap-7">
        <h1 className="relative h-18 overflow-hidden text-3xl font-semibold tracking-tight">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={miss.shown ? 'miss' : 'prompt'}
              className="block"
              {...ROLL}
            >
              {miss.shown && 'That’s not a connection.'}
              {!miss.shown &&
                (editing ? (
                  <span data-mask className="block truncate">
                    {editing}
                  </span>
                ) : (
                  'Paste anything.'
                ))}
              <span className="text-muted-foreground block">
                {miss.shown && 'Try another URL.'}
                {!miss.shown &&
                  (editing
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
      {window.electron && !editing && <AgentButton onClick={onAgent} />}
    </div>
  )
}
