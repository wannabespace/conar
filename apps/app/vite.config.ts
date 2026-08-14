import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

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
    'import.meta.env.VITE_TEST': mode === 'test',
  },
  plugins: [
    tailwindcss(),
    tanstackRouter({
      autoCodeSplitting: true,
      generatedRouteTree: 'src/routeTree.gen.ts',
      routesDirectory: 'src/routes',
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
