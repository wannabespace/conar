import {
  RiAlertLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiInformationLine,
} from '@remixicon/react'
import type { RouterOutputs } from '@tamery/api/orpc/routers'
import { Button } from '@tamery/ui/components/button'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { Spinner } from '@tamery/ui/components/spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { type } from 'arktype'
import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { createWebStorageValue } from 'seitu/web'

import {
  MAX_RECONNECTION_ATTEMPTS,
  reconnectingPromises,
  slowQueries,
} from '~/entities/connection/runtime'
import { orpc } from '~/lib/orpc'
import { appStore } from '~/store'

type BannerItem = NonNullable<RouterOutputs['banner']>[number]

const typeConfig = {
  error: {
    className: 'bg-red-500/5 border-red-500/20 text-red-400',
    icon: <RiAlertLine className="size-4 shrink-0" />,
  },
  info: {
    className: 'bg-blue-500/5 border-blue-500/20 text-blue-400',
    icon: <RiInformationLine className="size-4 shrink-0" />,
  },
  success: {
    className: 'bg-green-500/5 border-green-500/20 text-green-400',
    icon: <RiCheckboxCircleLine className="size-4 shrink-0" />,
  },
  warning: {
    className: 'bg-orange-500/5 border-orange-500/20 text-orange-400',
    icon: <RiErrorWarningLine className="size-4 shrink-0" />,
  },
} satisfies Record<BannerItem['type'], { icon: ReactNode; className: string }>

const bannerDismissedValue = createWebStorageValue({
  defaultValue: [],
  key: 'banner-dismissed',
  schema: type('string[]'),
  type: 'localStorage',
})

const Banner = ({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) => (
  <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: '2rem', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    className={cn('relative shrink-0 border-b text-sm', className)}
  >
    <div className="absolute inset-0 flex h-full items-center gap-2 px-4 py-1">
      {children}
    </div>
  </motion.div>
)

const elapsedSeconds = (since: number) =>
  Math.round((Date.now() - since) / 1000)

const ElapsedSeconds = ({ since }: { since: number }) => {
  const [seconds, setSeconds] = useState(() => elapsedSeconds(since))

  useEffect(() => {
    const interval = setInterval(() => setSeconds(elapsedSeconds(since)), 1000)

    return () => clearInterval(interval)
  }, [since])

  return (
    <NumberFlow
      value={seconds}
      suffix="s"
      className="tabular-nums opacity-70"
    />
  )
}

export const GlobalBanner = () => {
  const { resourceId } = useParams({ strict: false })
  const reconnectingData = useSubscription(reconnectingPromises, {
    selector: (state) =>
      (resourceId &&
        Object.values(state).find((p) => p.resourceId === resourceId)) ||
      null,
  })
  const waitingSince = useSubscription(slowQueries, {
    selector: (state) =>
      Math.min(
        ...Object.values(state)
          .filter((query) => resourceId && query.resourceId === resourceId)
          .map((query) => query.startedAt)
      ),
  })
  const isOnline = useSubscription(appStore, {
    selector: (state) => state.isOnline,
  })
  const dismissed = useSubscription(bannerDismissedValue)

  const { data = [] } = useQuery(
    orpc.banner.queryOptions({
      refetchInterval: 1000 * 60 * 5,
      select: (bannerItems) => {
        const filtered = bannerItems?.filter(
          (item) => !dismissed.includes(item.text)
        )
        return [
          ...(isOnline
            ? []
            : [
                {
                  dismissible: false,
                  text: 'You are currently offline. Some features may be unavailable until your internet connection is restored.',
                  type: 'info',
                } satisfies BannerItem,
              ]),
          ...filtered,
        ]
      },
      staleTime: 1000 * 60 * 5,
      throwOnError: false,
    })
  )

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {data.map((item) => (
        <Banner key={item.text} className={typeConfig[item.type].className}>
          {typeConfig[item.type].icon}
          <span className="flex-1 leading-none">{item.text}</span>
          {item.dismissible && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Dismiss banner"
                    className="hover:bg-foreground/10"
                    onClick={() =>
                      bannerDismissedValue.set((state) => [...state, item.text])
                    }
                  />
                }
              >
                <RiCloseLine className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="bottom">Dismiss</TooltipContent>
            </Tooltip>
          )}
        </Banner>
      ))}
      {!reconnectingData && Number.isFinite(waitingSince) && (
        <Banner key="slow-query" className={typeConfig.info.className}>
          {typeConfig.info.icon}
          <span className="flex flex-1 items-center gap-2 leading-none">
            <span>The database is taking longer than usual to respond.</span>
            <ElapsedSeconds since={waitingSince} />
            <Spinner className="size-3.5" />
          </span>
        </Banner>
      )}
      {reconnectingData && (
        <Banner className={typeConfig.warning.className}>
          {typeConfig.warning.icon}
          <span className="flex flex-1 items-center gap-2 leading-none">
            <span>
              Could not connect to the connection. Reconnection attempt{' '}
              <NumberFlow
                value={reconnectingData.attempt}
                suffix={`/${MAX_RECONNECTION_ATTEMPTS}`}
              />
            </span>
            <Spinner className="size-3.5" />
          </span>
        </Banner>
      )}
    </AnimatePresence>
  )
}
