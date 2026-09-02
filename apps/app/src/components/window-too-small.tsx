import { RiExpandDiagonalLine } from '@remixicon/react'
import { MIN_WINDOW_HEIGHT, MIN_WINDOW_WIDTH } from '@tamery/shared/constants'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'
import { AnimatePresence, motion } from 'motion/react'
import { useSubscription } from 'seitu/react'
import { createMediaQuery } from 'seitu/web'

const windowTooSmall = createMediaQuery({
  query: `(max-width: ${MIN_WINDOW_WIDTH - 1}px), (max-height: ${MIN_WINDOW_HEIGHT - 1}px)`,
})

export const WindowTooSmall = () => {
  const isTooSmall = useSubscription(windowTooSmall)

  return (
    <AnimatePresence>
      {isTooSmall && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
          className="bg-background fixed inset-0 z-100 flex [-webkit-app-region:drag]"
        >
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RiExpandDiagonalLine />
              </EmptyMedia>
              <EmptyTitle>Window is too small</EmptyTitle>
              <EmptyDescription>
                Tamery needs at least {MIN_WINDOW_WIDTH} × {MIN_WINDOW_HEIGHT}{' '}
                points to show the navigator, tabs and chat side by side. Resize
                the window to continue.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
