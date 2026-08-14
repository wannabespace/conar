import { existsSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'tsdown'

import pkg from './package.json' with { type: 'json' }

const envPath = fileURLToPath(new URL('.env', import.meta.url))

if (existsSync(envPath)) {
  process.loadEnvFile(envPath)
}

export default defineConfig(({ watch }) => ({
  clean: !watch,
  deps: {
    alwaysBundle: [/^@tamery\//u],
  },
  entry: ['./src/index.ts'],
  env: {
    API_URL: process.env.API_URL,
    MAIN_URL: process.env.MAIN_URL,
    VERSION: pkg.version,
  },
  outExtensions: () => ({ js: '.js' }),
  target: 'node20',
}))
