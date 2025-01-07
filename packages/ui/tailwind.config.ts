import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export default {
  content: [
    './index.html',
    '{app,components,src}/**/*.{ts,tsx}',
    '../../packages/ui/src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        primary: '#468C98',
      },
    },
  },
  plugins: [animate],
} satisfies Config
