import antfu from '@antfu/eslint-config'
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss'

export default antfu(
  {
    react: true,
    rules: {
      'no-unassigned-vars': 'warn',
      'no-useless-assignment': 'warn',
      'preserve-caught-error': 'warn',
      'ts/no-explicit-any': 'error',
      'no-console': 'warn',
      'prefer-arrow-callback': 'off',
      'react/no-context-provider': 'off', // Due to context selector
      'react/no-unstable-context-value': 'off', // Due to React Compiler
      'react-hooks/rules-of-hooks': [
        'error',
        {
          additionalHooks: '(useMountedEffect|useAsyncEffect)',
        },
      ],
      'react-hooks/exhaustive-deps': [
        'warn',
        {
          additionalHooks: '(useMountedEffect|useAsyncEffect)',
        },
      ],
      'pnpm/yaml-enforce-settings': 'off',
    },
    ignores: [
      '**/*.md',
      '**/routeTree.gen.ts',
      '**/release/**/*',
      '**/.tanstack/**/*',
      '**/.nitro/**/*',
      '**/.output/**/*',
      '**/.source/**/*',
      '**/dist-electron/**/*',
      '**/dist-desktop/**/*',
      '**/playwright-report/**/*',
      '**/test-results/**/*',
      '**/.types/**/*',
      '**/migrations/**/*',
      '**/migrations.json',
    ],
  },
  {
    files: ['**/packages/memoize/**/*', '**/apps/docs/**/*'],
    rules: {
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    files: ['apps/desktop/**/*'],
    rules: {
      'node/prefer-global/process': 'off',
    },
  },
  {
    files: ['**/e2e/**/*'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  {
    plugins: {
      'better-tailwindcss': eslintPluginBetterTailwindcss,
    },
    rules: {
      ...eslintPluginBetterTailwindcss.configs['recommended-warn'].rules,
      ...eslintPluginBetterTailwindcss.configs['recommended-error'].rules,
      'better-tailwindcss/enforce-consistent-line-wrapping': 'warn',
      'better-tailwindcss/enforce-consistent-class-order': 'warn',
      'better-tailwindcss/no-unknown-classes': [
        'error',
        {
          ignore: [
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
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: './packages/ui/src/styles/globals.css',
      },
    },
  },
)
