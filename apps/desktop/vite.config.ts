import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'
import packageJson from './package.json'

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
            rolldownOptions: {
              external: Object.keys(packageJson.dependencies),
            },
          },
        },
      },
      preload: {
        input: 'src/preload/preload.ts',
        vite: {
          build: {
            rolldownOptions: {
              output: { format: 'es' },
              external: Object.keys(packageJson.dependencies),
            },
          },
        },
      },
    }),
  ],
  build: {
    minify: false,
    rolldownOptions: {
      external: Object.keys(packageJson.dependencies),
    },
  },
})
