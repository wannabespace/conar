import { defineConfig } from '@tamery/resize'

const web = {
  'apple-touch-icon.png': { size: 180 },
  'favicon-96x96.png': { corners: 'round', size: 96 },
  'favicon.ico': { corners: 'round', sizes: [16, 32, 48] },
  'web-app-manifest-192x192.png': { corners: 'round', size: 192 },
  'web-app-manifest-512x512.png': { corners: 'round', size: 512 },
  'web-app-manifest-maskable-192x192.png': { size: 192, zoom: 1.15 },
  'web-app-manifest-maskable-512x512.png': { size: 512, zoom: 1.15 },
} as const

const kit = {
  ...web,
  'icon-rounded.png': { corners: 'round', size: 1024 },
  'icon-squircle.png': { corners: 'squircle', size: 1024 },
  'icon.png': { size: 1024 },
} as const

export default defineConfig({
  border: 'rgba(10, 26, 64, 0.1)',
  zoom: 1.23,
  images: {
    'brand/cyan.png': {
      'apps/app/public': web,
      'apps/desktop/resources/icon-1024x1024.png': {
        corners: 'round',
        size: 1024,
      },
      'apps/desktop/resources/macos-icon.icon/Assets/icon.png': { size: 1024 },
      'apps/docs/public': web,
      'apps/main/public': web,
      'apps/share/public': web,
      'brand/cyan': kit,
    },
    'brand/cyan-inverse.png': {
      'apps/app/public/logo.png': { corners: 'round', size: 256 },
      'apps/main/public/logo.png': { corners: 'round', size: 256 },
      'brand/cyan-inverse': kit,
    },
    'brand/dark-cyan.png': { 'brand/dark-cyan': kit },
    'brand/dark-white.png': { 'brand/dark-white': kit },
  },
})
