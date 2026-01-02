export const SOCIAL_LINKS = {
  GITHUB: 'https://github.com/wannabespace/conar',
  TWITTER: 'https://x.com/conar_app',
  DISCORD: 'https://discord.gg/XweDPUVadR',
} as const

export const ACCOUNT_LINK = 'https://conar.app/account'

export const SUPPORT_EMAIL = 'valerii.strilets@gmail.com'

export const BREW_INSTALL_COMMAND = 'brew install --cask conar'

export const PORTS = {
  DEV: {
    API: 3000,
    WEB: 3001,
    DESKTOP: 3002,
  },
  TEST: {
    API: 4000,
    WEB: 4001,
    DESKTOP: 4002,
  },
} as const

export const LABEL_OPTIONS = ['Local', 'Test', 'Dev', 'Staging', 'Prod']

export const COLOR_OPTIONS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#16a34a',
  '#06b6d4',
  '#2563eb',
  '#9333ea',
  '#db2777',
]

export const LATEST_VERSION_BEFORE_SUBSCRIPTION = 26 as const
