import antfu from '@antfu/eslint-config'

export default antfu(
  {
    rules: {
      'node/prefer-global/process': 'off',
      'ts/no-explicit-any': 'error',
      'no-console': 'warn',
    },
    ignores: [
      'app/src-tauri/{target,gen}/**/*',
      'web/drizzle/migrations/meta/*.json',
      '**/*.toml',
    ],
  },
)
