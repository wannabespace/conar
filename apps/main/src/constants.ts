import type { OS } from '@tamery/shared/utils/os'

export const DOWNLOAD_LINKS = {
  linux: {
    appImage: 'https://download.tamery.app/linux/appImage/x64',
    deb: 'https://download.tamery.app/linux/deb/x64',
    rpm: 'https://download.tamery.app/linux/rpm/x64',
  },
  macos: {
    arm64: 'https://download.tamery.app/mac/dmg/arm64',
    intel: 'https://download.tamery.app/mac/dmg/x64',
  },
  windows: {
    exe: 'https://download.tamery.app/windows/nsis/x64',
  },
} satisfies Partial<Record<OS, Record<string, string>>>

export const SEO = {
  description:
    'Tamery is an AI-powered database client for Postgres, MySQL, MSSQL, and ClickHouse. Write queries, explore data, and manage your databases with AI doing the heavy lifting.',
  title: 'AI database client for Postgres, MySQL, MSSQL & ClickHouse',
}

export const NAVBAR_HEIGHT_BASE = 150
export const NAVBAR_HEIGHT_SCROLLED = 60
