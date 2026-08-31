import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { setupPortlessEnvs } from '@tamery/shared/utils/portless-env'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { version } from '../desktop/package.json' with { type: 'json' }
import { prerenderShell } from './vite-plugins/prerender-shell'

setupPortlessEnvs({
  VITE_PUBLIC_API_URL: 'api.local.tamery',
  VITE_PUBLIC_MAIN_URL: 'main.local.tamery',
  VITE_PUBLIC_PROXY_URL: 'proxy.local.tamery',
  VITE_PUBLIC_WEB_URL: 'app.local.tamery',
})

export default defineConfig(({ mode }) => ({
  base: mode === 'desktop' ? './' : '/',
  build: {
    outDir: mode === 'desktop' ? 'dist-desktop' : 'dist',
    rolldownOptions: {
      output: {
        keepNames: true,
      },
    },
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
    'import.meta.env.VITE_TEST': mode === 'test',
  },
  plugins: [
    tailwindcss(),
    tanstackRouter({
      autoCodeSplitting: true,
      codeSplittingOptions: {
        defaultBehavior: [
          ['loader'],
          ['component'],
          ['pendingComponent'],
          ['errorComponent'],
          ['notFoundComponent'],
        ],
      },
      generatedRouteTree: 'src/routeTree.gen.ts',
      routesDirectory: 'src/routes',
    }),
    prerenderShell(),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
}))
