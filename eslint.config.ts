import antfu from '@antfu/eslint-config'

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
)
