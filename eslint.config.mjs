import antfu from '@antfu/eslint-config'
import tailwind from 'eslint-plugin-tailwindcss'

export default antfu(
  {
    rules: {
      'node/prefer-global/process': 'off',
      'ts/no-explicit-any': 'error',
      'no-console': 'warn',
    },
    ignores: [
      'desktop/src-tauri/{target,gen}/**/*',
      'desktop/src-tauri/capabilities/default.json',
      'desktop/src/routeTree.gen.ts',
      'web/drizzle/migrations/meta/*.json',
      '**/*.toml',
    ],
  },
  ...tailwind.configs['flat/recommended'],
)
