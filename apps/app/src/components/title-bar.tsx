import { getOS } from '@tamery/shared/utils/os'
import { cn } from '@tamery/ui/lib/utils'
import { useEffect, useState } from 'react'

const os = getOS(navigator.userAgent)

const isMac = os.type === 'macos'
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
        // oxlint-disable-next-line tailwindcss/enforce-canonical
        'flex h-[calc(40px+1px)] shrink-0 items-center border-b border-transparent',
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
