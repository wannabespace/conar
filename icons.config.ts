import { defineIconsConfig } from '@tamery/icons'

export default defineIconsConfig({
  sources: {
    cyan: 'brand/cyan/source.png',
    'cyan-inverse': 'brand/cyan-inverse/source.png',
    'dark-cyan': 'brand/dark-cyan/source.png',
    'dark-white': 'brand/dark-white/source.png',
  },
  sourceMarkSize: 0.6,
  importPrefix: 'tamery-avatar-',
  sets: {
    'apps/app/public': { preset: 'web', source: 'cyan' },
    'apps/docs/public': { preset: 'web', source: 'cyan' },
    'apps/main/public': { preset: 'web', source: 'cyan' },
    'apps/share/public': { preset: 'web', source: 'cyan' },
    'brand/cyan': { preset: 'brand', source: 'cyan' },
    'brand/cyan-inverse': { preset: 'brand', source: 'cyan-inverse' },
    'brand/dark-cyan': { preset: 'brand', source: 'dark-cyan' },
    'brand/dark-white': { preset: 'brand', source: 'dark-white' },
  },
  files: {
    'apps/app/public/logo.png': {
      shape: 'rounded',
      size: 256,
      source: 'cyan-inverse',
    },
    'apps/desktop/resources/icon-1024x1024.png': {
      shape: 'rounded',
      size: 1024,
      source: 'cyan',
    },
    'apps/desktop/resources/macos-icon.icon/Assets/icon.png': {
      shape: 'square',
      size: 1024,
      source: 'cyan',
    },
    'apps/main/public/logo.png': {
      shape: 'rounded',
      size: 256,
      source: 'cyan-inverse',
    },
  },
})
