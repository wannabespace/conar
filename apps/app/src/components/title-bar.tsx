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

/**
 * Custom window topbar. Always rendered as the app's top strip; in the Electron
 * build it also doubles as the draggable window region and reserves space for the
 * OS-native window controls (the "traffic lights"):
 *  - macOS: native traffic lights, inset on the left (`trafficLightPosition`).
 *  - Windows/Linux: native min/max/close via Window Controls Overlay, on the right.
 *
 * Outside Electron (web app) there are no native controls, so the drag region and
 * the control insets are omitted.
 */
export function TitleBar({ className, children, ...props }: React.ComponentProps<'div'>) {
  const isFullscreen = useIsFullscreen()

  return (
    <div
      className={cn(
        'flex h-10 shrink-0 items-center',
        // `*` resets app-region to no-drag globally, so opt this strip back into drag.
        isElectron && '[-webkit-app-region:drag]',
        // Clear the OS-native controls so they never overlap our content.
        // Fullscreen hides the traffic lights / window-controls overlay, so the
        // inset would otherwise leave an empty gap.
        isElectron && !isFullscreen && (isMac ? 'pl-20' : 'pr-34'),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
