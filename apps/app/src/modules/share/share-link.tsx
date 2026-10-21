import { LinkSquare02Icon } from '@hugeicons/core-free-icons'
import { CopyIconButton } from '@tamery/ui/components/custom/copy-button'
import { IconButton } from '@tamery/ui/components/custom/icon-button'
import { Field, FieldLabel } from '@tamery/ui/components/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@tamery/ui/components/input-group'

import { shareUrl } from '~/lib/urls'

export const ShareLinkField = ({ shareId }: { shareId: string }) => (
  <Field>
    <FieldLabel htmlFor="share-link">Link</FieldLabel>
    <InputGroup>
      <InputGroupInput
        id="share-link"
        readOnly
        value={shareUrl(shareId)}
        data-mask
        onFocus={(event) => event.currentTarget.select()}
      />
      <InputGroupAddon align="inline-end">
        <CopyIconButton label="Copy link" text={shareUrl(shareId)} />
        <IconButton
          icon={LinkSquare02Icon}
          label="Open link"
          side="bottom"
          size="icon-xs"
          variant="ghost-muted"
          onClick={() => window.open(shareUrl(shareId), '_blank')}
        />
      </InputGroupAddon>
    </InputGroup>
  </Field>
)
