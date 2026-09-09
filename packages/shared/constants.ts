export { PORTS } from './ports'

export const SOCIAL_LINKS = {
  DISCORD: 'https://discord.gg/XweDPUVadR',
  GITHUB: 'https://github.com/wannabespace/tamery',
  TWITTER: 'https://x.com/tamery_app',
} as const

export const RELEASES_URL = 'https://tamery.app/releases' as const

export const MIN_WINDOW_WIDTH = 900
export const MIN_WINDOW_HEIGHT = 600

export const GITHUB_REPO_OWNER = 'wannabespace' as const
export const GITHUB_REPO_NAME = 'tamery' as const

export const SUPPORT_EMAIL = 'valerii.strilets@gmail.com'

export const BREW_INSTALL_COMMAND = 'brew install --cask tamery'

export const AUTH_COOKIE_PREFIX = 'tamery' as const

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

export const SUBSCRIPTION_PAST_DUE_MESSAGE =
  "We couldn't process your recent payment. Please update your payment method to avoid any interruption to your subscription." as const
export const ACTIVE_SUBSCRIPTION_STATUSES = [
  'active',
  'trialing',
  'past_due',
] as const

export const FREE_AI_FILTERS_USAGE_MONTHLY_LIMIT = 50 as const

export const API_KEY_PERMISSIONS = {
  connections: ['read', 'write'] as const,
}
