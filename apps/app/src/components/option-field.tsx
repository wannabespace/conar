import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from '@tamery/ui/components/field'
import type { ReactNode } from 'react'

export const OptionField = ({
  children,
  description,
  htmlFor,
  title,
}: {
  children: ReactNode
  description: ReactNode
  htmlFor: string
  title: ReactNode
}) => (
  <FieldLabel htmlFor={htmlFor}>
    <Field orientation="horizontal">
      <FieldContent>
        <FieldTitle>{title}</FieldTitle>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      {children}
    </Field>
  </FieldLabel>
)
