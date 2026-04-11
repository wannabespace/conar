import type { ReactNode } from 'react'
import type { ORPCOutputs } from '~/lib/orpc'
import { Button } from '@conar/ui/components/button'
import { Spinner } from '@conar/ui/components/spinner'
import { cn } from '@conar/ui/lib/utils'
import NumberFlow from '@number-flow/react'
import { RiAlertLine, RiCheckboxCircleLine, RiCloseLine, RiErrorWarningLine, RiInformationLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { type } from 'arktype'
import { AnimatePresence, motion } from 'motion/react'
import { useSubscription } from 'seitu/react'
import { createWebStorageValue } from 'seitu/web'
import { MAX_RECONNECTION_ATTEMPTS, reconnectingPromises } from '~/entities/connection/query'
import { orpc } from '~/lib/orpc'
import { appStore } from '~/store'

type BannerItem = NonNullable<ORPCOutputs['banner']>[number]

const typeConfig = {
  info: {
    icon: <RiInformationLine className="size-4 shrink-0" />,
    className: 'bg-blue-500/5 border-blue-500/20 text-blue-400',
  },
  warning: {
    icon: <RiErrorWarningLine className="size-4 shrink-0" />,
    className: 'bg-orange-500/5 border-orange-500/20 text-orange-400',
  },
  error: {
    icon: <RiAlertLine className="size-4 shrink-0" />,
    className: 'bg-red-500/5 border-red-500/20 text-red-400',
  },
  success: {
    icon: <RiCheckboxCircleLine className="size-4 shrink-0" />,
    className: 'bg-green-500/5 border-green-500/20 text-green-400',
  },
} satisfies Record<BannerItem['type'], { icon: ReactNode, className: string }>

const bannerDismissedValue = createWebStorageValue({
  type: 'localStorage',
  key: 'banner-dismissed',
  defaultValue: [],
  schema: type('string[]'),
})

function Banner({ className, children }: { className?: string, children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: '2rem' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn('relative shrink-0 border-b text-sm', className)}
    >
      <div className="absolute inset-0 flex h-full items-center gap-2 px-4 py-1">
        {children}
      </div>
    </motion.div>
  )
}

export function GlobalBanner() {
  const { resourceId } = useParams({ strict: false })
  const reconnectingData = useSubscription(reconnectingPromises, { selector: state => Object.values(state).find(p => p.resourceId === resourceId) ?? null })
  const isOnline = useSubscription(appStore, { selector: state => state.isOnline })
  const dismissed = useSubscription(bannerDismissedValue)

  const { data = [] } = useQuery(orpc.banner.queryOptions({
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    throwOnError: false,
    select: (data) => {
      const filtered = data?.filter(item => !dismissed.includes(item.text))
      return [
        ...(isOnline
          ? []
          : [{
            text: 'You are currently offline. Some features may be unavailable until your internet connection is restored.',
            type: 'info',
            dismissible: false,
          } satisfies BannerItem]),
        ...filtered,
      ]
    },
  }))

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {data.map(item => (
        <Banner key={item.text} className={typeConfig[item.type].className}>
          {typeConfig[item.type].icon}
          <span className="flex-1 leading-none">{item.text}</span>
          {item.dismissible && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Dismiss banner"
              onClick={() => bannerDismissedValue.set(state => [...state, item.text])}
            >
              <RiCloseLine className="size-3.5" />
            </Button>
          )}
        </Banner>
      ))}
      {reconnectingData && (
        <Banner className={typeConfig.warning.className}>
          {typeConfig.warning.icon}
          <span className="flex flex-1 items-center gap-2 leading-none">
            <span>
              Could not connect to the database. Reconnection attempt
              {' '}
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
