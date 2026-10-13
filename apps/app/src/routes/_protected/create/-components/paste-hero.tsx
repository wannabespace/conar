import { CommandIcon, McpServerIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { getOS } from '@tamery/shared/os'
import { Button } from '@tamery/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useKeyHold } from '@tanstack/react-hotkeys'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

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
  miss,
  onAgent,
  onClipboard,
}: {
  miss: Miss
  onAgent: () => void
  onClipboard: () => void
}) => {
  const reduceMotion = useReducedMotion()
  const modifierHeld = useKeyHold(isMac ? 'Meta' : 'Control')
  const pasteHeld = useKeyHold('V') && modifierHeld

  return (
    <div className="flex flex-col gap-7 lg:sticky lg:top-16 lg:col-span-2 lg:self-start">
      <motion.div
        key={miss.count}
        className="flex flex-col gap-7"
        animate={
          miss.count && !reduceMotion ? { x: [0, -6, 6, -3, 0] } : undefined
        }
        transition={{ duration: 0.3 }}
      >
        <h1 className="relative h-18 overflow-hidden text-3xl font-semibold tracking-tight">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={miss.shown ? 'miss' : 'prompt'}
              className="block"
              {...ROLL}
            >
              {miss.shown ? 'That’s not a connection.' : 'Paste anything.'}
              <span className="text-muted-foreground block">
                {miss.shown ? 'Try another URL.' : 'We’ll figure it out.'}
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
                {isMac ? (
                  <HugeiconsIcon icon={CommandIcon} strokeWidth={2} />
                ) : (
                  'Ctrl'
                )}
              </Keycap>
              <Keycap pressed={pasteHeld}>V</Keycap>
            </TooltipTrigger>
            <TooltipContent>Paste from clipboard</TooltipContent>
          </Tooltip>
          <span className="text-muted-foreground text-sm">
            or drop a file on the window
          </span>
        </div>
      </motion.div>
      <p className="text-muted-foreground text-sm text-pretty">
        {PASTE_FORMATS}
      </p>
      {window.electron && (
        <Button
          type="button"
          variant="ghost-tint-muted"
          size="sm"
          className="self-start"
          onClick={onAgent}
        >
          <HugeiconsIcon
            icon={McpServerIcon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          Add via MCP
        </Button>
      )}
    </div>
  )
}
