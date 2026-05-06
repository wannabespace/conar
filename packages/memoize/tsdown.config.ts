import { defineConfig } from 'tsdown'

export default defineConfig(({ watch }) => ({
  entry: ['./src/index.ts'],
  dts: {
    eager: true,
  },
  clean: !watch,
  deps: {
    // eslint-disable-next-line e18e/prefer-static-regex
    alwaysBundle: [/^@conar\//],
  },
}))
