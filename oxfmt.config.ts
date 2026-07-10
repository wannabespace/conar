import { defineConfig } from 'oxfmt'

export default defineConfig({
  singleQuote: true,
  semi: false,
  arrowParens: 'avoid',
  sortImports: true,
  sortTailwindcss: {
    stylesheet: './packages/ui/src/styles/globals.css',
    functions: ['cn', 'cva'],
  },
  ignorePatterns: ['**/routeTree.gen.ts', '**/*.gen.ts', '**/migrations/**'],
})
