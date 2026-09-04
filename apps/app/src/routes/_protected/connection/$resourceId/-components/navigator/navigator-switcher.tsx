import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiStackLine,
} from '@remixicon/react'
import { Button } from '@tamery/ui/components/button'
import { getRouteApi } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useSubscription } from 'seitu/react'

import { getNavigatorStore, setNavigator } from '~/entities/connection/store'

import { sidebarActionRowClassName } from './primitives'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const TRANSITION = { duration: 0.15, ease: [0.32, 0.72, 0, 1] } as const

export const NavigatorSwitcher = () => {
  const { connectionResource } = useRouteContext()
  const navigator = useSubscription(getNavigatorStore(connectionResource.id))
  const isDefinitions = navigator === 'definitions'

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={isDefinitions ? 'Back to tables' : 'Open schema'}
      className={sidebarActionRowClassName}
      onClick={() =>
        setNavigator(
          connectionResource.id,
          isDefinitions ? 'tables' : 'definitions'
        )
      }
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={navigator}
          initial={{ opacity: 0, x: isDefinitions ? 6 : -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isDefinitions ? -6 : 6 }}
          transition={TRANSITION}
          className="flex w-full items-center gap-2"
        >
          {isDefinitions ? (
            <>
              <RiArrowLeftSLine className="text-muted-foreground size-4 shrink-0" />
              Tables
            </>
          ) : (
            <>
              <RiStackLine className="text-muted-foreground size-4 shrink-0" />
              Schema
              <RiArrowRightSLine className="text-muted-foreground/60 ml-auto size-3.5 shrink-0" />
            </>
          )}
        </motion.span>
      </AnimatePresence>
    </Button>
  )
}
