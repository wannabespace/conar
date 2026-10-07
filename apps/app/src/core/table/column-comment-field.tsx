import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@tamery/ui/components/field'
import { Textarea } from '@tamery/ui/components/textarea'

export const CommentField = ({
  onValueChange,
  value,
}: {
  onValueChange: (value: string) => void
  // `undefined` when the caller does not save comments: the field hides.
  value: string | null | undefined
}) =>
  value !== undefined && (
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
