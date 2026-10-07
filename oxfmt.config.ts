import { defineConfig } from 'oxfmt'
import ultracite from 'ultracite/oxfmt'

// @ts-expect-error extension
import { ignorePatterns } from './oxc.ignore.ts'

export default defineConfig({
  ...ultracite,
  ignorePatterns: [
    // The preset skips every `codegen` dir as generated output; ours is source.
    ...(ultracite.ignorePatterns || []).filter((p) => p !== '**/codegen'),
    ...ignorePatterns,
  ],
  semi: false,
  singleQuote: true,
})
