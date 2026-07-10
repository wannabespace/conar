import { Form as FormPrimitive } from '@base-ui/react/form'
import type * as React from 'react'

export function Form({ className, ...props }: FormPrimitive.Props): React.ReactElement {
  return <FormPrimitive className={className} data-slot="form" {...props} />
}
