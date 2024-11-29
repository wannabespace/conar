import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-nunito-sans)', 'sans-serif'],
        moderno: ['var(--font-museo-moderno)', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
