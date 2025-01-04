import type { useThemeConfig } from 'nextra-theme-docs'

export default {
  logo: <span>My Nextra Documentation</span>,
  project: {
    link: 'https://github.com/shuding/nextra',
  },
} satisfies Partial<ReturnType<typeof useThemeConfig>>
