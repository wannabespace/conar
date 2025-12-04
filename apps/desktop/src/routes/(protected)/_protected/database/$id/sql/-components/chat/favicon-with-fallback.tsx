import { getHostname } from '@conar/shared/utils/helpers'
import { cn } from '@conar/ui/lib/utils'
import { RiEarthLine } from '@remixicon/react'
import { useState } from 'react'

export function FaviconWithFallback({ url, className }: { url: string, className?: string }) {
  const [isError, setIsError] = useState(false)

  const hostname = getHostname(url)

  if (isError || !hostname) {
    return <RiEarthLine className={cn(className, 'text-muted-foreground')} />
  }

  return (
    <>
      <img
        src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
        alt={hostname}
        className={className}
        onError={() => setIsError(true)}
      />
    </>
  )
}
