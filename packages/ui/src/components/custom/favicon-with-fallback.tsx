import { EarthIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { tryCatch } from '@tamery/shared/utils/helpers'
import { cn } from '@tamery/ui/lib/utils'
import { useState } from 'react'

export const FaviconWithFallback = ({
  url,
  className,
}: {
  url: string
  className?: string
}) => {
  const [isError, setIsError] = useState(false)

  const { data: hostname } = tryCatch(() => new URL(url).hostname)

  if (isError || !hostname) {
    return (
      <HugeiconsIcon
        icon={EarthIcon}
        strokeWidth={2}
        className={cn(className, 'text-muted-foreground')}
      />
    )
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
      alt={hostname}
      className={className}
      onError={() => setIsError(true)}
    />
  )
}
