import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

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
}))
