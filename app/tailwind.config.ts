import type { Config } from 'tailwindcss'
import { tailwindTheme } from 'shared'
import animate from 'tailwindcss-animate'

export default <Config>{
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: tailwindTheme,
  plugins: [animate],
}
