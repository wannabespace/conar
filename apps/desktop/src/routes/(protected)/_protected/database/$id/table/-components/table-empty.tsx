import { cn } from '@conar/ui/lib/utils'
import { RiMoreLine } from '@remixicon/react'

export function TableEmpty({ className, title, description }: { className?: string, title: string, description: string }) {
  return (
    <div className={cn('sticky left-0 pointer-events-none flex items-center justify-center', className)}>
      <div className="flex flex-col items-center justify-center w-full h-32">
        <div className="flex items-center justify-center rounded-full bg-muted/60 p-3 mb-4">
          <RiMoreLine className="size-6 text-muted-foreground" />
        </div>
        <span className="text-muted-foreground font-medium">{title}</span>
        <span className="text-xs text-muted-foreground/70">{description}</span>
      </div>
    </div>
  )
}
