import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export default {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        primary: '#7942F1',
        background: {
          primary: 'var(--primary-bg)',
          secondary: 'var(--secondary-bg)',
        },
      },
    },
  },
  plugins: [animate],
} satisfies Config
