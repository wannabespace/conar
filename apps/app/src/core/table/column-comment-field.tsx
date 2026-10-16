import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@tamery/ui/components/field'
import { Textarea } from '@tamery/ui/components/textarea'
import { getRouteApi } from '@tanstack/react-router'

import { getCapabilities } from '~/core/catalog/capabilities'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const CommentField = ({
  onValueChange,
  value,
}: {
  onValueChange: (value: string) => void
  value: string | null
}) => {
  const { dialect } = useRouteContext()

  if (!getCapabilities(dialect).comments) {
    return null
  }

  return (
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
}
