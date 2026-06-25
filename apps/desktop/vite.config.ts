import type { InlineConfig } from 'vite'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'
import packageJson from './package.json'

const rolldownOptions: NonNullable<NonNullable<InlineConfig['build']>['rolldownOptions']> = {
  output: {
    format: 'es',
    keepNames: true,
  },
  external: [
    ...Object.keys(packageJson.dependencies),
    ...Object.keys(packageJson.devDependencies),
  ].filter(dep => !dep.startsWith('@conar/')),
}

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
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
  build: {
    rolldownOptions,
  },
})
