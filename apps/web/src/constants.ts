import type { OS } from '@conar/shared/utils/os'

export const DOWNLOAD_LINKS = {
  macos: {
    arm64: 'https://download.conar.app/mac/dmg/arm64',
    intel: 'https://download.conar.app/mac/dmg/x64',
  },
  linux: {
    deb: 'https://download.conar.app/linux/deb/x64',
    appImage: 'https://download.conar.app/linux/appImage/x64',
    rpm: 'https://download.conar.app/linux/rpm/x64',
  },
  windows: {
    exe: 'https://download.conar.app/windows/nsis/x64',
  },
} satisfies Partial<Record<OS, Record<string, string>>>

export const NAVBAR_HEIGHT_BASE = 150
export const NAVBAR_HEIGHT_SCROLLED = 60
