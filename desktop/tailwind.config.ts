import type { Config } from 'tailwindcss'
import tailwindConfig from 'shared/tailwind.config'

export default <Config>{
  ...tailwindConfig,
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../shared/{components,ui}/**/*.{ts,tsx}',
  ],
}
