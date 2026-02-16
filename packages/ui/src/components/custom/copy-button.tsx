import type { VariantProps } from 'class-variance-authority'
import type { buttonVariants } from '../button.variants'
import { copy } from '@conar/ui/lib/copy'
import { RiCheckLine, RiFileCopyLine } from '@remixicon/react'
import { useState } from 'react'
import { Button } from '../button'
import { ContentSwitch } from './content-switch'

export function CopyButton({
  text,
  variant = 'ghost',
  size = 'icon-sm',
  ...props
}: {
  text: string
  className?: string
  variant?: VariantProps<typeof buttonVariants>['variant']
  size?: VariantProps<typeof buttonVariants>['size']
  disabled?: boolean
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    copy(text)
    setCopied(true)
  }

  return (
    <Button
      {...props}
      size={size}
      variant={variant}
      onClick={handleCopy}
    >
      <ContentSwitch
        active={copied}
        onSwitchEnd={() => setCopied(false)}
        activeContent={<RiCheckLine className="size-4 text-success" />}
      >
        <RiFileCopyLine className="size-4" />
      </ContentSwitch>
    </Button>
  )
}
