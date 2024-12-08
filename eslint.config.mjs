import antfu from '@antfu/eslint-config'
import pluginRouter from '@tanstack/eslint-plugin-router'
import reactCompiler from 'eslint-plugin-react-compiler'
import tailwind from 'eslint-plugin-tailwindcss'

export default antfu(
  {
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      'node/prefer-global/process': 'off',
      'ts/no-explicit-any': 'error',
      'no-console': 'warn',
      'react-compiler/react-compiler': 'error',
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
  ...pluginRouter.configs['flat/recommended'],
)
