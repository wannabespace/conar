import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  rules: {
    'node/prefer-global/process': 'off',
    'ts/no-explicit-any': 'error',
    'no-console': 'warn',
    'react-hooks/exhaustive-deps': 'off',
  },
  ignores: [
    '**/web/types/**/*',
    '**/routeTree.gen.ts',
    '**/src-tauri/{target,gen}/**/*',
    '**/src-tauri/capabilities/default.json',
    '**/src-tauri/Cargo.toml',
    '**/migrations/meta/*.json',
  ],
})
