import { FolderOpenIcon } from '@hugeicons/core-free-icons'
import { IconButton } from '@tamery/ui/components/custom/icon-button'
import { useRef } from 'react'
import { toast } from 'sonner'

const MAX_FILE_BYTES = 256 * 1024

export const LoadFileButton = ({
  disabled,
  onLoad,
}: {
  disabled?: boolean
  onLoad: (text: string) => void
}) => {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <IconButton
        variant="ghost-row"
        size="icon-sm"
        icon={FolderOpenIcon}
        label="Load from file"
        disabled={disabled}
        onClick={() => fileRef.current?.click()}
      />
      <input
        ref={fileRef}
        type="file"
        hidden
        onChange={async (event) => {
          const input = event.currentTarget
          const [file] = input.files ?? []
          input.value = ''
          if (!file) {
            return
          }
          if (file.size > MAX_FILE_BYTES) {
            toast.error(`Pick a file under ${MAX_FILE_BYTES / 1024} KB`)
            return
          }
          onLoad(await file.text())
        }}
      />
    </>
  )
}
