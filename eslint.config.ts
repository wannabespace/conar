import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  rules: {
    'node/prefer-global/process': 'off',
    'ts/no-explicit-any': 'error',
    'no-console': 'warn',
    'react-hooks/exhaustive-deps': 'off',
    'prefer-arrow-callback': 'off',
    'style/indent': 'off', // temporary due to bug
    'react/no-context-provider': 'off', // Due to context selector
  },
  ignores: [
    '**/routeTree.gen.ts',
    '**/dist-electron/**/*',
    '**/release/**/*',
    '**/.tanstack/**/*',
    '**/.nitro/**/*',
    '**/.output/**/*',
    '**/.types/**/*',
    '**/migrations/meta/*.json',
    '**/migrations.json',
  ],
})
