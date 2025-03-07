import fs from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ command }) => {
  fs.rmSync('dist-electron', { recursive: true, force: true })

  const isServe = command === 'serve'
  const isBuild = command === 'build'
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG

  return {
    plugins: [
      tsconfigPaths(),
      tailwindcss(),
      TanStackRouterVite(),
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler', { target: '19' }]],
        },
      }),
      electron({
        main: {
          entry: 'electron/main/index.ts',
          vite: {
            plugins: [tsconfigPaths()],
            build: {
              sourcemap,
              minify: isBuild,
              outDir: 'dist-electron/main',
              rollupOptions: {
                external: ['pg'],
              },
            },
          },
        },
        preload: {
          input: 'electron/preload/index.ts',
          vite: {
            build: {
              sourcemap: sourcemap ? 'inline' : undefined,
              minify: isBuild,
              outDir: 'dist-electron/preload',
            },
          },
        },
      }),
    ],
    server: {
      port: 3100,
      strictPort: true,
    },
    clearScreen: false,
  }
})
