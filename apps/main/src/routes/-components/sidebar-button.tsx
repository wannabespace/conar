import { Button } from '@tamery/ui/components/button'
import { cn } from '@tamery/ui/lib/utils'

export const SidebarButton = ({
  active = false,
  className,
  ...props
}: {
  active?: boolean
} & React.ComponentProps<typeof Button>) => (
  <Button
    variant="ghost"
    className={cn(`w-full justify-start`, active && `bg-accent/50`, className)}
    {...props}
  />
)
