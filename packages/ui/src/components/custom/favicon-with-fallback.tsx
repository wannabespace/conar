import { RiEarthLine } from '@remixicon/react'
import { tryCatch } from '@tamery/shared/utils/helpers'
import { cn } from '@tamery/ui/lib/utils'
import { useState } from 'react'

export function FaviconWithFallback({ url, className }: { url: string, className?: string }) {
  const [isError, setIsError] = useState(false)

  const { data: hostname } = tryCatch(() => new URL(url).hostname)

  if (isError || !hostname) {
    return <RiEarthLine className={cn(className, 'text-muted-foreground')} />
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
