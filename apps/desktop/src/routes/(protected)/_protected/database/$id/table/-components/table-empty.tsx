import { cn } from '@conar/ui/lib/utils'
import { RiMoreLine } from '@remixicon/react'

export function TableEmpty({ className, title, description }: { className?: string, title: string, description: string }) {
  return (
    <div className={cn(`
      pointer-events-none sticky left-0 flex items-center justify-center
    `, className)}
    >
      <div className="flex h-32 w-full flex-col items-center justify-center">
        <div className={`
          mb-4 flex items-center justify-center rounded-full bg-muted/60 p-3
        `}
        >
          <RiMoreLine className="size-6 text-muted-foreground" />
        </div>
        <span className="font-medium text-muted-foreground">{title}</span>
        <span className="text-xs text-muted-foreground/70">{description}</span>
      </div>
    </div>
  )
}
