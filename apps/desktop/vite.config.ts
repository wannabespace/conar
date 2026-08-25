import type { InlineConfig } from 'vite'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'

import packageJson from './package.json' with { type: 'json' }

const rolldownOptions: NonNullable<
  NonNullable<InlineConfig['build']>['rolldownOptions']
> = {
  external: [
    ...Object.keys(packageJson.dependencies),
    ...Object.keys(packageJson.devDependencies),
  ].filter((dep) => !dep.startsWith('@tamery/')),
  output: {
    format: 'es',
    keepNames: true,
  },
}

export default defineConfig({
  build: {
    rolldownOptions,
  },
  plugins: [
    electron({
      main: {
        entry: 'src/main/main.ts',
        vite: {
          build: {
            minify: false,
            rolldownOptions,
          },
        },
      },
      preload: {
        input: 'src/preload/preload.ts',
        vite: {
          build: {
            minify: false,
            rolldownOptions,
          },
        },
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
})
