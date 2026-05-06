import { existsSync, readFileSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version: string }

const envPath = fileURLToPath(new URL('./.env', import.meta.url))

if (existsSync(envPath)) {
  process.loadEnvFile(envPath)
}

export default defineConfig(({ watch }) => ({
  entry: ['./src/index.ts'],
  target: 'node20',
  clean: !watch,
  outExtensions: () => ({ js: '.js' }),
  deps: {
    // eslint-disable-next-line e18e/prefer-static-regex
    alwaysBundle: [/^@conar\//],
  },
  env: {
    API_URL: process.env.API_URL,
    MAIN_URL: process.env.MAIN_URL,
    VERSION: JSON.stringify(pkg.version),
  },
}))
