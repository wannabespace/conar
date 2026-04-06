import type { ComponentProps } from 'react'
import { cn } from '@conar/ui/lib/utils'

export function DuckDBIcon({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 344.4 344.4"
      className={cn(className)}
      {...props}
    >
      <path
        fill="#000000"
        d="M172.2,339.4L172.2,339.4C79.7,339.4,5,264.7,5,172.2l0,0C5,79.7,79.7,5,172.2,5l0,0c92.5,0,167.2,74.7,167.2,167.2l0,0C339.4,264.7,264.7,339.4,172.2,339.4z"
      />
      <path
        fill="#fff100"
        d="M261.6,147.4h-32.8v49.5h32.8c13.6,0,24.9-11.3,24.9-24.9C286.5,158.3,275.2,147.4,261.6,147.4"
      />
      <path
        fill="#fff100"
        d="M68.1,172.2c0,38.2,31.1,69.3,69.3,69.3s69.3-31.1,69.3-69.3s-31.1-69.3-69.3-69.3S68.1,134,68.1,172.2L68.1,172.2"
      />
    </svg>
  )
}
