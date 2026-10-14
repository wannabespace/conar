import type { DeepKeys } from '@tanstack/react-form'
import type { ComponentProps, ReactNode } from 'react'

import type {
  ConnectionForm,
  ConnectionFormValues,
} from '../lib/connection-form'

type FieldName = DeepKeys<ConnectionFormValues>

export const TextRow = ({
  children,
  form,
  label,
  locked,
  name,
  port,
  secret,
  ...input
}: Pick<
  ComponentProps<'input'>,
  'aria-label' | 'autoComplete' | 'placeholder'
> & {
  /** The input's end slot; a `secret` row has none. */
  children?: ReactNode
  form: ConnectionForm
  label: string
  locked: (field: string) => boolean
  name: FieldName
  port?: { label: string; name: FieldName; placeholder: string }
  secret?: boolean
}) => (
  <form.AppField name={name}>
    {(field) => (
      <field.Field orientation="row">
        <field.Label>{label}</field.Label>
        {secret ? (
          <field.PasswordInput
            variant="inset"
            data-mask
            autoComplete="off"
            disabled={locked(name)}
            {...input}
          />
        ) : (
          <field.Input
            variant="inset"
            data-mask
            spellCheck={false}
            autoComplete="off"
            disabled={locked(name)}
            {...input}
          >
            {children}
          </field.Input>
        )}
        {port && (
          <>
            <span className="text-muted-foreground">:</span>
            <form.AppField name={port.name}>
              {(portField) => (
                <div className="w-20 shrink-0">
                  <portField.Input
                    variant="inset"
                    aria-label={port.label}
                    data-mask
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={port.placeholder}
                    disabled={locked(port.name)}
                  />
                </div>
              )}
            </form.AppField>
          </>
        )}
      </field.Field>
    )}
  </form.AppField>
)
