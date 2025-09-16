import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiCloseLine } from '@remixicon/react'

export function ChatImages({
  images,
  imageClassName,
  onRemove,
}: {
  images: { name: string, url: string }[]
  imageClassName?: string
  onRemove?: (index: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-3 border bg-muted/50 rounded-md p-2">
      {images.map((image, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <TooltipProvider key={`${image.name}-${index}`}>
          <Tooltip>
            <TooltipTrigger className="relative group">
              <img
                src={image.url}
                alt={image.name}
                className={cn('size-10 object-cover border rounded-md flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all', imageClassName)}
              />
              {onRemove && (
                <span
                  className="cursor-pointer absolute bg-background border z-10 -top-2 -right-2 size-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(index)
                  }}
                >
                  <RiCloseLine className="size-3" />
                </span>
              )}
              <div className="absolute inset-0 bg-black/5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="center"
              sideOffset={15}
              className="p-1 w-auto shadow-lg"
            >
              <div className="flex flex-col gap-2">
                <img
                  src={image.url}
                  alt={image.name}
                  className="max-w-[400px] max-h-[400px] object-contain rounded-md"
                />
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}
