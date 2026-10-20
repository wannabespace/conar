import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { setupPortlessEnvs } from '@tamery/shared/portless-env'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

setupPortlessEnvs({
  VITE_PUBLIC_API_URL: 'api.local.tamery',
  VITE_PUBLIC_MAIN_URL: 'main.local.tamery',
  VITE_PUBLIC_PROXY_URL: 'proxy.local.tamery',
})

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro({ preset: 'bun' }),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  ssr: {
    // Build externals load a second React through base-ui's CJS require; dev's module runner cannot inline CJS React.
    noExternal: command === 'build' ? true : [],
  },
}))
