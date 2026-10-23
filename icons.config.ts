import type { IconOutput, IconsConfig } from '@tamery/icons'

const sources = {
  cyan: 'brand/cyan/source.png',
  'dark-cyan': 'brand/dark-cyan/source.png',
  'dark-white': 'brand/dark-white/source.png',
}

const shapes = {
  maskable: { markWidth: 702 },
  rounded: { cornerRadius: 227, markWidth: 754 },
  square: { markWidth: 754 },
}

type Output = IconOutput<keyof typeof sources, keyof typeof shapes>

const webIcons = (folder: string, source: Output['source']): Output[] => [
  {
    file: `${folder}/apple-touch-icon.png`,
    format: { size: 180, type: 'png' },
    shape: 'square',
    source,
  },
  {
    file: `${folder}/favicon-96x96.png`,
    format: { size: 96, type: 'png' },
    shape: 'rounded',
    source,
  },
  {
    file: `${folder}/favicon.ico`,
    format: { sizes: [16, 32, 48], type: 'ico' },
    shape: 'rounded',
    source,
  },
  {
    file: `${folder}/web-app-manifest-192x192.png`,
    format: { size: 192, type: 'png' },
    shape: 'rounded',
    source,
  },
  {
    file: `${folder}/web-app-manifest-512x512.png`,
    format: { size: 512, type: 'png' },
    shape: 'rounded',
    source,
  },
  {
    file: `${folder}/web-app-manifest-maskable-192x192.png`,
    format: { size: 192, type: 'png' },
    shape: 'maskable',
    source,
  },
  {
    file: `${folder}/web-app-manifest-maskable-512x512.png`,
    format: { size: 512, type: 'png' },
    shape: 'maskable',
    source,
  },
]

const brandIcons = (source: Output['source']): Output[] => [
  ...webIcons(`brand/${source}`, source),
  {
    file: `brand/${source}/icon.png`,
    format: { size: 1024, type: 'png' },
    shape: 'square',
    source,
  },
  {
    file: `brand/${source}/icon-rounded.png`,
    format: { size: 1024, type: 'png' },
    shape: 'rounded',
    source,
  },
  {
    file: `brand/${source}/logo.png`,
    format: { size: 512, type: 'png' },
    shape: 'rounded',
    source,
  },
]

export const iconsConfig: IconsConfig<
  keyof typeof sources,
  keyof typeof shapes
> = {
  outputs: [
    ...brandIcons('cyan'),
    ...brandIcons('dark-cyan'),
    ...brandIcons('dark-white'),
    ...webIcons('apps/app/public', 'cyan'),
    ...webIcons('apps/docs/public', 'cyan'),
    ...webIcons('apps/main/public', 'cyan'),
    ...webIcons('apps/share/public', 'cyan'),
    {
      file: 'apps/desktop/resources/icon-1024x1024.png',
      format: { size: 1024, type: 'png' },
      shape: 'rounded',
      source: 'cyan',
    },
    {
      file: 'apps/desktop/resources/macos-icon.icon/Assets/icon.png',
      format: { size: 1024, type: 'png' },
      shape: 'square',
      source: 'cyan',
    },
    {
      file: 'apps/main/public/logo.png',
      format: { size: 512, type: 'png' },
      shape: 'rounded',
      source: 'cyan',
    },
  ],
  shapes,
  sourceMarkWidth: 616,
  sourcePrefix: 'tamery-avatar-',
  sources,
}
