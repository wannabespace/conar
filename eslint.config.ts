import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  rules: {
    'ts/no-explicit-any': 'error',
    'no-console': 'warn',
    'react-hooks/exhaustive-deps': 'off',
    'prefer-arrow-callback': 'off',
    'react/no-context-provider': 'off', // Due to context selector
  },
  ignores: [
    '**/routeTree.gen.ts',
    '**/out/**/*',
    '**/release/**/*',
    '**/.tanstack/**/*',
    '**/.nitro/**/*',
    '**/.output/**/*',
    '**/.types/**/*',
    '**/migrations/meta/*.json',
    '**/migrations.json',
  ],
})
