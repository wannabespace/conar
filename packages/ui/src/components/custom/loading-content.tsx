import { cn } from '@tamery/ui/lib/utils'
import { useEffect, useRef, useState } from 'react'

import { Spinner } from '../spinner'

const defaultSpinner = <Spinner />

const MIN_LOADING_MS = 200

const useMinLoading = (loading: boolean) => {
  const [shown, setShown] = useState(loading)
  const startedAt = useRef(0)

  if (loading && !shown) {
    setShown(true)
  }

  useEffect(() => {
    if (loading) {
      startedAt.current = Date.now()
      return
    }

    const timeout = setTimeout(
      () => setShown(false),
      startedAt.current + MIN_LOADING_MS - Date.now()
    )

    return () => clearTimeout(timeout)
  }, [loading])

  return loading || shown
}

export const LoadingContent = ({
  children,
  className,
  loading: loadingProp,
  spinner = defaultSpinner,
  contentClassName,
}: {
  children: React.ReactNode
  className?: string
  loading: boolean
  spinner?: React.ReactNode
  contentClassName?: string
}) => {
  const loading = useMinLoading(loadingProp)

  return (
    <span
      className={cn(
        'relative flex items-center justify-center gap-2 overflow-hidden duration-150',
        className
      )}
    >
      <span
        aria-hidden={!loading}
        className={cn(
          loading ? '-translate-y-1/2' : 'translate-y-5',
          'absolute top-1/2 left-1/2 flex -translate-x-1/2 items-center justify-center duration-150'
        )}
      >
        {spinner}
      </span>
      <span
        aria-hidden={loading}
        className={cn(
          'flex items-center gap-2 duration-150',
          loading ? '-translate-y-5' : 'translate-y-0',
          contentClassName
        )}
      >
        {children}
      </span>
    </span>
  )
}
