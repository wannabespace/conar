import { existsSync, readdirSync } from 'node:fs'

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

// Read once at startup: restart dev after adding or deleting a module that owns routes.
const modulesDir = new URL('src/modules/', import.meta.url)
const moduleRoutes = (existsSync(modulesDir) ? readdirSync(modulesDir) : [])
  .filter((name) => existsSync(new URL(`${name}/routes`, modulesDir)))
  .map((name) => physical('', `../modules/${name}/routes`))

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart({
      router: {
        virtualRouteConfig: rootRoute('__root.tsx', [
          physical('', '.'),
          ...moduleRoutes,
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
