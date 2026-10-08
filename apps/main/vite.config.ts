import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { setupPortlessEnvs } from '@tamery/shared/portless-env'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { physical, rootRoute } from '@tanstack/virtual-file-routes'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

setupPortlessEnvs({
  VITE_PUBLIC_API_URL: 'api.local.tamery',
  VITE_PUBLIC_WEB_URL: 'app.local.tamery',
})

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart({
      router: {
        virtualRouteConfig: rootRoute('__root.tsx', [
          physical('', '.'),
          physical('', '../modules/ai-usage/routes'),
          physical('', '../modules/api-keys/routes'),
          physical('', '../modules/billing/routes'),
          physical('', '../modules/deep-link/routes'),
          physical('', '../modules/legal/routes'),
          physical('', '../modules/releases/routes'),
          physical('', '../modules/settings/routes'),
        ]),
      },
    }),
    nitro({ preset: 'bun' }),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
})
