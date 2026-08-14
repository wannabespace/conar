import { defineConfig } from 'oxfmt'
import ultracite from 'ultracite/oxfmt'

// @ts-expect-error extension
import { ignorePatterns } from './oxc.ignore.ts'

export default defineConfig({
  ...ultracite,
  ignorePatterns: [...(ultracite.ignorePatterns || []), ...ignorePatterns],
  semi: false,
  singleQuote: true,
})
