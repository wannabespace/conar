import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { PORTS } from '../../packages/shared/constants'

export default defineConfig(({ mode }) => ({
  resolve: {
    tsconfigPaths: true,
  },
  base: mode === 'desktop' ? './' : '/',
  define: {
    'import.meta.env.VITE_TEST': mode === 'test',
  },
  build: {
    outDir: mode === 'desktop' ? 'dist-desktop' : 'dist',
  },
  plugins: [
    tailwindcss(),
    tanstackRouter({
      routesDirectory: 'src/routes',
      generatedRouteTree: 'src/routeTree.gen.ts',
    }),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
  optimizeDeps: {
    exclude: ['@electric-sql/pglite'],
  },
  server: {
    strictPort: true,
    port: mode === 'test' ? PORTS.TEST.DESKTOP : PORTS.DEV.APP,
  },
}))
