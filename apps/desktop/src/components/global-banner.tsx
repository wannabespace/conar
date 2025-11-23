import type { ReactNode } from 'react'
import type { ORPCOutputs } from '~/lib/orpc'
import { Button } from '@conar/ui/components/button'
import { cn } from '@conar/ui/lib/utils'
import { RiAlertLine, RiCheckboxCircleLine, RiCloseLine, RiErrorWarningLine, RiInformationLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { orpcQuery } from '~/lib/orpc'

const typeConfig = {
  info: {
    icon: <RiInformationLine className="shrink-0 size-4" />,
    className: 'bg-blue-500/10 border-blue-500/40 text-blue-300',
  },
  warning: {
    icon: <RiErrorWarningLine className="shrink-0 size-4" />,
    className: 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300',
  },
  error: {
    icon: <RiAlertLine className="shrink-0 size-4" />,
    className: 'bg-red-500/10 border-red-500/40 text-red-300',
  },
  success: {
    icon: <RiCheckboxCircleLine className="shrink-0 size-4" />,
    className: 'bg-green-500/10 border-green-500/40 text-green-300',
  },
} satisfies Record<NonNullable<ORPCOutputs['banner']['display']>['type'], { icon: ReactNode, className: string }>

export function GlobalBanner() {
  const [dismissed, setDismissed] = useState(false)

  const { data } = useQuery(orpcQuery.banner.display.queryOptions({
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    throwOnError: false,
  }))

  if (!data || dismissed)
    return null

  return (
    <div data-slot="banner" className={cn('flex items-center gap-2 px-4 py-1 border-b text-sm', typeConfig[data.type].className)}>
      {typeConfig[data.type].icon}
      <span className="flex-1 leading-none">{data.text}</span>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Dismiss banner"
        onClick={() => setDismissed(true)}
      >
        <RiCloseLine />
      </Button>
    </div>
  )
}
