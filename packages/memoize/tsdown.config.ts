import { defineConfig } from 'tsdown'

export default defineConfig(({ watch }) => ({
  entry: ['./src/index.ts'],
  dts: true,
  clean: !watch,
}))
