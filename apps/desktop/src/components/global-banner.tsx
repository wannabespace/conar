import type { ReactNode } from 'react'
import { Button } from '@conar/ui/components/button'
import { RiAlertLine, RiCheckboxCircleLine, RiCloseLine, RiErrorWarningLine, RiInformationLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { orpc } from '~/lib/orpc'

type BannerType = 'info' | 'warning' | 'error' | 'success'

interface BannerData {
  text: string
  type: BannerType
}

const typeConfig: Record<BannerType, { icon: ReactNode, className: string }> = {
  info: {
    icon: <RiInformationLine className="shrink-0" />,
    className: 'bg-blue-500/10 border-blue-500/40 text-blue-300',
  },
  warning: {
    icon: <RiErrorWarningLine className="shrink-0" />,
    className: 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300',
  },
  error: {
    icon: <RiAlertLine className="shrink-0" />,
    className: 'bg-red-500/10 border-red-500/40 text-red-300',
  },
  success: {
    icon: <RiCheckboxCircleLine className="shrink-0" />,
    className: 'bg-green-500/10 border-green-500/40 text-green-300',
  },
} as const

export function GlobalBanner() {
  const [dismissed, setDismissed] = useState(false)

  const { data } = useQuery<BannerData | null>({
    queryKey: ['banner', 'display'],
    queryFn: async () => {
      try {
        return await orpc.banner.display()
      }
      catch {
        return null
      }
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  })

  if (!data || dismissed)
    return null

  const cfg = typeConfig[data.type]

  return (
    <div className={`flex items-center gap-3 px-4 py-2 border-b text-sm ${cfg.className}`}>
      {cfg.icon}
      <span className="flex-1 leading-snug">{data.text}</span>
      <Button
        variant="ghost"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
        className="inline-flex items-center justify-center rounded hover:bg-white/10 transition-colors p-1"
      >
        <RiCloseLine />
      </Button>
    </div>
  )
}
