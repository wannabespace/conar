import { cn } from '@connnect/ui/lib/utils'
import { RiLoader4Fill } from '@remixicon/react'

export function LoadingContent({ children, className, loading }: { children: React.ReactNode, className?: string, loading: boolean }) {
  return (
    <span className={cn('relative overflow-hidden flex items-center duration-150 justify-center gap-2', className)}>
      <span className={cn(loading ? '-translate-y-1/2' : 'translate-y-5', 'duration-150 absolute left-1/2 top-1/2 -translate-x-1/2')}>
        <RiLoader4Fill
          className="animate-spin size-5"
        />
      </span>
      <span className={cn('flex items-center gap-2 duration-150', loading ? '-translate-y-5' : 'translate-y-0')}>
        {children}
      </span>
    </span>
  )
}
