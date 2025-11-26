import { RiEarthLine } from '@remixicon/react'

export function FaviconWithFallback({ hostname, className = 'size-3 shrink-0' }: { hostname: string | null, className?: string }) {
  if (!hostname) {
    return <RiEarthLine className={`${className} text-muted-foreground`} />
  }

  return (
    <>
      <img
        src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
        alt=""
        className={className}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
          const earthIcon = e.currentTarget.nextElementSibling
          if (earthIcon) {
            (earthIcon as HTMLElement).style.display = 'block'
          }
        }}
      />
      <RiEarthLine className={`${className} text-muted-foreground hidden`} />
    </>
  )
}
