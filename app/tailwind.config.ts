import type { Config } from 'tailwindcss'
import { tailwindConfig } from 'shared'

export default <Config>{
  ...tailwindConfig,
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../shared/**/*.tsx',
  ],
}
