import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
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
    <div className="flex flex-wrap gap-3 rounded-md border bg-muted/50 p-2">
      {images.map((image, index) => (
        <div className="group relative" key={`${image.name}-${image.url}`}>
          <Tooltip>
            <TooltipTrigger className="align-middle">
              <img
                src={image.url}
                alt={image.name}
                className={cn(`
                  size-10 shrink-0 cursor-pointer rounded-md border object-cover
                  transition-all
                  hover:ring-2 hover:ring-primary/50
                `, imageClassName)}
              />
              <div className="
                absolute inset-0 rounded-md bg-black/5 opacity-0
                transition-opacity
                group-hover:opacity-100
              "
              />
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="center"
              sideOffset={15}
              className="w-auto p-1 shadow-lg"
            >
              <div className="flex flex-col gap-2">
                <img
                  src={image.url}
                  alt={image.name}
                  className="max-h-100 max-w-100 rounded-md object-contain"
                />
              </div>
            </TooltipContent>
          </Tooltip>
          {onRemove && (
            <button
              type="button"
              aria-label={`Remove ${image.name}`}
              className="
                absolute -top-2 -right-2 z-10 flex size-4 cursor-pointer
                items-center justify-center rounded-full border bg-background
                opacity-0 transition-opacity
                group-hover:opacity-100
              "
              onClick={(e) => {
                e.stopPropagation()
                onRemove(index)
              }}
            >
              <RiCloseLine className="size-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
