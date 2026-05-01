import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import { PORTS } from '../../packages/shared/constants'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro({
      preset: 'bun',
      devProxy: {
        '/web': `http://localhost:${PORTS.DEV.APP}`,
      },
    }),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
  server: {
    port: PORTS.DEV.WEB,
    strictPort: true,
  },
})
