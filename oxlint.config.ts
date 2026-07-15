import { oxlintConfig, tailwindPlugin } from '@letstri/oxc-config'

export default oxlintConfig(
  {
    plugins: ['react', 'jsx-a11y'],
  },
  tailwindPlugin({
    entryPoint: 'packages/ui/src/styles/globals.css',
    ignoreClasses: [
      'toaster',
      'typography',
      'typography-disabled',
      'bg-fd-secondary',
      'text-fd-secondary-foreground',
      'text-fd-muted-foreground',
      'fd-scroll-container',
      'placeholder:text-fd-muted-foreground',
      'text-fd-primary',
      'text-fd-error',
      'bg-fd-overlay',
      'animate-fd-fade-in',
      'animate-fd-fade-out',
      'bg-fd-card',
      'text-fd-card-foreground',
      'animate-fd-dialog-in',
      'animate-fd-dialog-out',
      'text-fd-muted-foreground/80',
      'focus-visible:ring-fd-ring',
    ],
  }),
)
