import { cn } from '@tamery/ui/lib/utils'

const AspectRatio = ({
  ratio,
  className,
  ...props
}: React.ComponentProps<'div'> & { ratio: number }) => (
  <div
    data-slot="aspect-ratio"
    style={
      {
        '--ratio': ratio,
      } as React.CSSProperties
    }
    className={cn('relative aspect-(--ratio)', className)}
    {...props}
  />
)

export { AspectRatio }
