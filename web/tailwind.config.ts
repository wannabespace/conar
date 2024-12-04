import type { Config } from 'tailwindcss'
import { tailwindTheme } from 'shared'
import animate from 'tailwindcss-animate'

export default <Config>{
  darkMode: ['class'],
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: tailwindTheme,
  plugins: [animate],
}
