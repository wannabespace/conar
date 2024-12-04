import type { Config } from 'tailwindcss'
import { tailwindConfig } from 'shared'

export default <Config>{
  ...tailwindConfig,
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../shared/**/*.tsx',
  ],
}
