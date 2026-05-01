import { PORTS } from '@conar/shared/constants'
import { defineConfig, mergeConfig } from 'vite'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  define: {
    'import.meta.env.VITE_TEST': 'true',
  },
  preview: {
    port: PORTS.TEST.DESKTOP,
    strictPort: true,
  },
}))
