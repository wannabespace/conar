export type IcoSize = 16 | 24 | 32 | 48 | 64 | 128 | 256

export interface Transform {
  /** `round` cuts the corners with a 22% radius, `squircle` with the macOS continuous curve. */
  corners?: 'round' | 'squircle'
  /** Crops the edges and scales the rest up; `1.2` makes the content 20% larger. */
  zoom?: number
}

export type Output = Transform &
  ({ size: number } | { sizes: readonly IcoSize[] })

export interface Files {
  [file: `${string}.ico`]: Transform & {
    sizes: readonly [IcoSize, ...IcoSize[]]
  }
  [file: `${string}.png`]: Transform & { size: number }
}

const web = {
  'apple-touch-icon.png': { size: 180 },
  'favicon-96x96.png': { corners: 'round', size: 96 },
  'favicon.ico': { corners: 'round', sizes: [16, 32, 48] },
  'web-app-manifest-192x192.png': { corners: 'round', size: 192 },
  'web-app-manifest-512x512.png': { corners: 'round', size: 512 },
  'web-app-manifest-maskable-192x192.png': { size: 192, zoom: 1.15 },
  'web-app-manifest-maskable-512x512.png': { size: 512, zoom: 1.15 },
} satisfies Files

const kit = {
  ...web,
  'icon-rounded.png': { corners: 'round', size: 1024 },
  'icon-squircle.png': { corners: 'squircle', size: 1024 },
  'icon.png': { size: 1024 },
} satisfies Files

const images: Record<string, Record<string, Files>> = {
  'brand/cyan.png': {
    'apps/app/public': web,
    'apps/desktop/resources': {
      'icon-1024x1024.png': { corners: 'round', size: 1024 },
    },
    'apps/desktop/resources/macos-icon.icon/Assets': {
      'icon.png': { size: 1024 },
    },
    'apps/docs/public': web,
    'apps/main/public': web,
    'apps/share/public': web,
    'brand/cyan': kit,
  },
  'brand/cyan-inverse.png': {
    'apps/app/public': { 'logo.png': { corners: 'round', size: 512 } },
    'apps/main/public': { 'logo.png': { corners: 'round', size: 512 } },
    'brand/cyan-inverse': kit,
  },
  'brand/dark-cyan.png': { 'brand/dark-cyan': kit },
  'brand/dark-white.png': { 'brand/dark-white': kit },
}

export default { images, zoom: 1.23 }
