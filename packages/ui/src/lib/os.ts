import { getOS } from '@tamery/shared/os'

export const isMac = getOS(navigator.userAgent).type === 'macos'
