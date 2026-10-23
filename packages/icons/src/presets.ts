import type { IconFile, PresetName, Shape, ShapeName } from './types'

export const DEFAULT_SHAPES: Record<ShapeName, Shape> = {
  maskable: { markSize: 0.69 },
  rounded: { corners: 0.22, markSize: 0.74 },
  square: { markSize: 0.74 },
  squircle: { corners: 'squircle', markSize: 0.74 },
}

const web = <Source extends string>(
  source: Source
): Record<string, IconFile<Source>> => ({
  'apple-touch-icon.png': { shape: 'square', size: 180, source },
  'favicon-96x96.png': { shape: 'rounded', size: 96, source },
  'favicon.ico': { shape: 'rounded', sizes: [16, 32, 48], source },
  'web-app-manifest-192x192.png': { shape: 'rounded', size: 192, source },
  'web-app-manifest-512x512.png': { shape: 'rounded', size: 512, source },
  'web-app-manifest-maskable-192x192.png': {
    shape: 'maskable',
    size: 192,
    source,
  },
  'web-app-manifest-maskable-512x512.png': {
    shape: 'maskable',
    size: 512,
    source,
  },
})

export const PRESETS: Record<
  PresetName,
  <Source extends string>(source: Source) => Record<string, IconFile<Source>>
> = {
  brand: (source) => ({
    ...web(source),
    'icon-rounded.png': { shape: 'rounded', size: 1024, source },
    'icon-squircle.png': { shape: 'squircle', size: 1024, source },
    'icon.png': { shape: 'square', size: 1024, source },
    'logo.png': { shape: 'rounded', size: 512, source },
  }),
  web,
}
