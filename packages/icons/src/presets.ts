import type { Icon, PresetName, Shape, ShapeName } from './types'

export const DEFAULT_SHAPES: Record<ShapeName, Shape> = {
  maskable: { markSize: 0.69 },
  rounded: { corners: 0.22, markSize: 0.74 },
  square: { markSize: 0.74 },
  squircle: { corners: 'squircle', markSize: 0.74 },
}

const web: Record<string, Icon> = {
  'apple-touch-icon.png': { shape: 'square', size: 180 },
  'favicon-96x96.png': { shape: 'rounded', size: 96 },
  'favicon.ico': { shape: 'rounded', sizes: [16, 32, 48] },
  'web-app-manifest-192x192.png': { shape: 'rounded', size: 192 },
  'web-app-manifest-512x512.png': { shape: 'rounded', size: 512 },
  'web-app-manifest-maskable-192x192.png': { shape: 'maskable', size: 192 },
  'web-app-manifest-maskable-512x512.png': { shape: 'maskable', size: 512 },
}

export const PRESETS: Record<PresetName, Record<string, Icon>> = {
  all: {
    ...web,
    'icon-rounded.png': { shape: 'rounded', size: 1024 },
    'icon-squircle.png': { shape: 'squircle', size: 1024 },
    'icon.png': { shape: 'square', size: 1024 },
    'logo.png': { shape: 'rounded', size: 512 },
  },
  web,
}
