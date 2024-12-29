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
      '**/routeTree.gen.ts',
      '**/src-tauri/{target,gen}/**/*',
      '**/src-tauri/capabilities/default.json',
      '**/src-tauri/Cargo.toml',
      '**/migrations/meta/*.json',
    ],
  },
  ...tailwind.configs['flat/recommended'],
)
