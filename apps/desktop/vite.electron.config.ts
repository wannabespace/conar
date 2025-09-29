import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, defineViteConfig, externalizeDepsPlugin, mergeConfig } from 'electron-vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { PORTS } from '../../packages/shared/src/constants'
import { viteBaseConfig } from './configs/vite.base.config'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  main: {
    plugins: [tsconfigPaths(), externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/main/index.ts'),
        },
      },
    },
  },
  preload: {
    plugins: [tsconfigPaths(), externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/preload/index.ts'),
        },
      },
    },
  },
  renderer: mergeConfig(viteBaseConfig, defineViteConfig({
    server: {
      port: PORTS.DEV.DESKTOP,
    },
    root: '.',
    build: {
      // sourcemap: true,
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html'),
        },
      },
    },
  })),
})
