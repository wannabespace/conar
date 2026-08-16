import { existsSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'tsdown'

import pkg from './package.json' with { type: 'json' }

const envPath = fileURLToPath(new URL('.env', import.meta.url))

if (existsSync(envPath)) {
  process.loadEnvFile(envPath)
}

const env = {
  API_URL: process.env.API_URL,
  MAIN_URL: process.env.MAIN_URL,
  VERSION: pkg.version,
  WEB_URL: process.env.WEB_URL,
}

export default defineConfig(({ watch }) => ({
  clean: !watch,
  define: {
    'import.meta.env': JSON.stringify(env),
  },
  deps: {
    alwaysBundle: [/^@tamery\//u],
  },
  entry: ['./src/index.ts'],
  outExtensions: () => ({ js: '.js' }),
  target: 'node20',
}))
