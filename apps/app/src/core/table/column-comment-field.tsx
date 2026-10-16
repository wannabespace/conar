import type { Dialect } from '@tamery/shared/enums/connection-type'
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@tamery/ui/components/field'
import { Textarea } from '@tamery/ui/components/textarea'

import { getCapabilities } from '~/core/catalog/capabilities'

export const CommentField = ({
  dialect,
  onValueChange,
  value,
}: {
  dialect: Dialect
  onValueChange: (value: string) => void
  value: string | null
}) =>
  getCapabilities(dialect).comments && (
    <Field>
      <FieldLabel htmlFor="column-dialog-comment">Comment</FieldLabel>
      <Textarea
        id="column-dialog-comment"
        value={value ?? ''}
        onChange={(e) => onValueChange(e.target.value)}
        data-mask
      />
      <FieldDescription>
        Saved in the database, where AI features and agents read it.
      </FieldDescription>
    </Field>
  )
