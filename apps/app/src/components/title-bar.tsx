import { getOS } from '@tamery/shared/utils/os'
import { cn } from '@tamery/ui/lib/utils'
import { useMatches } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

const os = getOS(navigator.userAgent)

const isMac = os.type === 'macos'
const isElectron = !!window.electron

function useIsFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    return window.electron?.app.onFullscreenChange(setIsFullscreen)
  }, [])

  return isFullscreen
}

export function TitleBar({ className, children, ...props }: React.ComponentProps<'div'>) {
  const isFullscreen = useIsFullscreen()
  const isAuth = useMatches({
    select: matches => matches.some(match => match.routeId === '/auth'),
  })

  return (
    <div
      className={cn(
        'flex h-10 shrink-0 items-center',
        isElectron && '[-webkit-app-region:drag]',
        isElectron && !isFullscreen && (isMac ? 'pl-22' : 'pr-34'),
        isAuth && '-mb-10',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
