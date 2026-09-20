import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { setupPortlessEnvs } from '@tamery/shared/utils/portless-env'
import { inlineHtml } from '@tamery/vite-inline-html'
import { inlineReactHtml } from '@tamery/vite-inline-html/react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { version } from '../desktop/package.json' with { type: 'json' }

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
  optimizeDeps: {
    // Seed panel is a lazy island; without include the first open 504s
    // "Outdated Optimize Dep" and React.lazy swallows Vite's reload
    include: ['@base-ui/react/number-field', '@faker-js/faker/locale/en'],
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
    inlineHtml({
      scripts: [{ entry: 'src/boot.ts', marker: '<!--boot-->' }],
    }),
    inlineReactHtml({
      components: [
        { export: 'Shells', marker: '<!--shell-->', module: '/src/shell.tsx' },
      ],
    }),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
}))
