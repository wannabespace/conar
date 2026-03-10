// vite.electron.config.ts
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
// configs/vite.base.config.ts
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

import react from '@vitejs/plugin-react'
import { defineConfig as defineConfig2, defineViteConfig, mergeConfig } from 'electron-vite'
import { defineConfig } from 'vite'
import tsconfigPaths, { tsconfigPaths2 } from 'vite-tsconfig-paths'

// ../../packages/shared/src/constants.ts
const PORTS = {
  DEV: {
    API: 3e3,
    WEB: 3001,
    DESKTOP: 3002,
  },
  TEST: {
    API: 4e3,
    WEB: 4001,
    DESKTOP: 4002,
  },
}
// const CONNECTION_TYPES_WITHOUT_SYSTEM_TABLES = ['mssql' /* MSSQL */, 'clickhouse']
const viteBaseConfig = defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackRouter({
      routesDirectory: 'src/routes',
      generatedRouteTree: 'src/routeTree.gen.ts',
    }),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['@electric-sql/pglite'],
  },
  server: {
    strictPort: true,
  },
})

// vite.electron.config.ts
const __electron_vite_injected_import_meta_url = 'file:///Users/rudrasankhasinhamahapatra/Documents/github/conar/apps/desktop/vite.electron.config.ts'
const __dirname = dirname(fileURLToPath(__electron_vite_injected_import_meta_url))
const vite_electron_config_default = defineConfig2({
  main: {
    plugins: [tsconfigPaths2()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/main/index.ts'),
        },
      },
    },
  },
  preload: {
    plugins: [tsconfigPaths2()],
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
export {
  vite_electron_config_default as default,
}
