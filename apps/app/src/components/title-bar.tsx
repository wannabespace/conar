import { getOS } from '@tamery/shared/utils/os'
import { cn } from '@tamery/ui/lib/utils'

const os = getOS(navigator.userAgent)

const isMac = os.type === 'macos'

/**
 * Custom window topbar for the Electron build. The native title-bar background
 * is hidden in the main process (`titleBarStyle: 'hidden'`); this strip provides
 * the draggable region and reserves space for the OS-native window controls:
 *  - macOS: native traffic lights, inset on the left (`trafficLightPosition`).
 *  - Windows/Linux: native min/max/close via Window Controls Overlay, on the right.
 */
export function TitleBar({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        // `*` resets app-region to no-drag globally, so opt this strip back into drag.
        'flex h-10 shrink-0 items-center [-webkit-app-region:drag]',
        // Clear the OS-native controls so they never overlap our content.
        isMac ? 'pl-20' : 'pr-34',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
