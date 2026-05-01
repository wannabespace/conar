import { Button } from '@conar/ui/components/button'
import { cn } from '@conar/ui/lib/utils'

export function SidebarButton({
  active = false,
  className,
  ...props
}: {
  active?: boolean
} & React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      className={cn(
        `w-full justify-start`,
        active && `bg-accent/50`,
        className,
      )}
      {...props}
    />
  )
}
