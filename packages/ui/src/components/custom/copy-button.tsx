import type { ComponentProps } from 'react'
import { copy } from '@conar/ui/lib/copy'
import { RiCheckLine, RiFileCopyLine } from '@remixicon/react'
import { useState } from 'react'
import { Button } from '../button'
import { ContentSwitch } from './content-switch'

type Size = Extract<ComponentProps<typeof Button>['size'], `icon-${string}`>

export function CopyButton({ text, copiedText, ...props }: { text: string, copiedText?: string, className?: string, size?: Size }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    copy(text, copiedText)
    setCopied(true)
  }

  return (
    <Button
      {...props}
      variant="ghost"
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
