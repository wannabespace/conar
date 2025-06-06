import type { ComponentProps } from 'react'
import { cn } from '@conar/ui/lib/utils'

export function DotsBg({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('relative', className)} {...props}>
      <div className="absolute inset-0 bg-radial-[2px_2px] from-gray-400 dark:from-gray-600 to-transparent bg-size-[20px_20px]"></div>
    </div>
  )
}
