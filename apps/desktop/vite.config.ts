import fs from 'node:fs/promises'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'
import tsconfigPaths from 'vite-tsconfig-paths'
import pkg from './package.json'

export default defineConfig(async () => {
  await fs.rm('dist-electron', { recursive: true, force: true })

  return {
    plugins: [
      tsconfigPaths(),
      tailwindcss(),
      tanstackRouter(),
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler', { target: '19' }]],
        },
      }),
      electron({
        main: {
          entry: 'electron/main/index.ts',
          vite: {
            build: {
              outDir: 'dist-electron/main',
              rollupOptions: {
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
              },
            },
          },
        },
        preload: {
          input: 'electron/preload/index.ts',
          vite: {
            build: {
              outDir: 'dist-electron/preload',
              rollupOptions: {
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
              },
            },
          },
        },
      }),
    ],
    build: {
      sourcemap: true,
    },
    optimizeDeps: {
      exclude: ['@electric-sql/pglite'],
    },
    server: {
      port: 3002,
      strictPort: true,
    },
    clearScreen: false,
  }
})
