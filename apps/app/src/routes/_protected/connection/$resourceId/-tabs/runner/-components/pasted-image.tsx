import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { fileSize } from '@tamery/shared/files'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@tamery/ui/components/attachment'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'

export const PastedImage = ({
  image,
  onRemove,
}: {
  image: File
  onRemove: () => void
}) => (
  <Attachment size="xs" className="max-w-52">
    <AttachmentMedia variant="image">
      <img
        data-mask
        alt=""
        ref={(img) => {
          if (!img) {
            return
          }
          const url = URL.createObjectURL(image)
          img.src = url
          return () => URL.revokeObjectURL(url)
        }}
      />
    </AttachmentMedia>
    <AttachmentContent>
      <Tooltip>
        <TooltipTrigger render={<AttachmentTitle data-mask />}>
          {image.name}
        </TooltipTrigger>
        <TooltipContent data-mask>{image.name}</TooltipContent>
      </Tooltip>
      <AttachmentDescription>{fileSize(image.size)}</AttachmentDescription>
    </AttachmentContent>
    <AttachmentActions>
      <AttachmentAction aria-label="Remove image" onClick={onRemove}>
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
      </AttachmentAction>
    </AttachmentActions>
  </Attachment>
)
