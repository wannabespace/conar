import { defineConfig } from 'oxlint'
import core from 'ultracite/oxlint/core'
import react from 'ultracite/oxlint/react'
import tanstack from 'ultracite/oxlint/tanstack'

// @ts-expect-error extension
import { ignorePatterns } from './oxc.ignore.ts'

export default defineConfig({
  extends: [core, react, tanstack],
  ignorePatterns: [...(core.ignorePatterns || []), ...ignorePatterns],
  jsPlugins: ['oxlint-tailwindcss'],
  rules: {
    // Architectural debt from the Ultracite migration: ~470 import cycles and
    'import/no-cycle': 'off',

    // ~21 large barrels need a dedicated debarrel pass before re-enabling.
    'oxc/no-barrel-file': 'off',

    // react-compiler memoizes context values; manual useMemo is redundant here.
    'react/jsx-no-constructed-context-values': 'off',

    'tailwindcss/consistent-variant-order': 'error',
    'tailwindcss/enforce-canonical': 'error',
    'tailwindcss/enforce-consistent-important-position': 'error',
    'tailwindcss/enforce-consistent-line-wrapping': 'off',

    // oxfmt sortTailwindcss is the source of truth; this plugin's order disagrees.
    'tailwindcss/enforce-sort-order': 'off',

    'tailwindcss/no-conflicting-classes': 'error',
    'tailwindcss/no-deprecated-classes': 'error',
    'tailwindcss/no-duplicate-classes': 'error',
    'tailwindcss/no-unknown-classes': [
      'error',
      {
        allowlist: [
          'toaster',
          'typography',
          'typography-disabled',
          'bg-fd-secondary',
          'text-fd-secondary-foreground',
          'text-fd-muted-foreground',
          'fd-scroll-container',
          'placeholder:text-fd-muted-foreground',
          'text-fd-primary',
          'text-fd-error',
          'bg-fd-overlay',
          'animate-fd-fade-in',
          'animate-fd-fade-out',
          'bg-fd-card',
          'text-fd-card-foreground',
          'animate-fd-dialog-in',
          'animate-fd-dialog-out',
          'text-fd-muted-foreground/80',
          'focus-visible:ring-fd-ring',
        ],
      },
    ],
    'tailwindcss/no-unnecessary-arbitrary-value': 'error',
  },
  settings: {
    'react-hooks': { additionalEffectHooks: '(useMountedEffect)' },
    tailwindcss: { entryPoint: 'packages/ui/src/styles/globals.css' },
  },
})
