import tailwindConfig from 'app/tailwind.config'

export default {
  ...tailwindConfig,
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    ...tailwindConfig.content.map(p => p.replace('./', '../app/')),
  ],
}
