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
      'app/src-tauri/{target,gen}/**/*',
      'app/src-tauri/capabilities/default.json',
      'app/src/routeTree.gen.ts',
      'web/drizzle/migrations/meta/*.json',
      '**/*.toml',
    ],
  },
  ...tailwind.configs['flat/recommended'],
  ...pluginRouter.configs['flat/recommended'],
)
