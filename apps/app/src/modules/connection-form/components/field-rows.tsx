import type { DeepKeys } from '@tanstack/react-form'
import type { ComponentProps, ReactNode } from 'react'

import type {
  ConnectionForm,
  ConnectionFormValues,
} from '../lib/connection-form'

type FieldName = DeepKeys<ConnectionFormValues>

interface RowProps extends Pick<
  ComponentProps<'input'>,
  'autoComplete' | 'placeholder'
> {
  form: ConnectionForm
  label: string
  locked: (field: string) => boolean
  name: FieldName
}

export const TextRow = ({
  after,
  children,
  form,
  label,
  locked,
  name,
  secret,
  ...input
}: RowProps & {
  after?: ReactNode
  /** The input's end slot; a `secret` row has none. */
  children?: ReactNode
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
        {after}
      </field.Field>
    )}
  </form.AppField>
)

export const HostRow = ({
  portLabel,
  portName,
  portPlaceholder,
  ...row
}: RowProps & {
  portLabel: string
  portName: FieldName
  portPlaceholder: string
}) => (
  <TextRow
    {...row}
    after={
      <>
        <span className="text-muted-foreground">:</span>
        <row.form.AppField name={portName}>
          {(field) => (
            <div className="w-20 shrink-0">
              <field.Input
                variant="inset"
                aria-label={portLabel}
                data-mask
                inputMode="numeric"
                autoComplete="off"
                placeholder={portPlaceholder}
                disabled={row.locked(portName)}
              />
            </div>
          )}
        </row.form.AppField>
      </>
    }
  />
)
