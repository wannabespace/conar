import { cn } from '@tamery/ui/lib/utils'
import { useEffect, useState } from 'react'

import { isMac } from '~/lib/os'
import { titleBarClassName } from '~/shell'

const isElectron = !!window.electron

const useIsFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => window.electron?.app.onFullscreenChange(setIsFullscreen), [])

  return isFullscreen
}

export const TitleBar = ({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) => {
  const isFullscreen = useIsFullscreen()

  return (
    <div
      className={cn(
        titleBarClassName,
        isElectron && '[-webkit-app-region:drag]',
        className,
        isElectron && !isFullscreen && (isMac ? 'pl-20' : 'pr-34')
      )}
      {...props}
    >
      {children}
    </div>
  )
}
