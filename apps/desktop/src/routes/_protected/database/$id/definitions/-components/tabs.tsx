import type { ComponentProps } from 'react'
import type { Definitions } from '~/entities/connection/store'
import { getOS } from '@conar/shared/utils/os'
import { ScrollArea, ScrollBar, ScrollViewport } from '@conar/ui/components/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiCloseLine, RiFileList3Line, RiKey2Line, RiListUnordered } from '@remixicon/react'
import { useRouter } from '@tanstack/react-router'
import { motion, Reorder } from 'motion/react'
import { Route } from '../../../$id'

const MotionScrollViewport = motion.create(ScrollViewport)

const os = getOS(navigator.userAgent)

function CloseButton({ onClick }: { onClick: (e: React.MouseEvent<SVGSVGElement>) => void }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <RiCloseLine
            className={`
              size-3.5 opacity-0
              group-hover:opacity-30
              hover:opacity-100
            `}
            onClick={onClick}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={12}>
          Close tab (
          {os.type === 'macos' ? '⌘' : 'Ctrl'}
          {' '}
          + W)
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function TabButton({
  className,
  children,
  active,
  onClose,
  icon: Icon,
  ...props
}: ComponentProps<'button'> & {
  active: boolean
  onClose: () => void
  icon: React.ElementType
}) {
  return (
    <button
      data-mask
      type="button"
      className={cn(
        `
          group flex h-full items-center gap-1 rounded-sm border
          border-transparent pr-1.5 pl-2 text-sm text-foreground
        `,
        'hover:border-accent hover:bg-muted/70',
        active && `
          border-primary/50 bg-primary/10 text-primary
          hover:border-primary/50 hover:bg-primary/10
        `,
        className,
      )}
      {...props}
    >
      <Icon
        className={cn(
          'size-4 shrink-0 text-muted-foreground opacity-50',
          active && 'text-primary opacity-100',
        )}
      />
      <span className="capitalize">
        {children}
      </span>
      <CloseButton
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      />
    </button>
  )
}

const icons = {
  indexes: RiFileList3Line,
  constraints: RiKey2Line,
  enums: RiListUnordered,
} as const

export function DefinitionsTabs({
  currentTab,
  tabs,
  onClose,
  onReorder,
  className,
}: {
  currentTab: Definitions
  tabs: Definitions[]
  onClose: (tab: Definitions) => void
  onReorder: (tabs: Definitions[]) => void
  className?: string
}) {
  const { id } = Route.useParams()
  const router = useRouter()

  return (
    <ScrollArea>
      <MotionScrollViewport
        layoutScroll
        className={cn('flex gap-1 p-1', className)}
      >
        <Reorder.Group
          axis="x"
          values={tabs}
          onReorder={onReorder}
          className="flex gap-1"
        >
          {tabs.map(tab => (
            <Reorder.Item
              key={tab}
              value={tab}
              as="div"
              className={`
                relative rounded-sm bg-background
                aria-pressed:z-10
              `}
            >
              <TabButton
                active={currentTab === tab}
                icon={icons[tab as keyof typeof icons] ?? RiFileList3Line}
                onClose={() => onClose(tab)}
                onClick={() => router.navigate({
                  to: `/database/$id/definitions/${tab}`,
                  params: { id },
                })}
              >
                {tab}
              </TabButton>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </MotionScrollViewport>
      <ScrollBar orientation="horizontal" className="h-2" />
    </ScrollArea>
  )
}
