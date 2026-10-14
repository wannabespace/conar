import { FolderOpenIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ComponentProps } from 'react'
import { useRef } from 'react'

import { Button } from '../button'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '../input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip'
import type { FormInputProps } from './context'
import { formInputProps, useFieldContext } from './context'
import { FieldError } from './field-error'

const MAX_FILE_BYTES = 256 * 1024

export const FieldTextarea = ({
  disabled,
  fileLabel,
  variant,
  ...props
}: Omit<ComponentProps<typeof InputGroupTextarea>, keyof FormInputProps> &
  Pick<ComponentProps<typeof InputGroup>, 'variant'> & {
    /** Offers loading the value from a picked or dropped file, under this label. A drop it takes is `preventDefault`ed, so a document-level drop handler can skip it. */
    fileLabel?: string
  }) => {
  const field = useFieldContext<string>()
  const takesFile = !!fileLabel && !disabled
  const fileRef = useRef<HTMLInputElement>(null)
  const load = async (file: File | undefined) => {
    if (file && file.size <= MAX_FILE_BYTES) {
      field.handleChange(await file.text())
    }
  }

  return (
    <InputGroup variant={variant}>
      <InputGroupTextarea
        onDragOver={
          takesFile
            ? (event) => {
                if (event.dataTransfer.types.includes('Files')) {
                  event.preventDefault()
                }
              }
            : undefined
        }
        onDrop={
          takesFile
            ? (event) => {
                const [file] = event.dataTransfer.files
                if (file) {
                  event.preventDefault()
                  void load(file)
                }
              }
            : undefined
        }
        disabled={disabled}
        {...props}
        {...formInputProps(field)}
      />
      <InputGroupAddon align="inline-end">
        {fileLabel && (
          <>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost-row"
                    size="icon-sm"
                    aria-label={fileLabel}
                    disabled={disabled}
                    onClick={() => fileRef.current?.click()}
                  />
                }
              >
                <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={2} />
              </TooltipTrigger>
              <TooltipContent>{fileLabel}</TooltipContent>
            </Tooltip>
            <input
              ref={fileRef}
              type="file"
              hidden
              onChange={(event) => {
                const input = event.currentTarget
                void load(input.files?.[0])
                input.value = ''
              }}
            />
          </>
        )}
        <FieldError />
      </InputGroupAddon>
    </InputGroup>
  )
}
