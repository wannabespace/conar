import antfu from '@antfu/eslint-config'
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss'

export default antfu(
  {
    react: true,
    rules: {
      'ts/no-explicit-any': 'error',
      'no-console': 'warn',
      'prefer-arrow-callback': 'off',
      'react/no-context-provider': 'off', // Due to context selector
      'react/no-unstable-context-value': 'off', // Due to React Compiler
      'react-hooks/rules-of-hooks': ['error', {
        additionalHooks: '(useMountedEffect|useAsyncEffect)',
      }],
      'react-hooks/exhaustive-deps': ['warn', {
        additionalHooks: '(useMountedEffect|useAsyncEffect)',
      }],
      'react-refresh/only-export-components': 'off',
    },
    ignores: [
      '**/routeTree.gen.ts',
      '**/out/**/*',
      '**/release/**/*',
      '**/.tanstack/**/*',
      '**/.nitro/**/*',
      '**/.output/**/*',
      '**/playwright-report/**/*',
      '**/test-results/**/*',
      '**/.types/**/*',
      '**/migrations/meta/*.json',
      '**/migrations.json',
    ],
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
      'better-tailwindcss/no-unknown-classes': ['error', {
        ignore: ['markdown-content', 'toaster', 'typography', 'typography-disabled'],
      }],
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: './packages/ui/src/styles/globals.css',
      },
    },
  },
)
