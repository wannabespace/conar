import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import pkg from './package.json'

export default defineConfig({
  main: {
    plugins: [tsconfigPaths()],
    build: {
      rollupOptions: {
        external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
      },
    },
  },
  preload: {
    plugins: [tsconfigPaths(), externalizeDepsPlugin()],
  },
  renderer: {
    plugins: [
      tsconfigPaths(),
      tailwindcss(),
      tanstackRouter({
        routesDirectory: 'src/renderer/src/routes',
        generatedRouteTree: 'src/renderer/src/routeTree.gen.ts',
      }),
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler', { target: '19' }]],
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
  },
})
