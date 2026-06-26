import type { OS } from '@tamery/shared/utils/os'

export const DOWNLOAD_LINKS = {
  macos: {
    arm64: 'https://download.tamery.app/mac/dmg/arm64',
    intel: 'https://download.tamery.app/mac/dmg/x64',
  },
  linux: {
    deb: 'https://download.tamery.app/linux/deb/x64',
    appImage: 'https://download.tamery.app/linux/appImage/x64',
    rpm: 'https://download.tamery.app/linux/rpm/x64',
  },
  windows: {
    exe: 'https://download.tamery.app/windows/nsis/x64',
  },
} satisfies Partial<Record<OS, Record<string, string>>>

export const SEO = {
  title: 'AI database client for Postgres, MySQL, MSSQL & ClickHouse',
  description: 'Tamery is an AI-powered database client for Postgres, MySQL, MSSQL, and ClickHouse. Write queries, explore data, and manage your databases with AI doing the heavy lifting.',
}

export const NAVBAR_HEIGHT_BASE = 150
export const NAVBAR_HEIGHT_SCROLLED = 60
