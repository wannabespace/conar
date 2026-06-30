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
      'react/rules-of-hooks': [
        'error',
        {
          additionalHooks: '(useMountedEffect)',
        },
      ],
      'react/exhaustive-deps': [
        'warn',
        {
          additionalHooks: '(useMountedEffect)',
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
    files: ['apps/desktop/**/*'],
    rules: {
      'node/prefer-global/process': 'off',
    },
  },
  {
    files: ['**/e2e/**/*'],
    rules: {
      'react/rules-of-hooks': 'off',
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
            'cn-input-otp',
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
