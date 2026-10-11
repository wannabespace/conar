import { AppleIcon, WindowsNewIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Linux } from '@tamery/ui/components/icons/linux'
import type { ReactNode } from 'react'

import { DOWNLOAD_LINKS } from '~/constants'

export interface DownloadPlatform {
  files: { label: string; link: string }[]
  icon: ReactNode
  os: keyof typeof DOWNLOAD_LINKS
}

export const DOWNLOAD_PLATFORMS: DownloadPlatform[] = [
  {
    files: [
      { label: 'Apple Silicon', link: DOWNLOAD_LINKS.macos.arm64 },
      { label: 'Intel', link: DOWNLOAD_LINKS.macos.intel },
    ],
    icon: <HugeiconsIcon icon={AppleIcon} strokeWidth={2} />,
    os: 'macos',
  },
  {
    files: [{ label: 'Installer (.exe)', link: DOWNLOAD_LINKS.windows.exe }],
    icon: <HugeiconsIcon icon={WindowsNewIcon} strokeWidth={2} />,
    os: 'windows',
  },
  {
    files: [
      { label: 'AppImage', link: DOWNLOAD_LINKS.linux.appImage },
      { label: 'Debian and Ubuntu (.deb)', link: DOWNLOAD_LINKS.linux.deb },
      { label: 'Fedora and RHEL (.rpm)', link: DOWNLOAD_LINKS.linux.rpm },
    ],
    icon: <Linux />,
    os: 'linux',
  },
]
