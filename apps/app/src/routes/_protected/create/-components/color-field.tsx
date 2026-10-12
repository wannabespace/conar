import { COLOR_OPTIONS } from '@tamery/shared/constants'
import { Field, FieldLabel } from '@tamery/ui/components/field'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@tamery/ui/components/toggle-group'
import type { CSSProperties } from 'react'

import type { ConnectionForm } from '../-lib/connection-form'

export const ColorField = ({ form }: { form: ConnectionForm }) => (
  <form.Subscribe selector={(state) => state.values.color}>
    {(color) => (
      <Field orientation="row">
        <FieldLabel htmlFor="color">Color</FieldLabel>
        <div className="px-2.5">
          <ToggleGroup
            id="color"
            aria-label="Color"
            value={color ? [color] : []}
            onValueChange={([next]) =>
              form.setFieldValue('color', next ?? null)
            }
          >
            {COLOR_OPTIONS.map((option) => (
              <ToggleGroupItem
                key={option}
                value={option}
                aria-label={`Color ${option}`}
                style={{ '--swatch': option } as CSSProperties}
              >
                <span className="size-full rounded-full bg-(--swatch)" />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </Field>
    )}
  </form.Subscribe>
)
