import { PORTS } from '@conar/shared/constants'
import { defineConfig, mergeConfig } from 'vite'
import { viteBaseConfig } from './configs/vite.base.config'

export default mergeConfig(viteBaseConfig, defineConfig({
  define: {
    'import.meta.env.VITE_TEST': 'true',
  },
  preview: {
    port: PORTS.TEST.DESKTOP,
    strictPort: true,
  },
}))
