import type { ReactNode } from 'react'
import type { ORPCOutputs } from '~/lib/orpc'
import { SUBSCRIPTION_PAST_DUE_MESSAGE } from '@conar/shared/constants'
import { Button } from '@conar/ui/components/button'
import { cn } from '@conar/ui/lib/utils'
import { RiAlertLine, RiCheckboxCircleLine, RiCloseLine, RiErrorWarningLine, RiInformationLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { type } from 'arktype'
import { AnimatePresence, motion } from 'motion/react'
import { useSubscription } from 'seitu/react'
import { createLocalStorageValue } from 'seitu/web'
import { orpc } from '~/lib/orpc'
import { appStore } from '~/store'

type BannerItem = NonNullable<ORPCOutputs['banner']>[number]

const typeConfig = {
  info: {
    icon: <RiInformationLine className="size-4 shrink-0" />,
    className: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  },
  warning: {
    icon: <RiErrorWarningLine className="size-4 shrink-0" />,
    className: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  },
  error: {
    icon: <RiAlertLine className="size-4 shrink-0" />,
    className: 'bg-red-500/10 border-red-500/20 text-red-400',
  },
  success: {
    icon: <RiCheckboxCircleLine className="size-4 shrink-0" />,
    className: 'bg-green-500/10 border-green-500/20 text-green-400',
  },
} satisfies Record<BannerItem['type'], { icon: ReactNode, className: string }>

const bannerDismissedValue = createLocalStorageValue({
  key: 'banner-dismissed',
  defaultValue: [],
  schema: type('string[]'),
})

export function GlobalBanner() {
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
          } satisfies BannerItem]),
        ...filtered,
      ]
    },
  }))

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {data.map(item => (
        <motion.div
          key={item.text}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: '2rem' }}
          exit={{ opacity: 0, height: 0 }}
          className={cn('relative shrink-0 border-b text-sm', typeConfig[item.type].className)}
        >
          <div className={`
            absolute inset-0 flex h-full items-center gap-2 px-4 py-1
          `}
          >
            {typeConfig[item.type].icon}
            <span className="flex-1 leading-none">{item.text}</span>
            {SUBSCRIPTION_PAST_DUE_MESSAGE !== item.text && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Dismiss banner"
                onClick={() => bannerDismissedValue.set(state => [...state, item.text])}
              >
                <RiCloseLine className="size-3.5" />
              </Button>
            )}
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  )
}
