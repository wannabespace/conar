import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'

const Table = ({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'table'> & {
  size?: 'default' | 'sm'
}) => (
  <div data-slot="table-container" className="relative w-full overflow-x-auto">
    <table
      data-slot="table"
      data-size={size}
      className={cn(
        'group/table w-full caption-bottom text-sm data-[size=sm]:text-xs',
        className
      )}
      {...props}
    />
  </div>
)

const TableHeader = ({
  className,
  ...props
}: React.ComponentProps<'thead'>) => (
  <thead
    data-slot="table-header"
    className={cn('[&_tr]:border-b [&_tr]:hover:bg-transparent', className)}
    {...props}
  />
)

const TableBody = ({ className, ...props }: React.ComponentProps<'tbody'>) => (
  <tbody
    data-slot="table-body"
    className={cn(
      '[&_tr:last-child]:border-0 group-data-[size=sm]/table:[&>tr]:border-b-0',
      className
    )}
    {...props}
  />
)

const TableFooter = ({
  className,
  ...props
}: React.ComponentProps<'tfoot'>) => (
  <tfoot
    data-slot="table-footer"
    className={cn(
      `bg-muted/50 border-t font-medium [&>tr]:last:border-b-0`,
      className
    )}
    {...props}
  />
)

const TableRow = ({ className, ...props }: React.ComponentProps<'tr'>) => (
  <tr
    data-slot="table-row"
    className={cn(
      `even:group-data-[size=sm]/table:bg-foreground/3 hover:bg-accent hover:group-data-[size=sm]/table:bg-accent focus-visible:bg-accent focus-visible:group-data-[size=sm]/table:bg-accent has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted data-highlighted:bg-foreground/7 border-b transition-colors outline-none group-data-[size=sm]/table:transition-none hover:aria-busy:bg-transparent`,
      className
    )}
    {...props}
  />
)

const TableHead = ({ className, ...props }: React.ComponentProps<'th'>) => (
  <th
    data-slot="table-head"
    className={cn(
      `text-muted-foreground h-8 px-2 text-left align-middle text-sm font-medium whitespace-nowrap group-data-[size=sm]/table:h-7 group-data-[size=sm]/table:px-3 group-data-[size=sm]/table:text-xs first:group-data-[size=sm]/table:pl-4 last:group-data-[size=sm]/table:pr-4 has-[[role=checkbox]]:pr-0`,
      className
    )}
    {...props}
  />
)

const TableCell = ({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'td'> & { variant?: 'default' | 'numeric' }) => (
  <td
    data-slot="table-cell"
    className={cn(
      `p-2 align-middle whitespace-nowrap group-data-[size=sm]/table:h-8 group-data-[size=sm]/table:px-3 group-data-[size=sm]/table:py-0 first:group-data-[size=sm]/table:pl-4 last:group-data-[size=sm]/table:pr-4 has-[[role=checkbox]]:pr-0`,
      variant === 'numeric' && 'text-right tabular-nums',
      className
    )}
    {...props}
  />
)

const TableCaption = ({
  className,
  ...props
}: React.ComponentProps<'caption'>) => (
  <caption
    data-slot="table-caption"
    className={cn('text-muted-foreground mt-4 text-sm', className)}
    {...props}
  />
)

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
}
