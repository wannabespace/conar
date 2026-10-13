import {
  ArrowUp02Icon,
  Cancel01Icon,
  ChatAdd01Icon,
  HistoryIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  InputGroup,
  InputGroupButton,
  InputGroupTextarea,
} from '@tamery/ui/components/input-group'
import { AnimatePresence, motion } from 'motion/react'
import { useRef } from 'react'

import { useLoop } from '../use-loop'
import { Answer } from './answer'
import { FRAME_MS, FRAMES, REST_FRAME } from './playback'

export const ChatPanel = () => {
  const ref = useRef<HTMLDivElement>(null)
  const frame = FRAMES[useLoop(ref, FRAME_MS) ?? 0] ?? REST_FRAME
  const { conversation } = frame

  return (
    <div ref={ref} className="flex h-full w-72 shrink-0 flex-col pl-1.5">
      <div className="bg-background ring-foreground/4 flex h-full flex-col overflow-hidden rounded-xl ring">
        <div className="flex h-8 shrink-0 items-center gap-0.5 border-b pr-1 pl-3">
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {conversation.title}
          </span>
          {[HistoryIcon, ChatAdd01Icon, Cancel01Icon].map((icon, iconIndex) => (
            <Button key={iconIndex} variant="ghost-muted" size="icon-xs">
              <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5" />
            </Button>
          ))}
        </div>
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={conversation.title}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-3 py-3 text-sm"
          >
            <Answer frame={frame} />
          </motion.div>
        </AnimatePresence>
        <div className="shrink-0 p-2">
          <InputGroup className="relative">
            <InputGroupTextarea
              readOnly
              rows={1}
              value={
                frame.sent ? '' : conversation.question.slice(0, frame.typed)
              }
              placeholder="Ask about your database…"
              className="min-h-20 pb-9"
            />
            <div className="absolute right-1.5 bottom-1.5">
              <InputGroupButton size="icon-round" variant="default">
                <HugeiconsIcon icon={ArrowUp02Icon} strokeWidth={2} />
              </InputGroupButton>
            </div>
          </InputGroup>
        </div>
      </div>
    </div>
  )
}
