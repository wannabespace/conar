import { cn } from '@conar/ui/lib/utils'
import { Spinner } from '../spinner'

export function LoadingContent({
  children,
  className,
  loading,
  spinner = <Spinner />,
  contentClassName,
}: {
  children: React.ReactNode
  className?: string
  loading: boolean
  spinner?: React.ReactNode
  contentClassName?: string
}) {
  return (
    <span className={cn(`
      relative flex items-center justify-center gap-2 overflow-hidden
      duration-150
    `, className)}
    >
      <span className={cn(loading ? '-translate-y-1/2' : 'translate-y-5', `
        absolute top-1/2 left-1/2 -translate-x-1/2 duration-150
      `)}
      >
        {spinner}
      </span>
      <span className={cn(
        'flex items-center gap-2 duration-150',
        loading ? '-translate-y-5' : 'translate-y-0',
        contentClassName,
      )}
      >
        {children}
      </span>
    </span>
  )
}
