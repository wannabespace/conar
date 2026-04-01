import type { ComponentProps, ReactNode } from 'react'
import { copy } from '@conar/ui/lib/copy'
import { RiCheckLine, RiFileCopyLine } from '@remixicon/react'
import { useState } from 'react'
import { Button } from '../button'
import { ContentSwitch } from './content-switch'

export function CopyButton({
  text,
  copyIcon = <RiFileCopyLine className="size-4" />,
  successIcon = <RiCheckLine className="size-4 text-success" />,
  ...props
}: {
  text: string | (() => string)
  copyIcon?: ReactNode
  successIcon?: ReactNode
} & Omit<ComponentProps<typeof Button>, 'children'>) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    copy(typeof text === 'function' ? text() : text)
    setCopied(true)
  }

  return (
    <Button
      {...props}
      onClick={(e) => {
        props.onClick?.(e)
        handleCopy()
      }}
    >
      <ContentSwitch
        active={copied}
        onSwitchEnd={() => setCopied(false)}
        activeContent={successIcon}
      >
        {copyIcon}
      </ContentSwitch>
    </Button>
  )
}
