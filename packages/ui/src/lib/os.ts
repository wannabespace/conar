import { getOS } from '@tamery/shared/os'

const os = getOS(navigator.userAgent).type

export const isMac = os === 'macos'
export const isLinux = os === 'linux'
