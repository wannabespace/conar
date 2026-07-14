import { config } from '@letstri/oxlint-config'
import { tailwindConfig } from '@letstri/oxlint-config/tailwind'

export default config(
  tailwindConfig({
    entryPoint: 'packages/ui/src/styles/globals.css',
  }),
  {
    plugins: ['react', 'jsx-a11y'],
    overrides: [
      {
        files: ['**/e2e/**'],
        rules: {
          'react/rules-of-hooks': 'off',
        },
      },
      {
        files: ['**/src/routes/**'],
        rules: {
          'react/only-export-components': ['error', { allowExportNames: ['Route'] }],
        },
      },
    ],
  },
)
