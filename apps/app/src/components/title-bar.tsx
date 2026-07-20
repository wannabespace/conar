import { getOS } from '@tamery/shared/utils/os'
import { cn } from '@tamery/ui/lib/utils'
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

  return (
    <div
      className={cn(
        `
          flex h-[calc(--spacing(10)+1px)] shrink-0 items-center border-b
          border-transparent
        `,
        isElectron && '[-webkit-app-region:drag]',
        className,
        // After the consumer className so its px-* can't merge these away —
        // this padding reserves the traffic lights / window controls area
        isElectron && !isFullscreen && (isMac ? 'pl-20' : 'pr-34'),
      )}
      {...props}
    >
      {children}
    </div>
  )
}
