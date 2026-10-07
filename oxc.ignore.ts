export const ignorePatterns = [
  '.agents/**',
  '.claude/**',
  '.github/**',
  '**/migrations/**',
  '**/routeTree.gen.ts',
  // The presets skip every `codegen` dir as generated output; ours is source.
  '!**/codegen',
]
