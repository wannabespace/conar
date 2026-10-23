import { defineIconsConfig } from '@tamery/icons'

export default defineIconsConfig({
  importPattern: 'tamery-avatar-{image}-{size}.png',
  images: {
    cyan: {
      file: 'brand/cyan/source.png',
      markSize: 0.6,
      to: {
        'apps/app/public': 'web',
        'apps/desktop/resources/icon-1024x1024.png': {
          shape: 'rounded',
          size: 1024,
        },
        'apps/desktop/resources/macos-icon.icon/Assets/icon.png': {
          shape: 'square',
          size: 1024,
        },
        'apps/docs/public': 'web',
        'apps/main/public': 'web',
        'apps/share/public': 'web',
        'brand/cyan': 'all',
      },
    },
    'cyan-inverse': {
      file: 'brand/cyan-inverse/source.png',
      markSize: 0.6,
      to: {
        'apps/app/public/logo.png': { shape: 'rounded', size: 256 },
        'apps/main/public/logo.png': { shape: 'rounded', size: 256 },
        'brand/cyan-inverse': 'all',
      },
    },
    'dark-cyan': {
      file: 'brand/dark-cyan/source.png',
      markSize: 0.6,
      to: { 'brand/dark-cyan': 'all' },
    },
    'dark-white': {
      file: 'brand/dark-white/source.png',
      markSize: 0.6,
      to: { 'brand/dark-white': 'all' },
    },
  },
})
