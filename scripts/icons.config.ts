export const iconsConfig = {
  appFiles: {
    'apps/desktop/resources/icon-1024x1024.png': 'icon-rounded.png',
    'apps/desktop/resources/macos-icon.icon/Assets/icon.png': 'icon.png',
    'apps/main/public/logo.png': 'logo.png',
  },
  appVariant: 'cyan',
  appWebFolders: [
    'apps/app/public',
    'apps/docs/public',
    'apps/main/public',
    'apps/share/public',
  ],
  brandFolder: 'brand',
  markWidth: { icon: 754, maskable: 702, source: 616 },
  sourcePrefix: 'tamery-avatar-',
  variants: ['cyan', 'dark-cyan', 'dark-white'],
} as const
