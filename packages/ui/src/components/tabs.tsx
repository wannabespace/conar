import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import { cn } from '@tamery/ui/lib/utils'
import type { VariantProps } from 'class-variance-authority'

import { tabsListVariants } from './tabs.utils'

function Tabs({ className, orientation = 'horizontal', ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        `
          group/tabs flex gap-2
          data-horizontal:flex-col
        `,
        className,
      )}
      {...props}
    />
  )
}

function TabsList({
  className,
  variant = 'default',
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        `
          relative inline-flex h-[calc(100%-1px)] flex-1 items-center
          justify-center gap-1.5 rounded-2xl border border-transparent! px-1.5
          py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60
          transition-all
          group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start
          group-data-vertical/tabs:px-3 group-data-vertical/tabs:py-0.5
          hover:text-foreground
          focus-visible:border-ring focus-visible:ring-[3px]
          focus-visible:ring-ring/50 focus-visible:outline-1
          focus-visible:outline-ring
          disabled:pointer-events-none disabled:opacity-50
          aria-disabled:pointer-events-none aria-disabled:opacity-50
          [&_svg]:pointer-events-none [&_svg]:shrink-0
          [&_svg:not([class*='size-'])]:size-4
        `,
        `
          group-data-[variant=line]/tabs-list:bg-transparent
          data-active:group-data-[variant=line]/tabs-list:border-transparent
          data-active:group-data-[variant=line]/tabs-list:bg-transparent
        `,
        `
          data-active:border-border! data-active:bg-input
          data-active:text-foreground data-active:shadow-2xs
          data-active:group-data-[variant=line]/tabs-list:border-transparent!
        `,
        `
          after:absolute after:bg-foreground after:opacity-0
          after:transition-opacity
          group-data-horizontal/tabs:after:inset-x-0
          group-data-horizontal/tabs:after:-bottom-1.25
          group-data-horizontal/tabs:after:h-0.5
          group-data-vertical/tabs:after:inset-y-0
          group-data-vertical/tabs:after:-right-1
          group-data-vertical/tabs:after:w-0.5
          data-active:group-data-[variant=line]/tabs-list:after:opacity-100
        `,
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn('flex-1 text-sm outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
