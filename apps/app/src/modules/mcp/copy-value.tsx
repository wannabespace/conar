import { CopyButton } from '@tamery/ui/components/custom/copy-button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'

export const CopyValue = ({
  label,
  onCopy,
  text,
}: {
  label: string
  onCopy: () => void
  text: string
}) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <CopyButton
          size="icon-xs"
          variant="ghost-muted"
          aria-label={label}
          text={text}
          onClick={onCopy}
        />
      }
    />
    <TooltipContent side="bottom">{label}</TooltipContent>
  </Tooltip>
)
