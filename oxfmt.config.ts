import { defineConfig } from 'oxfmt'

export default defineConfig({
  singleQuote: true,
  semi: false,
  arrowParens: 'always',
  quoteProps: 'consistent',
  ignorePatterns: ['**/routeTree.gen.ts', '**/*.gen.ts', '**/migrations/**'],
})
